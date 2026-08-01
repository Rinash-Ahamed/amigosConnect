import { NextResponse } from "next/server";

import {
  EMPLOYEE_SESSION_COOKIE,
  isSecureRequest,
  STAFF_SESSION_COOKIE,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(EMPLOYEE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });
  return response;
}
