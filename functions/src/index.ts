import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from 'firebase-admin';

admin.initializeApp();

// Configura a região global para as funções v2
setGlobalOptions({ region: 'southamerica-east1' });

const SUPER_ADMINS = ['xiwsb3h3fqWWPflNgl0DDhbBeN33'];
const RESTORATION_KEY = 'AURORA_RESCUE_2026'; // Chave temporária para emergência

export const listAllUsers = onCall({ cors: true }, async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Login required');
  
  // No emulador, permitimos listar mesmo sem a claim inicialmente para facilitar o setup
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
  if (auth.token.admin !== true && !isEmulator) {
    throw new HttpsError('permission-denied', 'Admin check failed');
  }
  
  const users: any[] = [];
  let token: string | undefined = undefined;
  
  do {
    const result: any = await admin.auth().listUsers(1000, token);
    result.users.forEach(u => users.push({
      uid: u.uid,
      email: u.email,
      claims: u.customClaims || {},
      displayName: u.displayName,
      photoURL: u.photoURL,
      disabled: u.disabled,
      metadata: u.metadata
    }));
    token = result.pageToken;
  } while (token);
  
  return { users };
});

export const setAdminRole = onCall({ cors: true }, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Login required');
  
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
  const hasRestorationKey = data.restorationKey === RESTORATION_KEY;

  if (!SUPER_ADMINS.includes(auth.uid) && !isEmulator && !hasRestorationKey) {
    throw new HttpsError('permission-denied', 'Super admin only or invalid restoration key');
  }
  
  const uid = data.uid;
  if (!uid) throw new HttpsError('invalid-argument', 'UID required');
  
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  await admin.firestore().collection('users').doc(uid).set({ role: 'admin' }, { merge: true });
  
  return { success: true };
});

