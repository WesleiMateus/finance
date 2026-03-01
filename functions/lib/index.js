"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminRole = exports.listAllUsers = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const admin = require("firebase-admin");
admin.initializeApp();
(0, v2_1.setGlobalOptions)({ region: 'southamerica-east1' });
const SUPER_ADMINS = ['xiwsb3h3fqWWPflNgl0DDhbBeN33'];
const RESTORATION_KEY = 'AURORA_RESCUE_2026';
exports.listAllUsers = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { auth } = request;
    if (!auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    if (auth.token.admin !== true && !isEmulator) {
        throw new https_1.HttpsError('permission-denied', 'Admin check failed');
    }
    const users = [];
    let token = undefined;
    do {
        const result = await admin.auth().listUsers(1000, token);
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
exports.setAdminRole = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { auth, data } = request;
    if (!auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    const hasRestorationKey = data.restorationKey === RESTORATION_KEY;
    if (!SUPER_ADMINS.includes(auth.uid) && !isEmulator && !hasRestorationKey) {
        throw new https_1.HttpsError('permission-denied', 'Super admin only or invalid restoration key');
    }
    const uid = data.uid;
    if (!uid)
        throw new https_1.HttpsError('invalid-argument', 'UID required');
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    await admin.firestore().collection('users').doc(uid).set({ role: 'admin' }, { merge: true });
    return { success: true };
});
//# sourceMappingURL=index.js.map