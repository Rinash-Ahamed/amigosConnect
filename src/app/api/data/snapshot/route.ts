import { NextRequest, NextResponse } from "next/server";

import { readRequestSession } from "@/lib/auth/request-session";
import { serverDb } from "@/lib/firebase/server";

type DataRecord = Record<string, unknown>;

function withoutSalary(data: DataRecord) {
  const safe = { ...data };
  delete safe.hourlyRate;
  delete safe.dailySalary;
  delete safe.paymentCycle;
  return safe;
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
    const [employees, settings, timelogs, leaves, advances] = await Promise.all([
      serverDb.collection("employees").get(),
      serverDb.doc("amigos_store/appSettings").get(),
      serverDb.collection("timelogs").get(),
      serverDb.collection("leaves").get(),
      session.role === "owner" ? serverDb.collection("advances").get() : null,
    ]);
    return NextResponse.json({
      employees: employees.docs.map(item => {
        const data = item.data() as DataRecord;
        return session.role === "owner" ? data : withoutSalary(data);
      }),
      appSettings: settings.exists ? settings.data()?.value ?? null : null,
      timelogs: timelogs.docs.map(item => item.data()),
      leaves: leaves.docs.map(item => item.data()),
      advances: advances?.docs.map(item => item.data()) ?? [],
    });
  } catch (error) {
    console.error("Dashboard snapshot failed:", error);
    return NextResponse.json({ error: "Data service is unavailable." }, { status: 503 });
  }
}
