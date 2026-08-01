import { NextRequest, NextResponse } from "next/server";

import { readStaffSession, STAFF_SESSION_COOKIE } from "@/lib/auth/session";
import {
  resetStaffPassword,
  updateStaffPassword,
} from "@/lib/auth/staff-credentials";
import { readJsonBody, RequestBodyError } from "@/lib/http/read-json";

export async function POST(request: NextRequest) {
  const session = readStaffSession(
    request.cookies.get(STAFF_SESSION_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json({ error: "Your session has expired." }, { status: 401 });
  }

  let body: {
    currentPassword?: unknown;
    newPassword?: unknown;
    targetRole?: unknown;
  };
  try {
    body = await readJsonBody<typeof body>(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: "Invalid request." }, { status });
  }

  if (typeof body.newPassword !== "string") {
    return NextResponse.json(
      { error: "A new password is required." },
      { status: 400 },
    );
  }

  if (body.newPassword.length < 8) {
    return NextResponse.json(
      { error: "The new password must be at least 8 characters." },
      { status: 400 },
    );
  }

  if (body.newPassword.length > 256) {
    return NextResponse.json(
      { error: "The new password is too long." },
      { status: 400 },
    );
  }

  const targetRole =
    body.targetRole === "owner" || body.targetRole === "manager"
      ? body.targetRole
      : session.role;
  const targetRoleLabel = targetRole === "owner" ? "Owner" : "Manager";

  if (session.role !== "owner" && targetRole !== session.role) {
    return NextResponse.json(
      { error: "Only the Owner can change another role's password." },
      { status: 403 },
    );
  }

  const ownerResettingPassword = session.role === "owner";

  if (
    !ownerResettingPassword &&
    (typeof body.currentPassword !== "string" ||
      body.currentPassword.length === 0 ||
      body.currentPassword.length > 256)
  ) {
    return NextResponse.json(
      { error: "The current password is required." },
      { status: 400 },
    );
  }

  try {
    if (ownerResettingPassword) {
      await resetStaffPassword(targetRole, body.newPassword);
      return NextResponse.json({ success: true });
    }

    const updated = await updateStaffPassword(
      session.role,
      targetRole,
      body.currentPassword as string,
      body.newPassword,
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`${targetRoleLabel} password update failed:`, error);
    return NextResponse.json(
      { error: `Could not update the ${targetRoleLabel} password in Firestore.` },
      { status: 503 },
    );
  }
}
