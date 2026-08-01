import { NextRequest, NextResponse } from "next/server";
import type { Query } from "firebase-admin/firestore";

import { readRequestSession } from "@/lib/auth/request-session";
import { settingsForRole } from "@/lib/auth/settings-access";
import { serverDb } from "@/lib/firebase/server";

type DataRecord = Record<string, unknown>;

function withoutSalary(data: DataRecord) {
  const safe = { ...data };
  delete safe.hourlyRate;
  delete safe.dailySalary;
  delete safe.paymentCycle;
  return safe;
}

async function readCollection(collectionName: string, since: number | null) {
  let query: Query = serverDb!.collection(collectionName);
  if (since !== null) {
    query = query.where("_updatedAt", ">=", since);
  }
  const snapshot = await query.get();
  return snapshot.docs.map(item => ({
    ...(item.data() as DataRecord),
    id: item.id,
  }));
}

export async function GET(request: NextRequest) {
  const session = readRequestSession(request);
  if (!session || session.role === "employee") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!serverDb) {
    return NextResponse.json({ error: "Data service is unavailable." }, { status: 503 });
  }

  try {
    const requestedSince = Number(request.nextUrl.searchParams.get("since"));
    const since = Number.isFinite(requestedSince) && requestedSince > 0
      ? requestedSince
      : null;
    const cursor = Date.now();
    const [employees, settings, timelogs, leaves, advances] = await Promise.all([
      readCollection("employees", since),
      serverDb.doc("amigos_store/appSettings").get(),
      readCollection("timelogs", since),
      readCollection("leaves", since),
      session.role === "owner" ? readCollection("advances", since) : [],
    ]);
    return NextResponse.json({
      role: session.role,
      full: since === null,
      cursor,
      employees: employees.map(data => {
        return session.role === "owner" ? data : withoutSalary(data);
      }),
      appSettings: settingsForRole(
        settings.exists ? settings.data()?.value as DataRecord ?? null : null,
        session.role,
      ),
      timelogs,
      leaves,
      advances,
    });
  } catch (error) {
    console.error("Dashboard snapshot failed:", error);
    return NextResponse.json({ error: "Data service is unavailable." }, { status: 503 });
  }
}
