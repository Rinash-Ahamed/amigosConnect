import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import {
  createStaffSession,
  isSecureRequest,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_TTL_SECONDS,
  type StaffRole,
} from "@/lib/auth/session";

function passwordsMatch(received: string, expected?: string) {
  if (!expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  let body: { role?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    (body.role !== "owner" && body.role !== "manager") ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { error: "Role and password are required." },
      { status: 400 },
    );
  }

  const role: StaffRole = body.role;
  const expected =
    role === "owner"
      ? process.env.OWNER_PASSWORD
      : process.env.MANAGER_PASSWORD;

  if (!process.env.AUTH_SECRET || !expected) {
    return NextResponse.json(
      { error: "Staff login is not configured." },
      { status: 503 },
    );
  }

  if (!passwordsMatch(body.password, expected)) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ role });
  response.cookies.set(STAFF_SESSION_COOKIE, createStaffSession(role), {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: STAFF_SESSION_TTL_SECONDS,
  });
  return response;
}
