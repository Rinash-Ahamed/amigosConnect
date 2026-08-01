import { NextRequest, NextResponse } from "next/server";

import { normalizeAllowedDeviceIds } from "@/lib/auth/device-access";
import {
  AUTHORIZED_DEVICE_COOKIE,
  AUTHORIZED_DEVICE_TTL_SECONDS,
  createAuthorizedDevice,
  isSecureRequest,
  readStaffSession,
  STAFF_SESSION_COOKIE,
} from "@/lib/auth/session";
import { serverDb } from "@/lib/firebase/server";
import { readJsonBody, RequestBodyError } from "@/lib/http/read-json";

const DEVICE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export async function POST(request: NextRequest) {
  const session = readStaffSession(
    request.cookies.get(STAFF_SESSION_COOKIE)?.value,
  );
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the Owner can authorize a device." },
      { status: 403 },
    );
  }
  if (!serverDb) {
    return NextResponse.json({ error: "Data service is unavailable." }, { status: 503 });
  }

  let body: { deviceId?: unknown };
  try {
    body = await readJsonBody<typeof body>(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: "Invalid request." }, { status });
  }

  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (!DEVICE_ID_PATTERN.test(deviceId)) {
    return NextResponse.json({ error: "Invalid device ID." }, { status: 400 });
  }

  const settingsSnapshot = await serverDb.doc("amigos_store/appSettings").get();
  const settings = settingsSnapshot.exists
    ? settingsSnapshot.data()?.value as Record<string, unknown> | undefined
    : undefined;
  const allowedDevices = normalizeAllowedDeviceIds(settings?.deviceAllowlist);
  const authorized = allowedDevices.includes(deviceId);
  const response = NextResponse.json({ authorized });

  response.cookies.set(
    AUTHORIZED_DEVICE_COOKIE,
    authorized ? createAuthorizedDevice(deviceId) : "",
    {
      httpOnly: true,
      sameSite: "strict",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: authorized ? AUTHORIZED_DEVICE_TTL_SECONDS : 0,
    },
  );
  return response;
}
