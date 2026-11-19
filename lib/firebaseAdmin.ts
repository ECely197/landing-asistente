// lib/firebaseAdmin.ts
import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  let credential;
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (rawKey) {
    try {
      const serviceAccount = JSON.parse(rawKey);
      credential = cert(serviceAccount);
    } catch (err) {
      console.error('[firebaseAdmin] Error parseando FIREBASE_SERVICE_ACCOUNT_KEY:', err);
      credential = applicationDefault();
    }
  } else {
    credential = applicationDefault();
  }

  app = initializeApp({
    credential,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'asistente-5aefd',
  });
} else {
  app = getApps()[0];
}

export const adminDb: Firestore = getFirestore(app);
