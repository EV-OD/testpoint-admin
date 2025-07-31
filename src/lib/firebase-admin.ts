import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // @ts-ignore
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://testpoint-81a9a.firebaseio.com`,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
