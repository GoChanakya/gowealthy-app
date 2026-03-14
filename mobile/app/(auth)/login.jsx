
// import React, { useState } from 'react';
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
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import { isMobile } from '../../src/theme/globalStyles';

// // ── Same credentials as screen19 ──
// const VITE_BUBBLE_ID = '9110';
// const VITE_BUBBLE_AUTH = 'MzU3MGJlNWZjMGU5NDM3OGQyOTE1ZTU0';
// const BUBBLE_API_URL = `https://${VITE_BUBBLE_ID}.bubblewhats.com/send-message`;

// // Same generateOTP as screen19
// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// const LoginScreen = () => {
//   const router = useRouter();
//   const [phone, setPhone] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Same validateMobile logic as screen19
//   const isValidPhone = () => {
//     const digits = phone.replace(/\D/g, '');
//     if (digits.length !== 10) return false;
//     if (!['6', '7', '8', '9'].includes(digits[0])) return false;
//     for (let i = 0; i <= digits.length - 5; i++) {
//       const sub = digits.substring(i, i + 5);
//       if (sub.split('').every(d => d === sub[0])) return false;
//     }
//     return true;
//   };

//   const handleSendOTP = async () => {
//     if (!isValidPhone() || loading) return;
//     setLoading(true);

//     const otp = generateOTP();
//     const expiry = (Date.now() + 5 * 60 * 1000).toString();
//     const cleanPhone = phone.replace(/\D/g, '');
//     const formattedPhone = `91${cleanPhone}`; // same as screen19

//     try {
//       const response = await fetch(BUBBLE_API_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': VITE_BUBBLE_AUTH,
//         },
//         body: JSON.stringify({
//           jid: formattedPhone,
//           // Same message as screen19
//           message: `Your OTP is ${otp} for GoWealthy. Please do not share it with anyone. Valid for 5 minutes.`,
//         }),
//       });

//       if (response.ok) {
//         router.push({
//           pathname: '/(auth)/otp',
//           params: { phone: cleanPhone, otp, expiry },
//         });
//       } else {
//         Alert.alert('Failed to send OTP', 'Could not send OTP via WhatsApp. Please check your number and try again.');
//       }
//     } catch (err) {
//       Alert.alert('Network Error', 'Please check your internet connection and try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const phoneValid = isValidPhone();

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
//                 <Text style={styles.tagline}>Sign in to access your dashboard</Text>
//               </View>

//               <View style={styles.formSection}>
//                 <Text style={styles.label}>Phone Number</Text>
//                 <View style={[styles.inputWrapper, phoneValid && styles.inputWrapperActive]}>
//                   <Text style={styles.countryCode}>+91</Text>
//                   <View style={styles.divider} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter your 10-digit phone number"
//                     placeholderTextColor="rgba(255,255,255,0.3)"
//                     keyboardType="numeric"
//                     maxLength={10}
//                     value={phone}
//                     onChangeText={(text) => { if (/^\d*$/.test(text)) setPhone(text); }}
//                     returnKeyType="done"
//                     onSubmitEditing={handleSendOTP}
//                     autoFocus
//                   />
//                 </View>

//                 <TouchableOpacity
//                   onPress={handleSendOTP}
//                   disabled={!phoneValid || loading}
//                   activeOpacity={0.85}
//                 >
//                   {phoneValid ? (
//                     <LinearGradient
//                       colors={['#FF8500', '#FF5500']}
//                       start={{ x: 0, y: 0 }}
//                       end={{ x: 1, y: 0 }}
//                       style={styles.ctaButton}
//                     >
//                       {loading
//                         ? <ActivityIndicator color="#fff" />
//                         : <Text style={styles.ctaText}>Send OTP</Text>
//                       }
//                     </LinearGradient>
//                   ) : (
//                     <View style={[styles.ctaButton, styles.ctaDisabled]}>
//                       <Text style={[styles.ctaText, { color: 'rgba(255,255,255,0.3)' }]}>Send OTP</Text>
//                     </View>
//                   )}
//                 </TouchableOpacity>

//                 <Text style={styles.whatsappNote}>📲 OTP will be sent to your WhatsApp</Text>

