import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import {
  isFirebaseConfigured,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithGoogle,
  signInWithAppleCredential,
  getFirebaseAuth,
  User,
} from '@/lib/firebase';
import { queryClient } from '@/lib/query-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  logOut: async () => {},
  resetPassword: async () => {},
  signInGoogle: async () => {},
  signInApple: async () => {},
  isFirebaseConfigured: false,
});

export function AuthProvider({ children: providerChildren }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
        queryClient.invalidateQueries();
      });
      return unsub;
    } catch {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      setUser(null);
      queryClient.invalidateQueries();
    } catch {}
  };

  const resetPassword = async (email: string) => {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
  };

  const signInGoogle = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Google Sign-In',
        'Google Sign-In is available on the web version of this app. On mobile, please use email/password or Apple Sign-In.',
        [{ text: 'OK' }]
      );
      return;
    }
    await signInWithGoogle();
  };

  const signInApple = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple Sign-In', 'Apple Sign-In is only available on iOS devices.', [{ text: 'OK' }]);
      return;
    }
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        await signInWithAppleCredential(credential.identityToken);
      } else {
        throw new Error('No identity token from Apple');
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') throw e;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, signIn, signUp, logOut, resetPassword,
      signInGoogle, signInApple, isFirebaseConfigured,
    }}>
      {providerChildren}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
