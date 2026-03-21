
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
  Animated, Dimensions, Easing, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

const { width: W, height: H } = Dimensions.get('window');
const ND = Platform.OS !== 'web';

// ── Same credentials — untouched ────────────────────────────────────────────
const VITE_BUBBLE_ID   = '9110';
const VITE_BUBBLE_AUTH = 'MzU3MGJlNWZjMGU5NDM3OGQyOTE1ZTU0';
const BUBBLE_API_URL   = `https://${VITE_BUBBLE_ID}.bubblewhats.com/send-message`;
const generateOTP      = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Design tokens — mirrors splash + landing exactly ────────────────────────
const C = {
  bg:          '#000000',
  card:        '#0d1117',
  cardBorder:  '#1a2332',
  orange:      '#FF8500',
  orangeFaint: 'rgba(255,133,0,0.08)',
  orangeBorder:'rgba(255,133,0,0.35)',
  purple:      '#6C50C4',
  purpleFaint: 'rgba(108,80,196,0.08)',
  white:       '#ffffff',
  gray300:     '#d1d5db',
  gray400:     '#9ca3af',
  gray500:     '#6b7280',
  gray600:     '#4b5563',
  gray700:     '#374151',
  inputBg:     '#080d14',
};

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
  { x: W * 0.06,  y: H * 0.10, size: 3,   delay: 300,  color: '#FF8500', duration: 3200 },
  { x: W * 0.88,  y: H * 0.08, size: 4,   delay: 700,  color: '#FF8500', duration: 2900 },
  { x: W * 0.12,  y: H * 0.65, size: 2.5, delay: 500,  color: '#6C50C4', duration: 3600 },
  { x: W * 0.85,  y: H * 0.60, size: 3.5, delay: 900,  color: '#6C50C4', duration: 2700 },
  { x: W * 0.50,  y: H * 0.05, size: 3,   delay: 600,  color: '#FF8500', duration: 3400 },
  { x: W * 0.92,  y: H * 0.35, size: 2,   delay: 1100, color: '#FF8500', duration: 4000 },
];

