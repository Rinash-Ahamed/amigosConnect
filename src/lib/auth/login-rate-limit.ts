import { createHmac } from "node:crypto";

import { serverDb } from "@/lib/firebase/server";

const RATE_LIMIT_COLLECTION = "authRateLimits";
const MAX_ATTEMPTS = {
  owner: 5,
  manager: 5,
  employee: 30,
} as const;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

type RateLimitData = {
  attempts?: number;
  windowStartedAt?: number;
  blockedUntil?: number;
};

export type LoginRateLimit = {
  allowed: boolean;
  key: string;
  retryAfterSeconds: number;
};

function clientAddress(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwardedIp || "unknown";
}

function rateLimitKey(request: Request, scope: string, subject?: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured.");
  return createHmac("sha256", secret)
    .update(`${scope}|${subject || clientAddress(request)}`)
    .digest("hex");
}

export async function consumeLoginAttempt(
  request: Request,
  scope: "owner" | "manager" | "employee",
  subject?: string,
): Promise<LoginRateLimit> {
  if (!serverDb) throw new Error("Data service is unavailable.");

  const key = rateLimitKey(request, scope, subject);
  const reference = serverDb.collection(RATE_LIMIT_COLLECTION).doc(key);
  const now = Date.now();

  return serverDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const data = (snapshot.data() || {}) as RateLimitData;
    const blockedUntil = Number(data.blockedUntil) || 0;

    if (blockedUntil > now) {
      return {
        allowed: false,
        key,
        retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil - now) / 1000)),
      };
    }

    const previousWindowStart = Number(data.windowStartedAt) || 0;
    const startsNewWindow =
      previousWindowStart === 0 ||
      now - previousWindowStart >= WINDOW_MS ||
      blockedUntil > 0;
    const windowStartedAt = startsNewWindow ? now : previousWindowStart;
    const attempts = startsNewWindow ? 1 : (Number(data.attempts) || 0) + 1;

    if (attempts > MAX_ATTEMPTS[scope]) {
      const nextBlockedUntil = now + BLOCK_MS;
      transaction.set(reference, {
        attempts,
        windowStartedAt,
        blockedUntil: nextBlockedUntil,
        updatedAt: now,
      });
      return {
        allowed: false,
        key,
        retryAfterSeconds: Math.ceil(BLOCK_MS / 1000),
      };
    }

    transaction.set(reference, {
      attempts,
      windowStartedAt,
      blockedUntil: 0,
      updatedAt: now,
    });
    return { allowed: true, key, retryAfterSeconds: 0 };
  });
}

export async function resetLoginAttempts(key: string) {
  if (!serverDb) return;
  await serverDb.collection(RATE_LIMIT_COLLECTION).doc(key).set({
    attempts: 0,
    windowStartedAt: Date.now(),
    blockedUntil: 0,
    updatedAt: Date.now(),
  });
}

export function loginRateLimitResponse(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return new Response(
    JSON.stringify({
      error: `Too many login attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
