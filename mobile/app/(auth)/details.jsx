import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
  Animated, Easing, Image, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

const { width: W, height: H } = Dimensions.get('window');
const ND = Platform.OS !== 'web';

const C = {
  bg: '#000000', card: '#0d1117', cardBorder: '#1a2332',
  orange: '#FF8500', white: '#ffffff',
  gray400: '#9ca3af', gray500: '#6b7280',
  gray600: '#4b5563', gray700: '#374151',
  inputBg: '#080d14',
};

const Particle = ({ x, y, size, delay, color, duration }) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacity,    { toValue: 0.6, duration: duration * 0.4, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
            Animated.timing(translateY, { toValue: -10, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
          ]),
          Animated.parallel([
            Animated.timing(opacity,    { toValue: 0.1, duration: duration * 0.4, easing: Easing.in(Easing.quad), useNativeDriver: ND }),
            Animated.timing(translateY, { toValue: 0,   duration, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
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
  { x: W * 0.06, y: H * 0.10, size: 3,   delay: 300, color: '#FF8500', duration: 3200 },
  { x: W * 0.88, y: H * 0.08, size: 4,   delay: 700, color: '#FF8500', duration: 2900 },
  { x: W * 0.12, y: H * 0.65, size: 2.5, delay: 500, color: '#6C50C4', duration: 3600 },
  { x: W * 0.85, y: H * 0.60, size: 3.5, delay: 900, color: '#6C50C4', duration: 2700 },
];

export default function DetailsScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const [step, setStep]       = useState('name');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  const cardAnim  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

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

  const isValidName  = (v) => v.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(v.trim());
  const isValidEmail = (v) => !v || v.includes('@');

  const saveAndContinue = async () => {
    setLoading(true);
    try {
      const ts   = new Date();
      const sid  = ts.toISOString().replace(/[:.]/g, '-');
      const ref  = doc(db, 'questionnaire_submissions', phone);
      const snap = await getDoc(ref);
      const count = snap.exists() ? (snap.data().total_submissions || 0) : 0;
      await setDoc(doc(collection(ref, 'submissions'), sid), {
        raw_answers: {}, timestamp: ts.toISOString(),
        submitted_at: ts, version: count + 1, auth_only: true,
      });
      await setDoc(ref, {
        phone_number: phone,
        full_name: name.trim(),
        email: email.trim(),
        latest_submission_date: ts.toISOString(),
        latest_submission_id: sid,
        total_submissions: count + 1,
        last_updated: ts,
        createdAt: snap.exists() ? (snap.data().createdAt ?? ts.toISOString()) : ts.toISOString(),
        timestamp: ts.toISOString(),
      }, { merge: true });
      router.replace('/(gowealthy)');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 'name') {
      if (!isValidName(name)) return;
      setStep('email');
    } else {
      if (!isValidEmail(email)) return;
      await saveAndContinue();
    }
  };

  const canProceed = step === 'name' ? isValidName(name) : true;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      <View style={s.root}>
        <LinearGradient
          colors={['#0a0408', '#060308', '#000000', '#04030a']}
          locations={[0, 0.35, 0.65, 1]}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <Animated.View style={[s.brand, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Image source={require('../../assets/images/logo.png')} style={s.logoImg} resizeMode="contain" />
              <View>
                <Text style={s.brandSub}>Almost there!</Text>
                <Text style={s.brandName}><Text style={s.brandNameLight}>Go</Text>Wealthy</Text>
              </View>
            </Animated.View>

            <Animated.View style={[s.card, { opacity: cardAnim, transform: [{ translateY: cardSlide }] }]}>
              <LinearGradient
                colors={['#FF8500', '#6C50C4']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.cardTopLine}
              />

              <View style={s.stepRow}>
                <View style={[s.stepDot, s.stepDotActive]} />
                <View style={[s.stepDot, step === 'email' && s.stepDotActive]} />
              </View>

              <Text style={s.cardTitle}>
                {step === 'name' ? 'What\'s your name?' : 'Your email?'}
              </Text>
              <Text style={s.cardSub}>
                {step === 'name'
                  ? 'Just your first name is fine.'
                  : 'Optional — for account recovery.'}
              </Text>

              <Text style={s.inputLabel}>
                {step === 'name' ? 'Full Name' : 'Email Address'}
              </Text>

              <View style={[s.inputRow, canProceed && s.inputRowActive]}>
                <TextInput
                  style={s.input}
                  placeholder={step === 'name' ? 'Your full name' : 'your@email.com (optional)'}
                  placeholderTextColor={C.gray600}
                  keyboardType={step === 'email' ? 'email-address' : 'default'}
                  autoCapitalize={step === 'name' ? 'words' : 'none'}
                  value={step === 'name' ? name : email}
                  onChangeText={step === 'name' ? setName : setEmail}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  autoFocus
                />
              </View>

              <TouchableOpacity onPress={handleNext} disabled={loading} activeOpacity={0.86}>
                {canProceed ? (
                  <LinearGradient
                    colors={['#FF8500', '#d96800']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.btn}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={s.btnText}>{step === 'email' ? 'Get Started  →' : 'Continue  →'}</Text>
                    }
                  </LinearGradient>
                ) : (
                  <View style={[s.btn, s.btnDisabled]}>
                    <Text style={[s.btnText, { color: C.gray600 }]}>Continue  →</Text>
                  </View>
                )}
              </TouchableOpacity>

              {step === 'email' && (
                <TouchableOpacity onPress={() => { setEmail(''); saveAndContinue(); }} style={s.skipBtn}>
                  <Text style={s.skipText}>Skip for now</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

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
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  brand:  { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 32 },
  logoImg:        { width: 44, height: 44, borderRadius: 12 },
  brandSub:       { fontSize: 12, color: C.gray500, fontWeight: '500', marginBottom: 2 },
  brandName:      { fontSize: 26, fontWeight: '800', color: C.orange, letterSpacing: -0.5, fontFamily: 'Syne' },
  brandNameLight: { color: 'rgba(255,255,255,0.55)', fontWeight: '300' },
  card: {
    backgroundColor: 'rgba(13,17,23,0.85)',
    borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 24, overflow: 'hidden',
    paddingHorizontal: 24, paddingBottom: 28, paddingTop: 0,
    maxWidth: 440, alignSelf: 'stretch',
  },
  cardTopLine:    { height: 2, width: '100%', marginBottom: 24 },
  stepRow:        { flexDirection: 'row', gap: 6, marginBottom: 20 },
  stepDot:        { width: 24, height: 4, borderRadius: 2, backgroundColor: C.cardBorder },
  stepDotActive:  { backgroundColor: C.orange },
  cardTitle:      { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 8, letterSpacing: -0.4, fontFamily: 'Syne' },
  cardSub:        { fontSize: 13, color: C.gray500, lineHeight: 20, marginBottom: 24 },
  inputLabel:     { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 },
  inputRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.cardBorder, borderRadius: 14, marginBottom: 20, overflow: 'hidden' },
  inputRowActive: { borderColor: C.orange },
  input:          { flex: 1, fontSize: 16, color: C.white, paddingHorizontal: 14, paddingVertical: 15, fontWeight: '500' },
  btn:            { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  btnDisabled:    { backgroundColor: '#080d14', borderWidth: 1, borderColor: C.cardBorder },
  btnText:        { fontSize: 15, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  skipBtn:        { alignItems: 'center', marginBottom: 8 },
  skipText:       { fontSize: 13, color: C.gray500, fontWeight: '500' },
  trust:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28, gap: 10, flexWrap: 'wrap' },
  trustDiv:       { width: 1, height: 10, backgroundColor: C.gray700 },
  trustText:      { fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '500' },
});