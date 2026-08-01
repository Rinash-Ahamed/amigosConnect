import { NextResponse } from "next/server";

import { verifyStaffPassword } from "@/lib/auth/staff-credentials";
import {
  consumeLoginAttempt,
  loginRateLimitResponse,
  resetLoginAttempts,
} from "@/lib/auth/login-rate-limit";
import {
  createStaffSession,
  isSecureRequest,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_TTL_SECONDS,
  type StaffRole,
} from "@/lib/auth/session";
import { readJsonBody, RequestBodyError } from "@/lib/http/read-json";

export async function POST(request: Request) {
  let body: { role?: unknown; password?: unknown };
  try {
    body = await readJsonBody<typeof body>(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: "Invalid request." }, { status });
  }

  if (
    (body.role !== "owner" && body.role !== "manager") ||
    typeof body.password !== "string" ||
    body.password.length === 0 ||
    body.password.length > 256
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

  let rateLimit;
  try {
    rateLimit = await consumeLoginAttempt(request, role);
  } catch (error) {
    console.error(`${roleLabel} login rate limit failed:`, error);
    return NextResponse.json(
      { error: `${roleLabel} login is temporarily unavailable. Please try again.` },
      { status: 503 },
    );
  }
  if (!rateLimit.allowed) {
    return loginRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  let passwordMatches = false;
  try {
    passwordMatches = await verifyStaffPassword(role, body.password);
  } catch (error) {
    console.error(`${roleLabel} credential lookup failed:`, error);
    return NextResponse.json(
      {
        error: `${roleLabel} login is temporarily unavailable. Please try again.`,
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


  try {
    await resetLoginAttempts(rateLimit.key);
  } catch (error) {
    console.error(`${roleLabel} login rate limit reset failed:`, error);
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