//                 <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
//                   <Text style={styles.backLinkText}>← Back to Home</Text>
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
//   formSection: { width: '100%' },
//   label: { fontSize: 14, fontWeight: '600', color: '#ffffff', marginBottom: 8 },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#111111',
//     borderRadius: 14,
//     borderWidth: 1.5,
//     borderColor: 'rgba(255,255,255,0.1)',
//     paddingHorizontal: 16,
//     marginBottom: 20,
//   },
//   inputWrapperActive: { borderColor: '#FF8500' },
//   countryCode: { fontSize: 15, color: 'rgba(255,255,255,0.55)', paddingVertical: 17, fontWeight: '600' },
//   divider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 12 },
//   input: { flex: 1, fontSize: 16, color: '#ffffff', paddingVertical: 17 },
//   ctaButton: {
//     paddingVertical: isMobile ? 17 : 19,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 14,
//     marginBottom: 18,
//   },
//   ctaDisabled: { backgroundColor: '#111111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
//   ctaText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
//   whatsappNote: { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 },
//   backLink: { alignItems: 'center' },
//   backLinkText: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
// });

// export default LoginScreen;

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Same credentials as screen19
const VITE_BUBBLE_ID   = '9110';
const VITE_BUBBLE_AUTH = 'MzU3MGJlNWZjMGU5NDM3OGQyOTE1ZTU0';
const BUBBLE_API_URL   = `https://${VITE_BUBBLE_ID}.bubblewhats.com/send-message`;
const generateOTP      = () => Math.floor(100000 + Math.random() * 900000).toString();

// Design tokens
const C = {
  bg: '#030712', card: '#111827', cardBorder: '#1f2937',
  orange: '#FF8500', orangeDim: 'rgba(255,133,0,0.1)',
  orangeBorder: 'rgba(255,133,0,0.35)',
  white: '#ffffff', gray300: '#d1d5db',
  gray400: '#9ca3af', gray600: '#4b5563',
  inputBg: '#0d1117',
};

const LoginScreen = () => {
  const router = useRouter();
  const [phone, setPhone]   = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Same validateMobile as screen19
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
                <Text style={s.brandSub}>Welcome back to</Text>
                <Text style={s.brandName}>GoWealthy</Text>
              </View>

              {/* Card */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Sign in</Text>
                <Text style={s.cardSub}>
                  Enter your WhatsApp number.{'\n'}We'll send a one-time code to verify you.
                </Text>

                {/* Input */}
                <Text style={s.inputLabel}>Phone Number</Text>
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
                </View>

                {/* CTA */}
                <TouchableOpacity onPress={handleSendOTP} disabled={!valid || loading} activeOpacity={0.86}>
                  {valid ? (
                    <LinearGradient
                      colors={['#FF8500', '#e86200']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.btn}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.btnText}>Send OTP →</Text>
                      }
                    </LinearGradient>
                  ) : (
                    <View style={[s.btn, s.btnDisabled]}>
                      <Text style={[s.btnText, { color: C.gray600 }]}>Send OTP →</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* WhatsApp note */}
                <View style={s.waNote}>
                  <Text style={s.waNoteText}>📲  OTP sent via WhatsApp</Text>
                </View>
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
    color: C.white, marginBottom: 8, letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13, color: C.gray400,
    lineHeight: 20, marginBottom: 28,
  },

  inputLabel: {
    fontSize: 12, fontWeight: '700',
    color: C.gray300, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: 12, marginBottom: 20, overflow: 'hidden',
  },
  inputRowActive: { borderColor: C.orange },
  prefixBox: {
    paddingHorizontal: 14, paddingVertical: 15,
    backgroundColor: 'rgba(255,133,0,0.06)',
  },
  prefix: { fontSize: 14, color: C.gray300, fontWeight: '600' },
  inputDivider: { width: 1, height: '60%', backgroundColor: C.cardBorder },
  input: {
    flex: 1, fontSize: 16, color: C.white,
    paddingHorizontal: 14, paddingVertical: 15,
    fontWeight: '500', letterSpacing: 1,
  },

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

  waNote: {
    alignItems: 'center',
    paddingTop: 4,
  },
  waNoteText: { fontSize: 12, color: C.gray600, fontWeight: '500' },
});

export default LoginScreen;