// ── Screen ───────────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const router = useRouter();
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;

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

  // ── Untouched logic ───────────────────────────────────────────────────────
  const isValidPhone = () => {
    const d = phone.replace(/\D/g, '');
    if (d.length !== 10) return false;
    if (!['6','7','8','9'].includes(d[0])) return false;
    for (let i = 0; i <= d.length - 5; i++) {
      const sub = d.substring(i, i + 5);
      if (sub.split('').every(x => x === sub[0])) return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
  if (!isValidPhone() || loading) return;
  setLoading(true);
  const otp    = generateOTP();
  const expiry = (Date.now() + 5 * 60 * 1000).toString();
  const clean  = phone.replace(/\D/g, '');
  try {
    const res = await fetch(BUBBLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': VITE_BUBBLE_AUTH },
      body: JSON.stringify({
        jid: `91${clean}`,
        message: `Your OTP is ${otp} for GoWealthy. Please do not share it with anyone. Valid for 5 minutes.`,
      }),
    });
    if (res.ok) {
      router.push({ pathname: '/(auth)/otp', params: { phone: clean, otp, expiry } });
    } else {
      Alert.alert('Could not send OTP', 'Please check your number and try again.');
    }
  } catch {
    Alert.alert('Network Error', 'Check your connection and try again.');
  } finally {
    setLoading(false);
  }
};

  const valid = isValidPhone();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      <View style={s.root}>

        {/* Background gradient — same as splash */}
        <LinearGradient
          colors={['#0a0408', '#060308', '#000000', '#04030a']}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Glow blobs */}
        {/* <GlowBlob color="#FF8500" duration={5000} delay={0}
          style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, right: -80 }} />
        <GlowBlob color="#6C50C4" duration={4200} delay={600}
          style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, bottom: 20, left: -80 }} /> */}

        {/* Particles */}
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Back
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </Animated.View> */}

            {/* Brand header */}
            <Animated.View style={[s.brand, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={s.logoImg}
                resizeMode="contain"
              />
              <View>
                <Text style={s.brandSub}>Welcome to</Text>
                <Text style={s.brandName}>
                  <Text style={s.brandNameLight}>Go</Text>Wealthy
                </Text>
              </View>
            </Animated.View>

            {/* Card */}
            <Animated.View style={[s.card, { opacity: cardAnim, transform: [{ translateY: cardSlide }] }]}>

              {/* Card top accent line */}
              <LinearGradient
                colors={['#FF8500', '#6C50C4']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.cardTopLine}
              />

              <Text style={s.cardTitle}>Sign in</Text>
              <Text style={s.cardSub}>
                Enter your WhatsApp number.{'\n'}We'll send a one-time code to verify you.
              </Text>

              {/* Input label */}
              <Text style={s.inputLabel}>Phone Number</Text>

              {/* Input row */}
              <View style={[s.inputRow, valid && s.inputRowActive]}>
                <View style={s.prefixBox}>
                  <Text style={s.prefix}>🇮🇳  +91</Text>
                </View>
                <View style={s.inputDivider} />
                <TextInput
                  style={s.input}
                  placeholder="98765 43210"
                  placeholderTextColor={C.gray600}
                  keyboardType="numeric"
                  maxLength={10}
                  value={phone}
                  onChangeText={t => { if (/^\d*$/.test(t)) setPhone(t); }}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                  autoFocus
                />
                {valid && (
                  <View style={s.validBadge}>
                    <Text style={s.validBadgeText}>✓</Text>
                  </View>
                )}
              </View>

              {/* CTA button */}
              <TouchableOpacity onPress={handleSendOTP} disabled={!valid || loading} activeOpacity={0.86}>
                {valid ? (
                  <LinearGradient
                    colors={['#FF8500', '#d96800']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.btn}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={s.btnText}>Send OTP  →</Text>
                    }
                  </LinearGradient>
                ) : (
                  <View style={[s.btn, s.btnDisabled]}>
                    <Text style={[s.btnText, { color: C.gray600 }]}>Send OTP  →</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* WhatsApp note */}
              <View style={s.waNote}>
                <View style={s.waDot} />
                <Text style={s.waNoteText}>OTP delivered via WhatsApp</Text>
              </View>

          

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
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 24, paddingBottom: 28, paddingTop: 0,
    maxWidth: 440, alignSelf: 'stretch',
  },
  cardTopLine: {
    height: 2, width: '100%', marginBottom: 28,
  },
  cardTitle: {
    fontSize: 24, fontWeight: '800', color: C.white,
    marginBottom: 8, letterSpacing: -0.4, fontFamily: 'Syne',
  },
  cardSub: {
    fontSize: 13, color: C.gray500, lineHeight: 20, marginBottom: 28,
  },

  inputLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: 14, marginBottom: 20, overflow: 'hidden',
  },
  inputRowActive: { borderColor: C.orange },
  prefixBox: {
    paddingHorizontal: 14, paddingVertical: 15,
    backgroundColor: 'rgba(255,133,0,0.05)',
  },
  prefix:       { fontSize: 14, color: C.gray400, fontWeight: '600' },
  inputDivider: { width: 1, height: '55%', backgroundColor: C.cardBorder },
  input: {
    flex: 1, fontSize: 16, color: C.white,
    paddingHorizontal: 14, paddingVertical: 15,
    fontWeight: '500', letterSpacing: 1.5,
  },
  validBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,133,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  validBadgeText: { color: C.orange, fontSize: 14, fontWeight: '800' },

  btn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  btnDisabled: {
    backgroundColor: '#080d14',
    borderWidth: 1, borderColor: C.cardBorder,
  },
  btnText: { fontSize: 15, fontWeight: '800', color: C.white, letterSpacing: 0.3 },

  waNote: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
  },
  waDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#25D366' },
  waNoteText:{ fontSize: 12, color: C.gray600, fontWeight: '500' },



  // Trust row
  trust: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 28,
    gap: 10, flexWrap: 'wrap',
  },
  trustDiv:  { width: 1, height: 10, backgroundColor: C.gray700 },
  trustText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '500' },
});

export default LoginScreen;