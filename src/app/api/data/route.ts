import { FieldPath } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { readRequestSession } from "@/lib/auth/request-session";
import { settingsForRole } from "@/lib/auth/settings-access";
import { serverDb } from "@/lib/firebase/server";
import { readJsonBody, RequestBodyError } from "@/lib/http/read-json";

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

function isBoundedString(value: unknown, maxLength: number, allowEmpty = true) {
  return typeof value === "string" && value.length <= maxLength && (allowEmpty || value.trim().length > 0);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function closeServerBreaks(data: DataRecord, clockOut: string) {
  if (!Array.isArray(data.breaks)) return [];
  return data.breaks.slice(0, 50).map((item, index, breaks) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return {};
    const entry = item as DataRecord;
    const start = typeof entry.start === "string" ? entry.start : null;
    const end = typeof entry.end === "string" ? entry.end : null;
    return {
      ...(start ? { start } : {}),
      ...(end ? { end } : index === breaks.length - 1 ? { end: clockOut } : {}),
    };
  });
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
    body = await readJsonBody<typeof body>(request, 32 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: "Invalid request." }, { status });
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

  if (
    !id ||
    id.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(id) ||
    !["add", "update", "remove"].includes(operation)
  ) {
    return NextResponse.json({ error: "Invalid operation." }, { status: 400 });
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
      const phone = data.phone;
      const email = data.email;
      const gender = data.gender;
      const address = data.address;
      if (
        !isBoundedString(phone, 30) ||
        !isBoundedString(email, 254) ||
        ((email as string).length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email as string)) ||
        !isBoundedString(address, 500) ||
        typeof gender !== "string" ||
        !["Select Gender", "Male", "Female", "Other"].includes(gender)
      ) {
        return NextResponse.json({ error: "Invalid profile details." }, { status: 400 });
      }
      data = { phone, email, gender, address };
    } else {
      if (!["timelogs", "leaves", "advances"].includes(collectionName)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      if (operation === "add") {
        const employeeSnapshot = await serverDb
          .collection("employees")
          .doc(session.employeeId)
          .get();
        if (!employeeSnapshot.exists) {
          return NextResponse.json({ error: "Employee account was not found." }, { status: 404 });
        }
        const employeeName = employeeSnapshot.data()?.name;
        if (typeof employeeName !== "string" || !employeeName) {
          return NextResponse.json({ error: "Employee account is invalid." }, { status: 409 });
        }

        if (collectionName === "timelogs") {
          const existingLogs = await serverDb
            .collection("timelogs")
            .where("employeeId", "==", session.employeeId)
            .get();
          if (existingLogs.docs.some(document => !document.data().clockOut)) {
            return NextResponse.json({ error: "You are already checked in." }, { status: 409 });
          }
          data = {
            id,
            employeeId: session.employeeId,
            name: employeeName,
            clockIn: new Date().toISOString(),
            clockOut: null,
          };
        } else if (collectionName === "leaves") {
          const { from, to, type, reason } = data;
          if (
            !isIsoDate(from) ||
            !isIsoDate(to) ||
            from > to ||
            !["Casual", "Sick", "Emergency"].includes(String(type)) ||
            !isBoundedString(reason, 500, false)
          ) {
            return NextResponse.json({ error: "Invalid leave request." }, { status: 400 });
          }
          data = {
            id,
            employeeId: session.employeeId,
            name: employeeName,
            from,
            to,
            type,
            reason: (reason as string).trim(),
            status: "pending",
            appliedAt: new Date().toISOString(),
          };
        } else {
          const amount = Number(data.amount);
          if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > 10_000_000 ||
            !isBoundedString(data.reason, 500, false)
          ) {
            return NextResponse.json({ error: "Invalid advance request." }, { status: 400 });
          }
          data = {
            id,
            employeeId: session.employeeId,
            name: employeeName,
            amount,
            reason: (data.reason as string).trim(),
            status: "pending",
            appliedAt: new Date().toISOString(),
          };
        }
      } else if (operation === "update") {
        if (collectionName !== "timelogs") {
          return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }
        const logSnapshot = await serverDb.collection("timelogs").doc(id).get();
        const log = logSnapshot.data() as DataRecord | undefined;
        if (!logSnapshot.exists || log?.employeeId !== session.employeeId) {
          return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }
        if (log.clockOut) {
          return NextResponse.json({ error: "This shift is already closed." }, { status: 409 });
        }
        const clockOut = new Date().toISOString();
        data = {
          clockOut,
          breaks: closeServerBreaks(log, clockOut),
        };
      } else {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }
  }

  if (operation === "remove" && collectionName === "employees") {
    return NextResponse.json({ error: "Use the Owner staff deletion endpoint." }, { status: 400 });
  }

  const reference = serverDb.collection(collectionName).doc(id);
  const timestampedData = { ...data, _updatedAt: Date.now() };
  if (operation === "add" && session.role === "employee") {
    try {
      await reference.create(timestampedData);
    } catch (error) {
      if ((error as { code?: number }).code === 6) {
        return NextResponse.json({ error: "Record already exists." }, { status: 409 });
      }
      throw error;
    }
  } else if (operation === "add") {
    await reference.set(timestampedData);
  }
  if (operation === "update") await reference.set(timestampedData, { merge: true });
  if (operation === "remove") await reference.delete();
  return NextResponse.json({ success: true });
}
