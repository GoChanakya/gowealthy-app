
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
  Animated, Dimensions, Easing, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../../src/config/firebase';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';


const { width: W, height: H } = Dimensions.get('window');
const ND = Platform.OS !== 'web';

// ── Same credentials — untouched ────────────────────────────────────────────
const VITE_BUBBLE_ID   = '9110';
const VITE_BUBBLE_AUTH = 'MzU3MGJlNWZjMGU5NDM3OGQyOTE1ZTU0';
const BUBBLE_API_URL   = `https://${VITE_BUBBLE_ID}.bubblewhats.com/send-message`;
const generateOTP      = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#000000',
  card:        '#0d1117',
  cardBorder:  '#1a2332',
  orange:      '#FF8500',
  orangeFaint: 'rgba(255,133,0,0.08)',
  orangeBorder:'rgba(255,133,0,0.35)',
  purple:      '#6C50C4',
  green:       '#10b981',
  greenFaint:  'rgba(16,185,129,0.1)',
  white:       '#ffffff',
  gray300:     '#d1d5db',
  gray400:     '#9ca3af',
  gray500:     '#6b7280',
  gray600:     '#4b5563',
  gray700:     '#374151',
  inputBg:     '#080d14',
};

const OTP_LEN = 6;
const COOLDOWN = 60;

// ── Breathing glow blob ──────────────────────────────────────────────────────
const GlowBlob = ({ style, color, duration = 4500, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: ND }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: ND }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={[style, {
        backgroundColor: color,
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.20] }),
      }]}
    />
  );
};

// ── Floating particle ────────────────────────────────────────────────────────
const Particle = ({ x, y, size, delay, color, duration }) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacity,    { toValue: 0.6, duration: duration * 0.4, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
            Animated.timing(translateY, { toValue: -10,  duration,                 easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
          ]),
          Animated.parallel([
            Animated.timing(opacity,    { toValue: 0.1, duration: duration * 0.4, easing: Easing.in(Easing.quad),  useNativeDriver: ND }),
            Animated.timing(translateY, { toValue: 0,    duration,                 easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
          ]),
        ])
      ).start();
    }, delay);
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity, transform: [{ translateY }],
    }} />
  );
};

const PARTICLES = [
  { x: W * 0.08,  y: H * 0.12, size: 3,   delay: 200,  color: '#FF8500', duration: 3400 },
  { x: W * 0.86,  y: H * 0.10, size: 4,   delay: 600,  color: '#FF8500', duration: 2800 },
  { x: W * 0.10,  y: H * 0.70, size: 2.5, delay: 400,  color: '#6C50C4', duration: 3800 },
  { x: W * 0.88,  y: H * 0.65, size: 3,   delay: 800,  color: '#6C50C4', duration: 2600 },
  { x: W * 0.48,  y: H * 0.04, size: 3.5, delay: 500,  color: '#FF8500', duration: 3200 },
  { x: W * 0.94,  y: H * 0.40, size: 2,   delay: 1000, color: '#FF8500', duration: 4200 },
];

