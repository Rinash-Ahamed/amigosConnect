import { createHmac, timingSafeEqual } from "node:crypto";

export const STAFF_SESSION_COOKIE = "amigos_staff_session";
export const STAFF_SESSION_TTL_SECONDS = 5 * 60;

export type StaffRole = "owner" | "manager";

export function isSecureRequest(request: Request) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  return forwardedProtocol
    ? forwardedProtocol.split(",")[0]?.trim() === "https"
    : new URL(request.url).protocol === "https:";
}

interface StaffSessionPayload {
  role: StaffRole;
  expiresAt: number;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createStaffSession(role: StaffRole) {
  const payload: StaffSessionPayload = {
    role,
    expiresAt: Date.now() + STAFF_SESSION_TTL_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readStaffSession(token?: string): StaffSessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as StaffSessionPayload;
    if (
      !["owner", "manager"].includes(payload.role) ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
