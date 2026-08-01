import { NextRequest, NextResponse } from "next/server";

import {
  createEmployeeSession,
  createStaffSession,
  EMPLOYEE_SESSION_COOKIE,
  isSecureRequest,
  readEmployeeSession,
  readStaffSession,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_TTL_SECONDS,
} from "@/lib/auth/session";

function refreshSession(request: NextRequest, unauthenticatedStatus = 401) {
  const staffSession = readStaffSession(
    request.cookies.get(STAFF_SESSION_COOKIE)?.value,
  );
  const employeeSession = readEmployeeSession(
    request.cookies.get(EMPLOYEE_SESSION_COOKIE)?.value,
  );
  const session = staffSession || employeeSession;
  if (!session) {
    return NextResponse.json(
      { role: null },
      { status: unauthenticatedStatus },
    );
  }

  const response = NextResponse.json({
    role: session.role,
    ...(session.role === "employee" ? { employeeId: session.employeeId } : {}),
  });
  if (session.role === "employee") {
    response.cookies.set(
      EMPLOYEE_SESSION_COOKIE,
      createEmployeeSession(session.employeeId),
      {
        httpOnly: true,
        sameSite: "strict",
        secure: isSecureRequest(request),
        path: "/",
        maxAge: STAFF_SESSION_TTL_SECONDS,
      },
    );
  } else {
    response.cookies.set(STAFF_SESSION_COOKIE, createStaffSession(session.role), {
      httpOnly: true,
      sameSite: "strict",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: STAFF_SESSION_TTL_SECONDS,
    });
  }
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
