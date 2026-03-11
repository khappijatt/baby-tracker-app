import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth as firebaseGetAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
  Auth,
  User,
} from 'firebase/auth';
import { Platform } from 'react-native';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

export const isFirebaseConfigured = !!(
  apiKey && projectId &&
  apiKey !== 'undefined' && projectId !== 'undefined'
);

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export let currentFirebaseUid: string | null = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  _auth = firebaseGetAuth(app);

  onAuthStateChanged(_auth, (u) => {
    currentFirebaseUid = u?.uid ?? null;
  });
}

export function getFirebaseAuth(): Auth {
  if (!_auth) throw new Error('Firebase not initialized');
  return _auth;
}

export const signInWithGoogle = async (): Promise<User> => {
  if (Platform.OS !== 'web') {
    throw new Error('Google Sign-In is only available on web. On mobile, please use email/password or Apple ID.');
  }
  const a = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(a, provider);
  return result.user;
};

export const signInWithAppleCredential = async (identityToken: string): Promise<User> => {
  const a = getFirebaseAuth();
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken });
  const result = await signInWithCredential(a, credential);
  return result.user;
};

export {
  app,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
};
export type { User };
