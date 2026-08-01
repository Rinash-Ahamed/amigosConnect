import { FieldPath } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { readRequestSession } from "@/lib/auth/request-session";
import { settingsForRole } from "@/lib/auth/settings-access";
import { serverDb } from "@/lib/firebase/server";

const COLLECTIONS = ["employees", "timelogs", "leaves", "advances", "branches"] as const;
type CollectionName = (typeof COLLECTIONS)[number];
type DataRecord = Record<string, unknown>;

function isCollection(value: string | null): value is CollectionName {
  return COLLECTIONS.includes(value as CollectionName);
}

function withoutSalary(data: DataRecord) {
  const safe = { ...data };
  delete safe.hourlyRate;
  delete safe.dailySalary;
  delete safe.paymentCycle;
  return safe;
}

function employeeProfile(data: DataRecord) {
  const safe = withoutSalary(data);
  delete safe.pin;
  return safe;
}

function sanitizeEmployee(data: DataRecord, role: "owner" | "manager" | "employee") {
  if (role === "owner") return data;
  return role === "manager" ? withoutSalary(data) : employeeProfile(data);
}

async function ownsRecord(collection: CollectionName, id: string, employeeId: string) {
  if (!serverDb) return false;
  if (collection === "employees") return id === employeeId;
  const snapshot = await serverDb.collection(collection).doc(id).get();
  return snapshot.exists && snapshot.data()?.employeeId === employeeId;
}

export async function GET(request: NextRequest) {
  const session = readRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!serverDb) {
    return NextResponse.json({ error: "Data service is unavailable." }, { status: 503 });
  }

  const collectionName = request.nextUrl.searchParams.get("collection");
  const id = request.nextUrl.searchParams.get("id");
  const field = request.nextUrl.searchParams.get("field");
  const value = request.nextUrl.searchParams.get("value");

  if (collectionName === "appSettings") {
    const snapshot = await serverDb.doc("amigos_store/appSettings").get();
    const settings = snapshot.exists
      ? snapshot.data()?.value as DataRecord ?? null
      : null;
    return NextResponse.json({ data: settingsForRole(settings, session.role) });
  }
  if (!isCollection(collectionName)) {
    return NextResponse.json({ error: "Invalid collection." }, { status: 400 });
  }
  if (session.role === "manager" && collectionName === "advances") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (session.role === "employee") {
    if (collectionName === "employees") {
      const snapshot = await serverDb.collection("employees").doc(session.employeeId).get();
      return NextResponse.json({
        data: snapshot.exists
          ? sanitizeEmployee(snapshot.data() as DataRecord, "employee")
          : null,
      });
    }
    const snapshot = await serverDb
      .collection(collectionName)
      .where("employeeId", "==", session.employeeId)
      .get();
    return NextResponse.json({ data: snapshot.docs.map(item => item.data()) });
  }

  if (id) {
    const snapshot = await serverDb.collection(collectionName).doc(id).get();
    const data = snapshot.exists ? snapshot.data() as DataRecord : null;
    return NextResponse.json({
      data: data && collectionName === "employees"
        ? sanitizeEmployee(data, session.role)
        : data,
    });
  }

  let query: FirebaseFirestore.Query = serverDb.collection(collectionName);
  if (field && value !== null) {
    if (field !== "employeeId") {
      return NextResponse.json({ error: "Invalid query." }, { status: 400 });
    }
    query = query.where(new FieldPath(field), "==", value);
  }
  const snapshot = await query.get();
  const data = snapshot.docs.map(item => {
    const record = item.data() as DataRecord;
    return collectionName === "employees"
      ? sanitizeEmployee(record, session.role)
      : record;
  });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = readRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!serverDb) {
    return NextResponse.json({ error: "Data service is unavailable." }, { status: 503 });
  }

  let body: {
    operation?: unknown;
    collection?: unknown;
    id?: unknown;
    data?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    typeof body.collection !== "string" ||
    (body.collection !== "appSettings" && !isCollection(body.collection)) ||
    typeof body.operation !== "string" ||
    typeof body.data !== "object" ||
    body.data === null
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const collectionName = body.collection;
  const operation = body.operation;
  const id = typeof body.id === "string" ? body.id : "";
  let data = body.data as DataRecord;

  if (collectionName === "appSettings") {
    if (session.role !== "owner" || operation !== "set") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    await serverDb.doc("amigos_store/appSettings").set(
      { value: data, _updatedAt: Date.now() },
      { merge: true },
    );
    return NextResponse.json({ success: true });
  }

  if (session.role === "manager" && collectionName === "advances") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (session.role === "manager" && collectionName === "employees") {
    data = withoutSalary(data);
  }

  if (session.role === "employee") {
    if (operation === "remove") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (collectionName === "employees") {
      if (operation !== "update" || id !== session.employeeId) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      const allowedFields = ["phone", "email", "gender", "address"];
      data = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key)),
      );
    } else {
      if (!["timelogs", "leaves", "advances"].includes(collectionName)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      if (operation === "add" && data.employeeId !== session.employeeId) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      if (operation === "update") {
        if (
          collectionName !== "timelogs" ||
          !await ownsRecord(collectionName, id, session.employeeId)
        ) {
          return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }
        const allowedFields = [
          "clockOut",
          "breaks",
          "autoClockedOut",
          "autoClockOutReason",
        ];
        data = Object.fromEntries(
          Object.entries(data).filter(([key]) => allowedFields.includes(key)),
        );
      }
    }
  }

  if (!id || id.includes("/") || !["add", "update", "remove"].includes(operation)) {
    return NextResponse.json({ error: "Invalid operation." }, { status: 400 });
  }
  if (operation === "remove" && collectionName === "employees") {
    return NextResponse.json({ error: "Use the Owner staff deletion endpoint." }, { status: 400 });
  }

  const reference = serverDb.collection(collectionName).doc(id);
  const timestampedData = { ...data, _updatedAt: Date.now() };
  if (operation === "add") await reference.set(timestampedData);
  if (operation === "update") await reference.set(timestampedData, { merge: true });
  if (operation === "remove") await reference.delete();
  return NextResponse.json({ success: true });
}
