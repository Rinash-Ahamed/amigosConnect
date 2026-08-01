import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { isDeviceAllowed, normalizeAllowedDeviceIds } from "@/lib/auth/device-access";

import {
  createEmployeeSession,
  EMPLOYEE_SESSION_COOKIE,
  isSecureRequest,
  STAFF_SESSION_TTL_SECONDS,
} from "@/lib/auth/session";
import { serverDb } from "@/lib/firebase/server";
import { readJsonBody, RequestBodyError } from "@/lib/http/read-json";

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
  let body: { pin?: unknown; deviceId?: unknown };
  try {
    body = await readJsonBody<typeof body>(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: "Invalid request." }, { status });
  }
  if (typeof body.pin !== "string" || !/^\d{6}$/.test(body.pin)) {
    return NextResponse.json({ error: "PIN not recognized." }, { status: 401 });
  }
  if (typeof body.deviceId === "string" && body.deviceId.length > 256) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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
    const employeeData = documentSnapshot.data() as Record<string, unknown>;
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    const settingsSnapshot = await serverDb.doc("amigos_store/appSettings").get();
    const settingsData = (settingsSnapshot.exists ? settingsSnapshot.data()?.value ?? null : null) as Record<string, unknown> | null;
    const allowedDevices = normalizeAllowedDeviceIds(settingsData?.deviceAllowlist);
    if (!isDeviceAllowed(allowedDevices, deviceId)) {
      return NextResponse.json(
        { error: "This device is not authorized for this employee account." },
        { status: 401 },
      );
    }
    const employee = {
      ...employeeProfile(employeeData),
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
