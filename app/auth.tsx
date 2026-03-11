import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

const GUEST_WARNING_KEY = 'guest_warning_dismissed';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthScreen() {
  const { signIn, signUp, resetPassword, signInGoogle, signInApple, isFirebaseConfigured } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleGuestContinue = async () => {
    const dismissed = await AsyncStorage.getItem(GUEST_WARNING_KEY);
    if (dismissed === 'true') {
      router.replace('/(tabs)/' as any);
    } else {
      setDontShowAgain(false);
      setShowGuestWarning(true);
    }
  };

  const confirmGuestContinue = async () => {
    if (dontShowAgain) {
      await AsyncStorage.setItem(GUEST_WARNING_KEY, 'true');
    }
    setShowGuestWarning(false);
    router.replace('/(tabs)/' as any);
  };

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    if (mode === 'reset') {
      try {
        setLoading(true);
        await resetPassword(email.trim());
        Alert.alert('Sent!', 'Check your email for a password reset link.', [
          { text: 'OK', onPress: () => setMode('signin') },
        ]);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to send reset email');
      } finally { setLoading(false); }
      return;
    }
    if (!password) { Alert.alert('Error', 'Please enter your password'); return; }
    if (mode === 'signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match'); return;
    }
    try {
      setLoading(true);
      if (mode === 'signin') await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      router.replace('/(tabs)/' as any);
    } catch (e: any) {
      const msg =
        e.code === 'auth/wrong-password' ? 'Incorrect password' :
        e.code === 'auth/user-not-found' ? 'No account with this email' :
        e.code === 'auth/email-already-in-use' ? 'Email already registered' :
        e.code === 'auth/weak-password' ? 'Password must be at least 6 characters' :
        e.message || 'Authentication failed';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      await signInGoogle();
      router.replace('/(tabs)/' as any);
    } catch (e: any) {
      if (!e.message?.includes('cancel')) {
        Alert.alert('Google Sign-In', e.message || 'Google sign-in failed');
      }
    } finally { setGoogleLoading(false); }
  };

  const handleApple = async () => {
    try {
      setAppleLoading(true);
      await signInApple();
      router.replace('/(tabs)/' as any);
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED' && !e.message?.includes('cancel')) {
        Alert.alert('Apple Sign-In', e.message || 'Apple sign-in failed');
      }
    } finally { setAppleLoading(false); }
  };

  if (!isFirebaseConfigured) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FF6B9D', '#667EEA']} style={styles.gradient}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="warning-outline" size={44} color={Colors.warning} />
            </View>
            <Text style={styles.title}>Firebase Not Configured</Text>
            <Text style={styles.subtitle}>
              Add your Firebase project keys to enable sign-in and push notifications.
            </Text>
            <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)/' as any)}>
              <Text style={styles.skipBtnText}>Continue Without Sign-in</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#FF6B9D', '#E8547A', '#667EEA']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Ionicons name="heart" size={36} color={Colors.white} />
            </View>
            <Text style={styles.appName}>BabyTrack</Text>
            <Text style={styles.tagline}>Your parenting companion</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {mode === 'signin' ? 'Sign in to sync across devices'
                : mode === 'signup' ? "Start tracking your baby's journey"
                : 'Enter your email to reset your password'}
            </Text>

            {mode !== 'reset' && (
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[styles.socialBtn, googleLoading && { opacity: 0.7 }]}
                  onPress={handleGoogle}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={Colors.textPrimary} />
                  ) : (
                    <>
                      <Text style={styles.googleG}>G</Text>
                      <Text style={styles.socialBtnText}>Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.socialBtn, styles.appleBtn, appleLoading && { opacity: 0.7 }]}
                    onPress={handleApple}
                    disabled={appleLoading}
                  >
                    {appleLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="logo-apple" size={18} color={Colors.white} />
                        <Text style={[styles.socialBtnText, { color: Colors.white }]}>Apple</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {mode !== 'reset' && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {mode !== 'reset' && (
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 44 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPassword}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPassword}
                />
              </View>
            )}

            {mode === 'signin' && (
              <TouchableOpacity style={styles.forgotBtn} onPress={() => setMode('reset')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { marginTop: 16 }]}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.skipBtn} onPress={handleGuestContinue}>
              <Text style={styles.skipBtnText}>Continue without account</Text>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                {mode === 'signin' ? "Don't have an account? "
                  : mode === 'reset' ? 'Back to '
                  : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                <Text style={styles.switchLink}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal visible={showGuestWarning} transparent animationType="fade">
        <View style={guestWarnStyles.overlay}>
          <View style={guestWarnStyles.dialog}>
            <View style={guestWarnStyles.iconWrap}>
              <Ionicons name="warning" size={36} color={Colors.warning} />
            </View>
            <Text style={guestWarnStyles.title}>Using as Guest</Text>
            <Text style={guestWarnStyles.body}>
              Your baby data will only be saved on this device and will not sync across devices or be recoverable if the app is uninstalled.{'\n\n'}
              Create a free account to keep your data safe and accessible anywhere.
            </Text>
            <TouchableOpacity style={guestWarnStyles.dontShowRow} onPress={() => setDontShowAgain(!dontShowAgain)} activeOpacity={0.7}>
              <View style={[guestWarnStyles.checkbox, dontShowAgain && guestWarnStyles.checkboxChecked]}>
                {dontShowAgain && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
              <Text style={guestWarnStyles.dontShowText}>Don't show this again</Text>
            </TouchableOpacity>
            <View style={guestWarnStyles.btnRow}>
              <TouchableOpacity style={guestWarnStyles.continueBtn} onPress={confirmGuestContinue}>
                <Text style={guestWarnStyles.continueTxt}>Continue as Guest</Text>
              </TouchableOpacity>
              <TouchableOpacity style={guestWarnStyles.signInBtn} onPress={() => setShowGuestWarning(false)}>
                <Text style={guestWarnStyles.signInTxt}>Sign In Instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: Platform.OS === 'web' ? 80 : 60 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  appName: { fontSize: 32, fontWeight: '900', color: Colors.white, letterSpacing: 0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 28, padding: 28, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.warningLight, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 24, textAlign: 'center' },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.veryLightGray, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.lightGray, paddingVertical: 13 },
  appleBtn: { backgroundColor: '#000', borderColor: '#000' },
  googleG: { fontSize: 16, fontWeight: '800', color: '#4285F4' },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.lightGray },
  dividerText: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.veryLightGray, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.lightGray, marginBottom: 12 },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, padding: 14, fontSize: 15, color: Colors.textPrimary },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
  skipBtn: { borderWidth: 1.5, borderColor: Colors.lightGray, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  skipBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});

const guestWarnStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { backgroundColor: Colors.white, borderRadius: 24, padding: 28, width: '100%', maxWidth: 380, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.warningLight, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  dontShowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24, alignSelf: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dontShowText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  btnRow: { gap: 10 },
  continueBtn: { backgroundColor: Colors.veryLightGray, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.lightGray },
  continueTxt: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  signInBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  signInTxt: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
