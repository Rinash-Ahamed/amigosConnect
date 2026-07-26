import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readStaffSession, STAFF_SESSION_COOKIE } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = await cookies();
  const session = readStaffSession(cookieStore.get(STAFF_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ role: null }, { status: 401 });
  }
  return NextResponse.json({ role: session.role });
}