// ── Screen ───────────────────────────────────────────────────────────────────
const OtpScreen = () => {
  const router = useRouter();
  // const { phone, otp: initOtp, expiry: initExpiry } = useLocalSearchParams();
  const { phone, otp: initOtp, expiry: initExpiry, name, email, isSignup } = useLocalSearchParams();


  const [genOTP, setGenOTP]   = useState(initOtp || '');
  const [expiry, setExpiry]   = useState(parseInt(initExpiry) || 0);
  const [digits, setDigits]   = useState(Array(OTP_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(COOLDOWN);
  const refs = useRef([]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;

  // Box shake on wrong OTP
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: ND }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim,  { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
        Animated.spring(cardSlide, { toValue: 0, tension: 55, friction: 9, useNativeDriver: ND }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const fullOtp = digits.join('');
  const isReady = fullOtp.length === OTP_LEN;

  const shakeBoxes = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: ND }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: ND }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: ND }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: ND }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: ND }),
    ]).start();
  };

  // ── Untouched logic ───────────────────────────────────────────────────────
  const onDigit = (text, i) => {
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, OTP_LEN).split('');
      const next   = Array(OTP_LEN).fill('');
      pasted.forEach((d, j) => { next[j] = d; });
      setDigits(next);
      refs.current[Math.min(pasted.length - 1, OTP_LEN - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = text.replace(/\D/g, '');
    setDigits(next);
    if (text && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
  };

  const onKey = (e, i) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  // const saveToFirebase = async (phoneNumber) => {
  //   try {
  //     const ts   = new Date();
  //     const sid  = ts.toISOString().replace(/[:.]/g, '-');
  //     const ref  = doc(db, 'questionnaire_submissions', phoneNumber);
  //     const snap = await getDoc(ref);
  //     const count = snap.exists() ? (snap.data().total_submissions || 0) : 0;
  //     await setDoc(doc(collection(ref, 'submissions'), sid), {
  //       raw_answers: {}, timestamp: ts.toISOString(),
  //       submitted_at: ts, version: count + 1, auth_only: true,
  //     });
  //     await setDoc(ref, {
  //       phone_number: phoneNumber, full_name: '', email: '',
  //       latest_submission_date: ts.toISOString(),
  //       latest_submission_id: sid,
  //       total_submissions: count + 1,
  //       last_updated: ts,
  //       createdAt: snap.exists() ? (snap.data().createdAt ?? ts.toISOString()) : ts.toISOString(),
  //       timestamp: ts.toISOString(),
  //     }, { merge: true });
  //   } catch (e) { console.error('❌ Firebase save error:', e); }
  // };


  const saveToFirebase = async (phoneNumber) => {
  try {
    const ts  = new Date();
    const sid = ts.toISOString().replace(/[:.]/g, '-');
    const ref = doc(db, 'questionnaire_submissions', phoneNumber);
    const snap = await getDoc(ref);
    const count = snap.exists() ? (snap.data().total_submissions || 0) : 0;
    await setDoc(doc(collection(ref, 'submissions'), sid), {
      raw_answers: {}, timestamp: ts.toISOString(),
      submitted_at: ts, version: count + 1, auth_only: true,
    });
    await setDoc(ref, {
      phone_number: phoneNumber,
      full_name: isSignup === 'true' ? (name || '') : (snap.data()?.full_name || ''),
      email: isSignup === 'true' ? (email || '') : (snap.data()?.email || ''),
      latest_submission_date: ts.toISOString(),
      latest_submission_id: sid,
      total_submissions: count + 1,
      last_updated: ts,
      createdAt: snap.exists() ? (snap.data().createdAt ?? ts.toISOString()) : ts.toISOString(),
      timestamp: ts.toISOString(),
    }, { merge: true });
  } catch (e) { console.error('Firebase save error:', e); }
};

  const verify = async (code) => {
  setLoading(true);
  try {
    if (code === genOTP && Date.now() <= expiry) {
      await AsyncStorage.setItem('user_phone', phone);
      await AsyncStorage.setItem('auth_token', 'verified');
      await AsyncStorage.setItem('auth_timestamp', Date.now().toString());

      const snap = await getDoc(doc(db, 'questionnaire_submissions', phone));
const snapAlt = !snap.exists()
  ? await getDoc(doc(db, 'questionnaire_submissions', `+91${phone}`))
  : null;
const finalSnap = snap.exists() ? snap : snapAlt;

if (!finalSnap?.exists() || !finalSnap.data()?.full_name) {
  router.replace({ pathname: '/(auth)/details', params: { phone } });
} else {
  await saveToFirebase(phone);
  router.replace('/(gowealthy)');
}
    } else if (Date.now() > expiry) {
      Alert.alert('OTP Expired', 'Please request a new one.');
      setDigits(Array(OTP_LEN).fill(''));
      refs.current[0]?.focus();
    } else {
      shakeBoxes();
      Alert.alert('Incorrect OTP', 'Please try again.');
      setDigits(Array(OTP_LEN).fill(''));
      refs.current[0]?.focus();
    }
  } catch {
    Alert.alert('Error', 'Verification failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const handleVerify = () => { if (isReady && !loading) verify(fullOtp); };

  const resend = async () => {
    if (timer > 0 || loading) return;
    const otp = generateOTP();
    setGenOTP(otp);
    setExpiry(Date.now() + 5 * 60 * 1000);
    setDigits(Array(OTP_LEN).fill(''));
    setTimer(COOLDOWN);
    refs.current[0]?.focus();
    try {
      await fetch(BUBBLE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': VITE_BUBBLE_AUTH },
        body: JSON.stringify({
          jid: `91${phone}`,
          message: `Your OTP is ${otp} for GoWealthy. Please do not share it with anyone. Valid for 5 minutes.`,
        }),
      });
    } catch (e) { console.error('Resend error:', e); }
  };

  // Box state color
  const getBoxStyle = (i) => {
    const d = digits[i];
    if (isReady) return s.boxReady;
    if (d)       return s.boxFilled;
    return null;
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      <View style={s.root}>

        {/* Background gradient */}
        <LinearGradient
          colors={['#0a0408', '#060308', '#000000', '#04030a']}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Glow blobs */}
        <GlowBlob color="#6C50C4" duration={5000} delay={0}
          style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, right: -80 }} />
        <GlowBlob color="#FF8500" duration={4200} delay={600}
          style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, bottom: 20, left: -80 }} />

        {/* Particles */}
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Back */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Brand */}
            <Animated.View style={[s.brand, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={s.logoImg}
                resizeMode="contain"
              />
              <View>
                <Text style={s.brandSub}>Verifying your number</Text>
                <Text style={s.brandName}>
                  <Text style={s.brandNameLight}>Go</Text>Wealthy
                </Text>
              </View>
            </Animated.View>

            {/* Card */}
            <Animated.View style={[s.card, { opacity: cardAnim, transform: [{ translateY: cardSlide }] }]}>

              {/* Card top accent line */}
              <LinearGradient
                colors={['#6C50C4', '#FF8500']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.cardTopLine}
              />

              <Text style={s.cardTitle}>Enter OTP</Text>

              {/* Phone line */}
              <View style={s.phoneRow}>
                <View style={s.phonePill}>
                  <Text style={s.phonePillText}>📲  +91 {phone}</Text>
                </View>
                <TouchableOpacity onPress={() => router.back()} style={s.editBtn}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* OTP boxes */}
              <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
                {digits.map((d, i) => (
                  <TextInput
  key={i}
  ref={r => (refs.current[i] = r)}
  style={[s.box, getBoxStyle(i)]}
  value={d}
  onChangeText={t => onDigit(t, i)}
  onKeyPress={e => onKey(e, i)}
  keyboardType="numeric"
  maxLength={OTP_LEN}
  textContentType="oneTimeCode"
  autoComplete="sms-otp"
  selectTextOnFocus
  caretHidden
  autoFocus={i === 0}
  returnKeyType="done"
  onSubmitEditing={handleVerify}
/>
                ))}
              </Animated.View>

              {/* Verify button */}
              <TouchableOpacity onPress={handleVerify} disabled={!isReady || loading} activeOpacity={0.86}>
                {isReady ? (
                  <LinearGradient
                    colors={['#FF8500', '#d96800']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.btn}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={s.btnText}>Verify & Continue  →</Text>
                    }
                  </LinearGradient>
                ) : (
                  <View style={[s.btn, s.btnDisabled]}>
                    <Text style={[s.btnText, { color: C.gray600 }]}>Verify & Continue  →</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Resend */}
              <TouchableOpacity onPress={resend} disabled={timer > 0 || loading} style={s.resendRow}>
                {timer > 0 ? (
                  <View style={s.timerWrap}>
                    <View style={s.timerDot} />
                    <Text style={s.timerText}>Resend in {timer}s</Text>
                  </View>
                ) : (
                  <Text style={s.resendActive}>Didn't receive it? Resend →</Text>
                )}
              </TouchableOpacity>

            </Animated.View>

            {/* Bottom trust */}
            <Animated.View style={[s.trust, { opacity: cardAnim }]}>
              {['🔒 Secure', '🇮🇳 Made in India', '✦ GoChanakya'].map((t, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={s.trustDiv} />}
                  <Text style={s.trustText}>{t}</Text>
                </React.Fragment>
              ))}
            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },

  backBtn:     { marginBottom: 36 },
  backBtnText: { fontSize: 14, color: C.gray500, fontWeight: '500' },

  brand: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, marginBottom: 32,
  },
  logoImg:        { width: 44, height: 44, borderRadius: 12 },
  brandSub:       { fontSize: 12, color: C.gray500, fontWeight: '500', marginBottom: 2 },
  brandName:      { fontSize: 26, fontWeight: '800', color: C.orange, letterSpacing: -0.5, fontFamily: 'Syne' },
  brandNameLight: { color: 'rgba(255,255,255,0.55)', fontWeight: '300' },

  // Card
  card: {
    backgroundColor: 'rgba(13,17,23,0.85)',
    borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 24, overflow: 'hidden',
    paddingHorizontal: 24, paddingBottom: 28, paddingTop: 0,
    maxWidth: 440, alignSelf: 'stretch',
  },
  cardTopLine: { height: 2, width: '100%', marginBottom: 28 },
  cardTitle: {
    fontSize: 24, fontWeight: '800', color: C.white,
    marginBottom: 18, letterSpacing: -0.4, fontFamily: 'Syne',
  },

  // Phone pill
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 28, flexWrap: 'wrap',
  },
  phonePill: {
    backgroundColor: 'rgba(255,133,0,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,133,0,0.2)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  phonePillText: { fontSize: 13, color: C.gray300, fontWeight: '600' },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  editBtnText: { fontSize: 12, color: C.gray400, fontWeight: '600' },

  // OTP boxes
  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 26, gap: 8,
  },
  box: {
    flex: 1, aspectRatio: 0.85,
    backgroundColor: C.inputBg,
    borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: 14,
    fontSize: 22, fontWeight: '800',
    color: C.white, textAlign: 'center',
    maxWidth: 52,
  },
  boxFilled: {
    borderColor: C.orange,
    backgroundColor: 'rgba(255,133,0,0.06)',
  },
  boxReady: {
    borderColor: C.green,
    backgroundColor: C.greenFaint,
  },

  // Buttons
  btn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    backgroundColor: '#080d14',
    borderWidth: 1, borderColor: C.cardBorder,
  },
  btnText: { fontSize: 15, fontWeight: '800', color: C.white, letterSpacing: 0.3 },

  // Resend
  resendRow:   { alignItems: 'center', paddingTop: 2 },
  timerWrap:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  timerDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gray700 },
  timerText:   { fontSize: 13, color: C.gray600, fontWeight: '500' },
  resendActive:{ fontSize: 13, color: C.orange, fontWeight: '700' },

  // Trust
  trust: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 28,
    gap: 10, flexWrap: 'wrap',
  },
  trustDiv:  { width: 1, height: 10, backgroundColor: C.gray700 },
  trustText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '500' },
});

export default OtpScreen;