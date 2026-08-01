import "server-only";

import type { NextRequest } from "next/server";

import {
  EMPLOYEE_SESSION_COOKIE,
  readEmployeeSession,
  readStaffSession,
  STAFF_SESSION_COOKIE,
} from "@/lib/auth/session";

export function readRequestSession(request: NextRequest) {
  return (
    readStaffSession(request.cookies.get(STAFF_SESSION_COOKIE)?.value) ||
    readEmployeeSession(request.cookies.get(EMPLOYEE_SESSION_COOKIE)?.value)
  );
}
