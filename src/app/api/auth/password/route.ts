import { NextRequest, NextResponse } from "next/server";

import { readStaffSession, STAFF_SESSION_COOKIE } from "@/lib/auth/session";
import { updateStaffPassword } from "@/lib/auth/staff-credentials";

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
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    typeof body.currentPassword !== "string" ||
    typeof body.newPassword !== "string"
  ) {
    return NextResponse.json(
      { error: "Current and new passwords are required." },
      { status: 400 },
    );
  }

  if (body.newPassword.length < 8) {
    return NextResponse.json(
      { error: "The new password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const targetRole =
    body.targetRole === "owner" || body.targetRole === "manager"
      ? body.targetRole
      : session.role;

  if (session.role !== "owner" && targetRole !== session.role) {
    return NextResponse.json(
      { error: "Only the Owner can change another role's password." },
      { status: 403 },
    );
  }

  try {
    const updated = await updateStaffPassword(
      session.role,
      targetRole,
      body.currentPassword,
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
    console.error("Staff password update failed:", error);
    return NextResponse.json(
      { error: "Could not update the password in Firestore." },
      { status: 503 },
    );
  }
}
