import { NextResponse } from "next/server";

import { verifyStaffPassword } from "@/lib/auth/staff-credentials";
import { isServerFirestoreConfigured } from "@/lib/firebase/server";
import {
  createStaffSession,
  isSecureRequest,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_TTL_SECONDS,
  type StaffRole,
} from "@/lib/auth/session";

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
  const roleLabel = role === "owner" ? "Owner" : "Manager";
  if (!process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: `${roleLabel} login is not configured.` },
      { status: 503 },
    );
  }

  let passwordMatches = false;
  try {
    passwordMatches = await verifyStaffPassword(role, body.password);
  } catch (error) {
    console.error(`${roleLabel} credential lookup failed:`, error);
    return NextResponse.json(
      {
        error: isServerFirestoreConfigured
          ? `${roleLabel} login could not read its credentials from Firestore.`
          : `${roleLabel} login needs FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.`,
      },
      { status: 503 },
    );
  }

  if (!passwordMatches) {
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
