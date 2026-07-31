import "server-only";

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { serverDb } from "@/lib/firebase/server";
import type { StaffRole } from "@/lib/auth/session";

interface StoredCredential {
  hash: string;
  salt: string;
  updatedAt: string;
}

const AUTH_DOCUMENTS: Record<StaffRole, string> = {
  owner: "amigos_store/ownerAuth",
  manager: "amigos_store/managerAuth",
};

function safeEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return {
    hash: scryptSync(password, salt, 64).toString("hex"),
    salt,
    updatedAt: new Date().toISOString(),
  };
}

function matchesCredential(password: string, credential?: StoredCredential) {
  if (!credential?.hash || !credential.salt) return false;
  const candidate = scryptSync(password, credential.salt, 64).toString("hex");
  return safeEqual(candidate, credential.hash);
}

function matchesDevelopmentPassword(password: string) {
  const developmentPassword = process.env.DEV_PASSWORD;
  return (
    process.env.NODE_ENV !== "production" &&
    Boolean(developmentPassword) &&
    safeEqual(password, developmentPassword!)
  );
}

async function readRoleCredential(role: StaffRole): Promise<StoredCredential | undefined> {
  if (!serverDb) {
    throw new Error("Firestore Admin credentials are not configured.");
  }
  const snapshot = await serverDb.doc(AUTH_DOCUMENTS[role]).get();
  return snapshot.exists ? (snapshot.data() as StoredCredential) : undefined;
}

export async function verifyStaffPassword(
  role: StaffRole,
  password: string,
) {
  if (matchesDevelopmentPassword(password)) return true;
  const credential = await readRoleCredential(role);
  return matchesCredential(password, credential);
}

export async function updateStaffPassword(
  currentRole: StaffRole,
  targetRole: StaffRole,
  currentPassword: string,
  newPassword: string,
) {
  const currentCredential = await readRoleCredential(currentRole);
  const currentMatches =
    matchesDevelopmentPassword(currentPassword) ||
    matchesCredential(currentPassword, currentCredential);

  if (!currentMatches) return false;

  await serverDb!.doc(AUTH_DOCUMENTS[targetRole]).set(hashPassword(newPassword));
  return true;
}

export async function resetStaffPassword(
  targetRole: StaffRole,
  newPassword: string,
) {
  if (!serverDb) {
    throw new Error("Firestore Admin credentials are not configured.");
  }
  await serverDb.doc(AUTH_DOCUMENTS[targetRole]).set(hashPassword(newPassword));
}
