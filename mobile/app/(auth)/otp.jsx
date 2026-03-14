
// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StatusBar,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { isMobile } from '../../src/theme/globalStyles';

// // ── Same Firebase imports as screen22 ──
// import { db } from '../../src/config/firebase';
// import { doc, setDoc, getDoc, collection } from 'firebase/firestore';

// // ── Same BubbleWhats credentials as screen19 ──
// const VITE_BUBBLE_ID = '9110';
// const VITE_BUBBLE_AUTH = 'MzU3MGJlNWZjMGU5NDM3OGQyOTE1ZTU0';
// const BUBBLE_API_URL = `https://${VITE_BUBBLE_ID}.bubblewhats.com/send-message`;

// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// const OTP_LENGTH = 6;
// const RESEND_COOLDOWN = 60; // same as screen19

// const OtpScreen = () => {
//   const router = useRouter();
//   const { phone, otp: initialOtp, expiry: initialExpiry } = useLocalSearchParams();

//   const [generatedOTP, setGeneratedOTP] = useState(initialOtp || '');
//   const [otpExpiry, setOtpExpiry] = useState(parseInt(initialExpiry) || 0);

//   const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
//   const [loading, setLoading] = useState(false);
//   const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
//   const inputRefs = useRef([]);

//   useEffect(() => {
//     if (countdown <= 0) return;
//     const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
//     return () => clearTimeout(timer);
//   }, [countdown]);

//   const fullOtp = digits.join('');
//   const isComplete = fullOtp.length === OTP_LENGTH;

//   const handleDigitChange = (text, index) => {
//     // Paste support
//     if (text.length > 1) {
//       const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
//       const newDigits = Array(OTP_LENGTH).fill('');
//       pasted.forEach((d, i) => { newDigits[i] = d; });
//       setDigits(newDigits);
//       inputRefs.current[Math.min(pasted.length - 1, OTP_LENGTH - 1)]?.focus();
//       return;
//     }
//     const newDigits = [...digits];
//     newDigits[index] = text.replace(/\D/g, '');
//     setDigits(newDigits);
//     if (text && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
//   };

//   const handleKeyPress = (e, index) => {
//     if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   // ── Save to Firebase exactly like screen22's handleContinue ──
//   const saveToFirebase = async (phoneNumber) => {
//     try {
//       const timestamp = new Date();
//       const submissionId = timestamp.toISOString().replace(/[:.]/g, '-');
//       const userDocRef = doc(db, 'questionnaire_submissions', phoneNumber);

//       const userDoc = await getDoc(userDocRef);
//       const currentCount = userDoc.exists() ? (userDoc.data().total_submissions || 0) : 0;
//       const newVersion = currentCount + 1;

//       // Save versioned submission (same structure as screen22)
//       const submissionsColRef = collection(userDocRef, 'submissions');
//       await setDoc(doc(submissionsColRef, submissionId), {
//         raw_answers: {},                        // empty at auth stage — questionnaire fills this later
//         timestamp: timestamp.toISOString(),
//         submitted_at: timestamp,
//         version: newVersion,
//         auth_only: true,                        // flag so you know this is just the auth record
//       });

//       // Main document (same fields as screen22)
//       await setDoc(userDocRef, {
//         phone_number: phoneNumber,
//         full_name: '',                          // screen19 fills this — blank at auth stage
//         email: '',
//         latest_submission_date: timestamp.toISOString(),
//         latest_submission_id: submissionId,
//         total_submissions: newVersion,
//         last_updated: timestamp,
//         createdAt: userDoc.exists()
//           ? (userDoc.data().createdAt ?? timestamp.toISOString())
//           : timestamp.toISOString(),
//         timestamp: timestamp.toISOString(),
//       }, { merge: true });                      // merge: true so later questionnaire saves don't overwrite

