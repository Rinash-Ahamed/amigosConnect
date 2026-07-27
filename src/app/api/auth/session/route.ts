import { NextRequest, NextResponse } from "next/server";

import {
  createStaffSession,
  isSecureRequest,
  readStaffSession,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_TTL_SECONDS,
} from "@/lib/auth/session";

function refreshSession(request: NextRequest, unauthenticatedStatus = 401) {
  const session = readStaffSession(
    request.cookies.get(STAFF_SESSION_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json(
      { role: null },
      { status: unauthenticatedStatus },
    );
  }

  const response = NextResponse.json({ role: session.role });
  response.cookies.set(STAFF_SESSION_COOKIE, createStaffSession(session.role), {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: STAFF_SESSION_TTL_SECONDS,
  });
  return response;
}

export async function GET(request: NextRequest) {
  // An initial session lookup without a cookie is an expected logged-out state,
  // not an authentication failure.
  return refreshSession(request, 200);
}

export async function POST(request: NextRequest) {
  return refreshSession(request);
}
