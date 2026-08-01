import "server-only";

import type { NextRequest } from "next/server";

import {
  AUTHORIZED_DEVICE_COOKIE,
  EMPLOYEE_SESSION_COOKIE,
  readAuthorizedDevice,
  readEmployeeSession,
  readStaffSession,
  STAFF_SESSION_COOKIE,
} from "@/lib/auth/session";

export function readRequestSession(request: NextRequest) {
  const authorizedDevice = readAuthorizedDevice(
    request.cookies.get(AUTHORIZED_DEVICE_COOKIE)?.value,
  );
  return (
    readStaffSession(request.cookies.get(STAFF_SESSION_COOKIE)?.value) ||
    readEmployeeSession(
      request.cookies.get(EMPLOYEE_SESSION_COOKIE)?.value,
      authorizedDevice?.deviceId,
    )
  );
}