//       console.log('✅ Phone saved to Firebase:', phoneNumber, '(version:', newVersion, ')');
//     } catch (error) {
//       console.error('❌ Firebase save error:', error);
//       // Non-blocking — don't fail the login just because Firebase had an issue
//     }
//   };

//   // ── Same verifyOTP logic as screen19 ──
//   const verifyOTP = async (otpCode) => {
//     setLoading(true);
//     try {
//       if (otpCode === generatedOTP && Date.now() <= otpExpiry) {

//         // 1️⃣ Same AsyncStorage save as screen19
//         await AsyncStorage.setItem('user_phone', phone);
//         await AsyncStorage.setItem('auth_token', 'verified');
//         await AsyncStorage.setItem('auth_timestamp', Date.now().toString());
//         console.log('✅ Phone saved to AsyncStorage:', phone);

//         // 2️⃣ Save to Firebase (same structure as screen22)
//         await saveToFirebase(phone);

//         // 3️⃣ Skip screen19 → go directly to screen20
//         //    (screen19 used to do: router.push('/(gowealthy)/questionnaire/section5/screen20'))
//         router.replace('/(gowealthy)');

//       } else if (Date.now() > otpExpiry) {
//         Alert.alert('OTP Expired', 'OTP has expired. Please request a new one.');
//         setDigits(Array(OTP_LENGTH).fill(''));
//         inputRefs.current[0]?.focus();
//       } else {
//         Alert.alert('Invalid OTP', 'Incorrect OTP. Please try again.');
//         setDigits(Array(OTP_LENGTH).fill(''));
//         inputRefs.current[0]?.focus();
//       }
//     } catch (err) {
//       console.error('Verify OTP Error:', err);
//       Alert.alert('Error', 'Verification failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerify = () => {
//     if (!isComplete || loading) return;
//     verifyOTP(fullOtp);
//   };

//   // ── Same resendOTP as screen19 ──
//   const resendOTP = async () => {
//     if (countdown > 0 || loading) return;
//     const newOTP = generateOTP();
//     const newExpiry = Date.now() + 5 * 60 * 1000;
//     setGeneratedOTP(newOTP);
//     setOtpExpiry(newExpiry);
//     setDigits(Array(OTP_LENGTH).fill(''));
//     setCountdown(RESEND_COOLDOWN);
//     inputRefs.current[0]?.focus();

//     try {
//       await fetch(BUBBLE_API_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'Authorization': VITE_BUBBLE_AUTH },
//         body: JSON.stringify({
//           jid: `91${phone}`,
//           message: `Your OTP is ${newOTP} for GoWealthy. Please do not share it with anyone. Valid for 5 minutes.`,
//         }),
//       });
//     } catch (err) {
//       console.error('Resend OTP Error:', err);
//     }
//   };

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor="#000000" />
//       <View style={styles.container}>
//         <KeyboardAvoidingView
//           style={{ flex: 1 }}
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         >
//           <ScrollView
//             contentContainerStyle={styles.scrollContent}
//             keyboardShouldPersistTaps="handled"
//             showsVerticalScrollIndicator={false}
//           >
//             <View style={styles.inner}>

//               <View style={styles.brandSection}>
//                 <Text style={styles.welcomeText}>Welcome Back to</Text>
//                 <Text style={styles.brandName}>GoWealthy</Text>
//                 <Text style={styles.tagline}>Enter the OTP sent to your WhatsApp</Text>
//               </View>

//               <View style={styles.formSection}>
//                 <Text style={styles.label}>Enter OTP</Text>
//                 <Text style={styles.phoneLine}>Sent to +91 {phone}</Text>

//                 <View style={styles.otpRow}>
//                   {digits.map((digit, index) => (
//                     <TextInput
//                       key={index}
//                       ref={ref => (inputRefs.current[index] = ref)}
//                       style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
//                       value={digit}
//                       onChangeText={text => handleDigitChange(text, index)}
//                       onKeyPress={e => handleKeyPress(e, index)}
//                       keyboardType="numeric"
//                       maxLength={OTP_LENGTH}
//                       selectTextOnFocus
//                       caretHidden
//                       autoFocus={index === 0}
//                       returnKeyType="done"
//                       onSubmitEditing={handleVerify}
//                     />
//                   ))}
//                 </View>

