import { NextRequest, NextResponse } from "next/server";

import { readRequestSession } from "@/lib/auth/request-session";
import { serverDb } from "@/lib/firebase/server";

type BatchCollection = "employees" | "timelogs";
type DataRecord = Record<string, unknown>;

const ALLOWED_FIELDS: Record<BatchCollection, ReadonlySet<string>> = {
  employees: new Set(["branch"]),
  timelogs: new Set([
    "clockOut",
    "breaks",
    "autoClockedOut",
    "autoClockOutReason",
  ]),
};

function isRecord(value: unknown): value is DataRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  const session = readRequestSession(request);
  if (!session || session.role === "employee") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!serverDb) {
    return NextResponse.json({ error: "Data service is unavailable." }, { status: 503 });
  }

  let body: { updates?: unknown; settings?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const updates = Array.isArray(body.updates) ? body.updates : [];
  const hasSettings = body.settings !== undefined;
  if (
    updates.length + Number(hasSettings) === 0 ||
    updates.length + Number(hasSettings) > 500 ||
    (hasSettings && (!isRecord(body.settings) || session.role !== "owner"))
  ) {
    return NextResponse.json({ error: "Invalid batch request." }, { status: 400 });
  }

  const normalizedUpdates: Array<{
    collection: BatchCollection;
    id: string;
    data: DataRecord;
  }> = [];
  const targets = new Set<string>();

  for (const update of updates) {
    if (!isRecord(update)) {
      return NextResponse.json({ error: "Invalid batch update." }, { status: 400 });
    }
    const collection = update.collection;
    const id = update.id;
    const data = update.data;
    if (
      (collection !== "employees" && collection !== "timelogs") ||
      typeof id !== "string" ||
      id.length === 0 ||
      id.includes("/") ||
      !isRecord(data)
    ) {
      return NextResponse.json({ error: "Invalid batch update." }, { status: 400 });
    }

    const entries = Object.entries(data);
    if (
      entries.length === 0 ||
      entries.some(([key]) => !ALLOWED_FIELDS[collection].has(key))
    ) {
      return NextResponse.json({ error: "Invalid update fields." }, { status: 400 });
    }

    const target = `${collection}/${id}`;
    if (targets.has(target)) {
      return NextResponse.json({ error: "Duplicate batch target." }, { status: 400 });
    }
    targets.add(target);
    normalizedUpdates.push({ collection, id, data });
  }

  try {
    const batch = serverDb.batch();
    const updatedAt = Date.now();
    normalizedUpdates.forEach(({ collection, id, data }) => {
      batch.set(
        serverDb!.collection(collection).doc(id),
        { ...data, _updatedAt: updatedAt },
        { merge: true },
      );
    });
    if (hasSettings) {
      batch.set(
        serverDb.doc("amigos_store/appSettings"),
        { value: body.settings, _updatedAt: updatedAt },
        { merge: true },
      );
    }
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Atomic data update failed:", error);
    return NextResponse.json({ error: "Data update failed." }, { status: 503 });
  }
}
