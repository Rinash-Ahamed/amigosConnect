import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createEmployeeSession,
  EMPLOYEE_SESSION_COOKIE,
  isSecureRequest,
  STAFF_SESSION_TTL_SECONDS,
} from "@/lib/auth/session";
import { serverDb } from "@/lib/firebase/server";

function employeeProfile(data: Record<string, unknown>) {
  const profile = { ...data };
  delete profile.pin;
  delete profile.hourlyRate;
  delete profile.dailySalary;
  delete profile.paymentCycle;
  return profile;
}

function matchesDevelopmentPin(pin: string) {
  const developmentPin = process.env.DEV_EMPLOYEE_PIN;
  if (
    process.env.NODE_ENV === "production" ||
    !developmentPin ||
    !/^\d{6}$/.test(developmentPin)
  ) {
    return false;
  }
  const received = Buffer.from(pin);
  const expected = Buffer.from(developmentPin);
  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
}

export async function POST(request: Request) {
  let body: { pin?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.pin !== "string" || !/^\d{6}$/.test(body.pin)) {
    return NextResponse.json({ error: "PIN not recognized." }, { status: 401 });
  }
  if (!serverDb || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Staff login is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  try {
    const employees = serverDb.collection("employees");
    const snapshot = matchesDevelopmentPin(body.pin)
      ? await employees.limit(1).get()
      : await employees.where("pin", "==", body.pin).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json(
        {
          error: matchesDevelopmentPin(body.pin)
            ? "Add a staff account before using the development PIN."
            : "PIN not recognized. Check your PIN or contact the Owner.",
        },
        { status: 401 },
      );
    }

    const documentSnapshot = snapshot.docs[0];
    const employee = {
      ...employeeProfile(documentSnapshot.data()),
      id: documentSnapshot.id,
    };
    const response = NextResponse.json({ employee });
    response.cookies.set(
      EMPLOYEE_SESSION_COOKIE,
      createEmployeeSession(documentSnapshot.id),
      {
        httpOnly: true,
        sameSite: "strict",
        secure: isSecureRequest(request),
        path: "/",
        maxAge: STAFF_SESSION_TTL_SECONDS,
      },
    );
    return response;
  } catch (error) {
    console.error("Employee login failed:", error);
    return NextResponse.json(
      { error: "Staff login is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