//                 <TouchableOpacity
//                   onPress={handleVerify}
//                   disabled={!isComplete || loading}
//                   activeOpacity={0.85}
//                 >
//                   {isComplete ? (
//                     <LinearGradient
//                       colors={['#FF8500', '#FF5500']}
//                       start={{ x: 0, y: 0 }}
//                       end={{ x: 1, y: 0 }}
//                       style={styles.ctaButton}
//                     >
//                       {loading
//                         ? <ActivityIndicator color="#fff" />
//                         : <Text style={styles.ctaText}>Verify & Login</Text>
//                       }
//                     </LinearGradient>
//                   ) : (
//                     <View style={[styles.ctaButton, styles.ctaDisabled]}>
//                       <Text style={[styles.ctaText, { color: 'rgba(255,255,255,0.3)' }]}>Verify & Login</Text>
//                     </View>
//                   )}
//                 </TouchableOpacity>

//                 {/* Resend — same wording as screen19 */}
//                 <View style={styles.resendContainer}>
//                   <TouchableOpacity onPress={resendOTP} disabled={countdown > 0 || loading}>
//                     <Text style={[styles.resendText, (countdown > 0 || loading) && styles.resendTextDisabled]}>
//                       {countdown > 0
//                         ? `Resend code in ${countdown}s`
//                         : "Didn't receive the code? Click to resend"}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>

//                 <TouchableOpacity onPress={() => router.back()} style={styles.changeLinkRow}>
//                   <Text style={styles.changeLink}>Change phone number</Text>
//                 </TouchableOpacity>

//               </View>
//             </View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </View>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000000' },
//   scrollContent: { flexGrow: 1, justifyContent: 'center' },
//   inner: {
//     flex: 1,
//     justifyContent: 'center',
//     paddingHorizontal: isMobile ? 28 : 48,
//     paddingVertical: 60,
//     maxWidth: 480,
//     alignSelf: 'center',
//     width: '100%',
//   },
//   brandSection: { alignItems: 'center', marginBottom: isMobile ? 52 : 68 },
//   welcomeText: { fontSize: isMobile ? 22 : 26, fontWeight: '700', color: '#ffffff', textAlign: 'center', marginBottom: 4 },
//   brandName: { fontSize: isMobile ? 32 : 38, fontWeight: '800', color: '#FF8500', textAlign: 'center', marginBottom: 12 },
//   tagline: { fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
//   formSection: { width: '100%', alignItems: 'center' },
//   label: { fontSize: 14, fontWeight: '600', color: '#ffffff', marginBottom: 6, alignSelf: 'flex-start' },
//   phoneLine: { fontSize: 13, color: '#FF8500', marginBottom: 20, alignSelf: 'flex-start', fontWeight: '500' },
//   otpRow: {
//     flexDirection: 'row',
//     gap: isMobile ? 10 : 12,
//     marginBottom: 28,
//     justifyContent: 'center',
//     width: '100%',
//   },
//   otpBox: {
//     width: isMobile ? 46 : 52,
//     height: isMobile ? 56 : 64,
//     backgroundColor: '#111111',
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: 'rgba(255,255,255,0.12)',
//     fontSize: isMobile ? 22 : 26,
//     fontWeight: '700',
//     color: '#ffffff',
//     textAlign: 'center',
//   },
//   otpBoxFilled: {
//     borderColor: '#FF8500',
//     backgroundColor: 'rgba(255,133,0,0.08)',
//   },
//   ctaButton: {
//     width: '100%',
//     paddingVertical: isMobile ? 17 : 19,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 14,
//     marginBottom: 20,
//   },
//   ctaDisabled: { backgroundColor: '#111111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
//   ctaText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
//   resendContainer: { marginBottom: 16, alignItems: 'center' },
//   resendText: { fontSize: 13, fontWeight: '500', color: '#6366f1' },
//   resendTextDisabled: { color: 'rgba(255,255,255,0.3)' },
//   changeLinkRow: { marginBottom: 8 },
//   changeLink: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' },
// });

