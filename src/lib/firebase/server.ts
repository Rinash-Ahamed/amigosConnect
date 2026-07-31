import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const ADMIN_APP_NAME = "amigos-connect-admin";
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const isServerFirestoreConfigured = Boolean(
  projectId && clientEmail && privateKey,
);

function getAdminApp(): App | null {
  if (!isServerFirestoreConfigured) return null;
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  return existingApp ?? initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    },
    ADMIN_APP_NAME,
  );
}

const adminApp = getAdminApp();

export const serverDb: Firestore | null = adminApp
  ? getFirestore(getApp(ADMIN_APP_NAME))
  : null;
