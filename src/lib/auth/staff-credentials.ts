import "server-only";

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { serverDb } from "@/lib/firebase/server";
import type { StaffRole } from "@/lib/auth/session";

interface StoredCredential {
  hash: string;
  salt: string;
  updatedAt: string;
}

interface StaffAuthDocument {
  owner?: StoredCredential;
  manager?: StoredCredential;
}

const STAFF_AUTH_DOCUMENT = ["amigos_store", "staffAuth"] as const;

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

async function readStaffAuth(): Promise<StaffAuthDocument> {
  if (!serverDb) {
    throw new Error("Firestore is not configured.");
  }
  const snapshot = await getDoc(doc(serverDb, ...STAFF_AUTH_DOCUMENT));
  return snapshot.exists() ? (snapshot.data() as StaffAuthDocument) : {};
}

export async function verifyStaffPassword(
  role: StaffRole,
  password: string,
) {
  if (matchesDevelopmentPassword(password)) return true;
  const credentials = await readStaffAuth();
  return matchesCredential(password, credentials[role]);
}

export async function updateStaffPassword(
  currentRole: StaffRole,
  targetRole: StaffRole,
  currentPassword: string,
  newPassword: string,
) {
  const credentials = await readStaffAuth();
  const currentMatches =
    matchesDevelopmentPassword(currentPassword) ||
    matchesCredential(currentPassword, credentials[currentRole]);

  if (!currentMatches) return false;

  await setDoc(
    doc(serverDb!, ...STAFF_AUTH_DOCUMENT),
    { [targetRole]: hashPassword(newPassword) },
    { merge: true },
  );
  return true;
}