// export default OtpScreen;

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase — same as screen22
import { db } from '../../src/config/firebase';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';

// Same BubbleWhats credentials as screen19
const VITE_BUBBLE_ID   = '9110';
const VITE_BUBBLE_AUTH = 'MzU3MGJlNWZjMGU5NDM3OGQyOTE1ZTU0';
const BUBBLE_API_URL   = `https://${VITE_BUBBLE_ID}.bubblewhats.com/send-message`;
const generateOTP      = () => Math.floor(100000 + Math.random() * 900000).toString();

// Design tokens
const C = {
  bg: '#030712', card: '#111827', cardBorder: '#1f2937',
  orange: '#FF8500', orangeDim: 'rgba(255,133,0,0.1)',
  orangeBorder: 'rgba(255,133,0,0.35)',
  purple: '#6366f1',
  white: '#ffffff', gray300: '#d1d5db',
  gray400: '#9ca3af', gray600: '#4b5563',
  inputBg: '#0d1117',
  green: '#10b981',
};

const OTP_LEN = 6;
const COOLDOWN = 60;

const OtpScreen = () => {
  const router = useRouter();
  const { phone, otp: initOtp, expiry: initExpiry } = useLocalSearchParams();

  const [genOTP, setGenOTP]     = useState(initOtp || '');
  const [expiry, setExpiry]     = useState(parseInt(initExpiry) || 0);
  const [digits, setDigits]     = useState(Array(OTP_LEN).fill(''));
  const [loading, setLoading]   = useState(false);
  const [timer, setTimer]       = useState(COOLDOWN);
  const refs = useRef([]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const fullOtp   = digits.join('');
  const isReady   = fullOtp.length === OTP_LEN;

  const onDigit = (text, i) => {
    // Paste support
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

  // Save to Firebase — same structure as screen22
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
        phone_number: phoneNumber, full_name: '', email: '',
        latest_submission_date: ts.toISOString(),
        latest_submission_id: sid,
        total_submissions: count + 1,
        last_updated: ts,
        createdAt: snap.exists() ? (snap.data().createdAt ?? ts.toISOString()) : ts.toISOString(),
        timestamp: ts.toISOString(),
      }, { merge: true });

      console.log('✅ Phone saved to Firebase:', phoneNumber, '(version:', count + 1, ')');
    } catch (e) {
      console.error('❌ Firebase save error:', e);
    }
  };

  // Same verifyOTP logic as screen19
  const verify = async (code) => {
    setLoading(true);
    try {
      if (code === genOTP && Date.now() <= expiry) {
        await AsyncStorage.setItem('user_phone', phone);
        await AsyncStorage.setItem('auth_token', 'verified');
        await AsyncStorage.setItem('auth_timestamp', Date.now().toString());
        console.log('✅ Phone saved to AsyncStorage:', phone);
        await saveToFirebase(phone);
        router.replace('/(gowealthy)');
      } else if (Date.now() > expiry) {
        Alert.alert('OTP Expired', 'Please request a new one.');
        setDigits(Array(OTP_LEN).fill(''));
        refs.current[0]?.focus();
      } else {
        Alert.alert('Incorrect OTP', 'Please try again.');
        setDigits(Array(OTP_LEN).fill(''));
        refs.current[0]?.focus();
      }
    } catch (e) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => { if (isReady && !loading) verify(fullOtp); };

  // Same resendOTP as screen19
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.root}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

              {/* Back */}
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>

              {/* Brand */}
              <View style={s.brand}>
                <Text style={s.brandSub}>Verifying your number</Text>
                <Text style={s.brandName}>GoWealthy</Text>
              </View>

              {/* Card */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Enter OTP</Text>

                {/* Phone line */}
                <View style={s.phoneRow}>
                  <Text style={s.phoneLabel}>Sent to WhatsApp: </Text>
                  <Text style={s.phoneNum}>+91 {phone}</Text>
                  <TouchableOpacity onPress={() => router.back()} style={s.editBtn}>
                    <Text style={s.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* OTP boxes */}
                <View style={s.otpRow}>
                  {digits.map((d, i) => (
                    <TextInput
                      key={i}
                      ref={r => (refs.current[i] = r)}
                      style={[s.box, d ? s.boxFilled : null, isReady && s.boxReady]}
                      value={d}
                      onChangeText={t => onDigit(t, i)}
                      onKeyPress={e => onKey(e, i)}
                      keyboardType="numeric"
                      maxLength={OTP_LEN}
                      selectTextOnFocus
                      caretHidden
                      autoFocus={i === 0}
                      returnKeyType="done"
                      onSubmitEditing={handleVerify}
                    />
                  ))}
                </View>

                {/* Verify btn */}
                <TouchableOpacity onPress={handleVerify} disabled={!isReady || loading} activeOpacity={0.86}>
                  {isReady ? (
                    <LinearGradient
                      colors={['#FF8500', '#e86200']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.btn}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.btnText}>Verify & Continue →</Text>
                      }
                    </LinearGradient>
                  ) : (
                    <View style={[s.btn, s.btnDisabled]}>
                      <Text style={[s.btnText, { color: C.gray600 }]}>Verify & Continue →</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Resend — same wording as screen19 */}
                <TouchableOpacity onPress={resend} disabled={timer > 0 || loading} style={s.resendRow}>
                  <Text style={[s.resendText, timer > 0 && s.resendDisabled]}>
                    {timer > 0
                      ? `Resend code in ${timer}s`
                      : "Didn't receive the code? Resend"}
                  </Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  inner: { maxWidth: 420, alignSelf: 'center', width: '100%' },

  backBtn: { marginBottom: 32 },
  backBtnText: { fontSize: 14, color: C.gray400, fontWeight: '500' },

  brand: { marginBottom: 28 },
  brandSub: { fontSize: 13, color: C.gray400, fontWeight: '500', marginBottom: 4 },
  brandName: { fontSize: 32, fontWeight: '800', color: C.orange, letterSpacing: -0.5 },

  card: {
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 20, padding: 24,
  },
  cardTitle: {
    fontSize: 22, fontWeight: '800',
    color: C.white, marginBottom: 14, letterSpacing: -0.3,
  },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 28, flexWrap: 'wrap', gap: 4,
  },
  phoneLabel: { fontSize: 13, color: C.gray400 },
  phoneNum:   { fontSize: 13, color: C.white, fontWeight: '700' },
  editBtn: {
    marginLeft: 6,
    backgroundColor: C.orangeDim,
    borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  editBtnText: { fontSize: 11, color: C.orange, fontWeight: '700' },

  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 24, gap: 8,
  },
  box: {
    flex: 1, aspectRatio: 0.9,
    backgroundColor: C.inputBg,
    borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: 12,
    fontSize: 22, fontWeight: '800',
    color: C.white, textAlign: 'center',
    maxWidth: 52,
  },
  boxFilled: { borderColor: C.orange, backgroundColor: 'rgba(255,133,0,0.07)' },
  boxReady:  { borderColor: C.green },

  btn: {
    borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    backgroundColor: '#0d1117',
    borderWidth: 1, borderColor: C.cardBorder,
  },
  btnText: { fontSize: 15, fontWeight: '800', color: C.white, letterSpacing: 0.3 },

  resendRow: { alignItems: 'center', paddingTop: 4 },
  resendText: { fontSize: 13, color: C.purple, fontWeight: '600' },
  resendDisabled: { color: C.gray600 },
});

export default OtpScreen;