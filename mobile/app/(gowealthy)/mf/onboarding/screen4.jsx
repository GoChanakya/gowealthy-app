
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   ActivityIndicator,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { db } from '../../../../src/config/firebase';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';
// const Screen4EmailOTP = () => {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [otp, setOtp] = useState('');
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [isSendingOtp, setIsSendingOtp] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [isLoadingData, setIsLoadingData] = useState(true);
//   const [alreadyVerified, setAlreadyVerified] = useState(false);

//   // ── On mount: check if email already saved (from Screen 3 or prior visit)
//   useEffect(() => {
//     loadExistingData();
//   }, []);

//   const loadExistingData = async () => {
//     try {
//       setIsLoadingData(true);
//       const phone = await AsyncStorage.getItem('user_phone');
//       if (!phone) return;

//       const docRef = doc(db, 'mf_onboarding', phone);
//       const docSnap = await getDoc(docRef);

//       if (docSnap.exists()) {
//         const data = docSnap.data();

//         // Pre-fill email if already saved from Screen 3 (EKYC path)
//         const savedEmail = data?.email_data?.email || '';
//         if (savedEmail) {
//           setEmail(savedEmail);
//           console.log('📧 Pre-filled email from Firestore:', savedEmail);
//         }

//         // If already verified in a previous session → show verified state
//         if (data?.email_data?.verified === true) {
//           setAlreadyVerified(true);
//           console.log('✅ Email already verified, can proceed');
//         }
//       }
//     } catch (e) {
//       console.log('Screen 4 load error:', e.message);
//     } finally {
//       setIsLoadingData(false);
//     }
//   };

//   const handleSendOTP = async () => {
//     setIsSendingOtp(true);
//     setErrorMessage('');
//     setSuccessMessage('');

//     try {
//       const response = await fetch(`${EMAIL_SERVICE_URL}/api/send-otp`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setOtpSent(true);
//         setSuccessMessage('Verification code sent! 📧');
//         setOtp('');
//         console.log('✅ OTP sent to:', email);
//       } else {
//         setErrorMessage(data.message || 'Failed to send verification code');
//       }
//     } catch (error) {
//       console.error('Error sending OTP:', error);
//       setErrorMessage('Network error. Please check your connection.');
//     } finally {
//       setIsSendingOtp(false);
//     }
//   };

//   const handleVerifyOTP = async () => {
//     setIsVerifying(true);
//     setErrorMessage('');

//     try {
//       const response = await fetch(`${EMAIL_SERVICE_URL}/api/verify-otp`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, otp }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setSuccessMessage('Email verified successfully! ✅');
//         console.log('✅ OTP verified for:', email);

//         // Save verified email to Firestore
//         const phone = await AsyncStorage.getItem('user_phone');
//         if (phone) {
//           const docRef = doc(db, 'mf_onboarding', phone);
//           await updateDoc(docRef, {
//             'email_data.email': email,
//             'email_data.verified': true,
//             'email_data.verified_at': new Date().toISOString(),
//             onboarding_step: 4,
//           });
//           console.log('💾 Verified email saved to Firestore');
//         }

//         setTimeout(() => {
//           router.push('/(gowealthy)/mf/onboarding/screen5');
//         }, 1200);
//       } else {
//         setErrorMessage(data.message || 'Invalid verification code');
//       }
//     } catch (error) {
//       console.error('Error verifying OTP:', error);
//       setErrorMessage('Network error. Please try again.');
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   const handleContinueVerified = () => {
//     router.push('/(gowealthy)/mf/onboarding/screen5');
//   };

//   const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   const isOtpValid = otp.length === 6;

//   if (isLoadingData) {
//     return (
//       <View style={styles.loadingScreen}>
//         <ActivityIndicator size="large" color="#6b50c4" />
//         <Text style={styles.loadingScreenText}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Text style={styles.backButtonText}>← Back</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Progress */}
//       <View style={styles.progressContainer}>
//         {[1, 2, 3, 4, 5, 6].map((step, idx) => (
//           <View key={step} style={styles.progressStepContainer}>
//             <View style={[
//               styles.progressCircle,
//               step <= 3 && styles.progressCircleCompleted,
//               step === 4 && styles.progressCircleActive,
//             ]}>
//               <Text style={[
//                 styles.progressText,
//                 step <= 4 && styles.progressTextActive,
//               ]}>{step <= 3 ? '✓' : step}</Text>
//             </View>
//             {idx < 5 && <View style={styles.progressLine} />}
//           </View>
//         ))}
//       </View>

//       <View style={styles.questionSection}>
//         <Text style={styles.questionTitle}>Verify Your Email</Text>
//         <Text style={styles.questionSubtitle}>
//           We'll send a verification code to secure your investment account
//         </Text>
//       </View>

//       <View style={styles.contentSection}>
//         <View style={styles.formContainer}>

//           {/* ── Already verified state ── */}
//           {alreadyVerified ? (
//             <View style={styles.verifiedCard}>
//               <Text style={styles.verifiedIcon}>✅</Text>
//               <Text style={styles.verifiedTitle}>Email Already Verified</Text>
//               <Text style={styles.verifiedEmail}>{email}</Text>
//               <Text style={styles.verifiedSubtext}>
//                 Your email was verified in a previous session.
//               </Text>
//               <TouchableOpacity
//                 onPress={() => {
//                   setAlreadyVerified(false);
//                   setEmail('');
//                 }}
//                 style={styles.changeEmailBtn}
//               >
//                 <Text style={styles.changeEmailBtnText}>Use a different email</Text>
//               </TouchableOpacity>
//             </View>
//           ) : !otpSent ? (
//             /* ── Email input state ── */
//             <>
//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Email Address *</Text>
//                 <TextInput
//                   value={email}
//                   onChangeText={(value) => {
//                     setEmail(value);
//                     setErrorMessage('');
//                   }}
//                   placeholder="your@email.com"
//                   placeholderTextColor="#666"
//                   style={styles.formInput}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                   autoCorrect={false}
//                 />
//                 {email && !isEmailValid && (
//                   <Text style={styles.inputError}>Please enter a valid email address</Text>
//                 )}
//                 {errorMessage ? <Text style={styles.inputError}>{errorMessage}</Text> : null}
//               </View>

//               <View style={styles.infoCard}>
//                 <View style={styles.infoCardHeader}>
//                   <Text style={styles.infoIcon}>📧</Text>
//                   <Text style={styles.infoCardHeaderText}>Email Verification</Text>
//                 </View>
//                 <Text style={styles.infoText}>
//                   We'll send a 6-digit code to your email. This email will be used for all your investment communications.
//                 </Text>
//               </View>
//             </>
//           ) : (
//             /* ── OTP input state ── */
//             <>
//               <View style={styles.otpSentMessage}>
//                 <Text style={styles.successIcon}>✓</Text>
//                 <Text style={styles.otpSentText}>
//                   Code sent to{' '}
//                   <Text style={styles.emailBold}>{email}</Text>
//                 </Text>
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Enter 6-digit code *</Text>
//                 <TextInput
//                   value={otp}
//                   onChangeText={(value) => {
//                     setOtp(value.replace(/[^0-9]/g, '').slice(0, 6));
//                     setErrorMessage('');
//                   }}
//                   placeholder="000000"
//                   placeholderTextColor="#666"
//                   style={[styles.formInput, styles.otpInput]}
//                   maxLength={6}
//                   keyboardType="number-pad"
//                 />
//                 {errorMessage ? <Text style={styles.inputError}>{errorMessage}</Text> : null}
//                 {successMessage ? <Text style={styles.inputSuccess}>{successMessage}</Text> : null}
//               </View>

//               <View style={styles.resendSection}>
//                 <TouchableOpacity onPress={handleSendOTP} style={styles.resendBtn}>
//                   <Text style={styles.resendText}>Resend Code</Text>
//                 </TouchableOpacity>
//                 <Text style={styles.resendDivider}> | </Text>
//                 <TouchableOpacity
//                   onPress={() => {
//                     setOtpSent(false);
//                     setOtp('');
//                     setErrorMessage('');
//                     setSuccessMessage('');
//                   }}
//                   style={styles.resendBtn}
//                 >
//                   <Text style={styles.resendText}>Change Email</Text>
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.infoCard}>
//                 <View style={styles.infoCardHeader}>
//                   <Text style={styles.infoIcon}>⏱️</Text>
//                   <Text style={styles.infoCardHeaderText}>Code expires in 10 minutes</Text>
//                 </View>
//                 <Text style={styles.infoText}>
//                   Check your inbox and spam folder. Enter the 6-digit code above.
//                 </Text>
//               </View>
//             </>
//           )}

//         </View>
//       </View>

//       {/* Buttons */}
//       <View style={styles.buttonSection}>
//         {alreadyVerified ? (
//           <TouchableOpacity onPress={handleContinueVerified} style={styles.continueButton}>
//             <Text style={styles.continueButtonText}>→ Continue</Text>
//           </TouchableOpacity>
//         ) : !otpSent ? (
//           <TouchableOpacity
//             onPress={handleSendOTP}
//             disabled={!isEmailValid || isSendingOtp}
//             style={[styles.continueButton, (!isEmailValid || isSendingOtp) && styles.continueButtonDisabled]}
//           >
//             {isSendingOtp ? (
//               <View style={styles.buttonRow}>
//                 <ActivityIndicator size="small" color="#fff" />
//                 <Text style={styles.continueButtonText}>Sending Code...</Text>
//               </View>
//             ) : (
//               <Text style={styles.continueButtonText}>📧 Send Verification Code</Text>
//             )}
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity
//             onPress={handleVerifyOTP}
//             disabled={!isOtpValid || isVerifying}
//             style={[styles.continueButton, (!isOtpValid || isVerifying) && styles.continueButtonDisabled]}
//           >
//             {isVerifying ? (
//               <View style={styles.buttonRow}>
//                 <ActivityIndicator size="small" color="#fff" />
//                 <Text style={styles.continueButtonText}>Verifying...</Text>
//               </View>
//             ) : (
//               <Text style={styles.continueButtonText}>✓ Verify & Continue</Text>
//             )}
//           </TouchableOpacity>
//         )}

//         {/* Dev skip */}
//         <TouchableOpacity
//           onPress={() => router.push('/(gowealthy)/mf/onboarding/screen5')}
//           style={styles.devButton}
//         >
//           <Text style={styles.devButtonText}>Skip (Dev) →</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000' },
//   loadingScreen: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 12 },
//   loadingScreenText: { color: '#fff', fontSize: 15 },
//   header: { padding: 20, paddingTop: 60 },
//   backButton: { padding: 8 },
//   backButtonText: { color: '#fff', fontSize: 16 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingHorizontal: 20 },
//   progressStepContainer: { flexDirection: 'row', alignItems: 'center' },
//   progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
//   progressCircleActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4', shadowColor: '#6b50c4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
//   progressCircleCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
//   progressText: { fontSize: 14, fontWeight: '600', color: '#666' },
//   progressTextActive: { color: '#fff' },
//   progressLine: { width: 24, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
//   questionSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
//   questionTitle: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
//   questionSubtitle: { fontSize: 16, color: '#999', lineHeight: 24, textAlign: 'center' },
//   contentSection: { marginBottom: 32 },
//   formContainer: { paddingHorizontal: 20 },
//   inputGroup: { marginBottom: 24 },
//   inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
//   formInput: { padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
//   otpInput: { textAlign: 'center', fontSize: 28, letterSpacing: 10, fontWeight: '700' },
//   inputError: { color: '#ef4444', fontSize: 12, marginTop: 6 },
//   inputSuccess: { color: '#10b981', fontSize: 12, marginTop: 6 },
//   otpSentMessage: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 12, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
//   successIcon: { fontSize: 18, color: '#10b981', fontWeight: 'bold' },
//   otpSentText: { color: '#10b981', fontWeight: '500', fontSize: 14 },
//   emailBold: { fontWeight: '700' },
//   resendSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
//   resendBtn: { padding: 4 },
//   resendText: { color: '#6b50c4', fontSize: 14, fontWeight: '600' },
//   resendDivider: { color: '#555', fontSize: 14, marginHorizontal: 4 },
//   infoCard: { backgroundColor: 'rgba(107,80,196,0.08)', borderWidth: 1.5, borderColor: 'rgba(107,80,196,0.25)', borderRadius: 12, padding: 16 },
//   infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
//   infoIcon: { fontSize: 18 },
//   infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
//   infoText: { fontSize: 13, color: '#ccc', lineHeight: 20 },
//   verifiedCard: { backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
//   verifiedIcon: { fontSize: 40, marginBottom: 4 },
//   verifiedTitle: { fontSize: 18, fontWeight: '700', color: '#10b981' },
//   verifiedEmail: { fontSize: 15, fontWeight: '600', color: '#fff' },
//   verifiedSubtext: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },
//   changeEmailBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 16 },
//   changeEmailBtnText: { color: '#6b50c4', fontSize: 14, fontWeight: '600' },
//   buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
//   continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
//   continueButtonDisabled: { backgroundColor: '#333', opacity: 0.5 },
//   continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   devButton: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', opacity: 0.7 },
//   devButtonText: { color: '#fff', fontSize: 14 },
// });

// export default Screen4EmailOTP;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';

// ── ember forge palette (matches gowealthy_redesigned.html) ──────────────
const C = {
  bg: '#08060a', bg2: '#0e0a10', bg3: '#151019',
  surface: '#181219', surface2: '#1f1722',
  line: 'rgba(255,180,120,0.09)', line2: 'rgba(255,180,120,0.16)',
  ink: '#fbf5ef', muted: '#a99ba6', faint: '#332a36',
  o: '#ff6a1a', o2: '#ff8f3c', oDeep: '#d4470a',
  gold: '#f7c85a', gold2: '#ffe0a3',
  good: '#4fd39a', bad: '#ff6b6b',
  glass: 'rgba(30,22,34,0.72)',
};

// ── floating embers background (matches .embers/.ember rise animation) ───
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const EMBER_COUNT = 14;

const EmberField = () => {
  const embers = useMemo(() => (
    Array.from({ length: EMBER_COUNT }).map((_, i) => ({
      key: i,
      left: Math.random() * SCREEN_W,
      size: 2 + Math.random() * 2.5,
      duration: 5500 + Math.random() * 5000,
      delay: Math.random() * 6000,
      drift: (Math.random() - 0.5) * 30,
    }))
  ), []);

  return (
    <View style={styles.embersWrap} pointerEvents="none">
      {embers.map((e) => (
        <Ember key={e.key} {...e} />
      ))}
    </View>
  );
};

const Ember = ({ left, size, duration, delay, drift }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    const loop = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && mounted) loop();
      });
    };
    loop();
    return () => { mounted = false; };
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(SCREEN_H + 100)],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.12, 0.85, 1],
    outputRange: [0, 0.75, 0.4, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        bottom: -10,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.o2,
        shadowColor: C.o2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        opacity,
        transform: [{ translateY }, { translateX }, { scale }],
      }}
    />
  );
};

const Screen4EmailOTP = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  // ── On mount: check if email already saved (from Screen 3 or prior visit)
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setIsLoadingData(true);
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) return;

      const docRef = doc(db, 'mf_onboarding', phone);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Pre-fill email if already saved from Screen 3 (EKYC path)
        const savedEmail = data?.email_data?.email || '';
        if (savedEmail) {
          setEmail(savedEmail);
          console.log('📧 Pre-filled email from Firestore:', savedEmail);
        }

        // If already verified in a previous session → show verified state
        if (data?.email_data?.verified === true) {
          setAlreadyVerified(true);
          console.log('✅ Email already verified, can proceed');
        }
      }
    } catch (e) {
      console.log('Screen 4 load error:', e.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSendOTP = async () => {
    setIsSendingOtp(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setSuccessMessage('Verification code sent! 📧');
        setOtp('');
        console.log('✅ OTP sent to:', email);
      } else {
        setErrorMessage(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsVerifying(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Email verified successfully! ✅');
        console.log('✅ OTP verified for:', email);

        // Save verified email to Firestore
        const phone = await AsyncStorage.getItem('user_phone');
        if (phone) {
          const docRef = doc(db, 'mf_onboarding', phone);
          await updateDoc(docRef, {
            'email_data.email': email,
            'email_data.verified': true,
            'email_data.verified_at': new Date().toISOString(),
            onboarding_step: 4,
          });
          console.log('💾 Verified email saved to Firestore');
        }

        setTimeout(() => {
          router.push('/(gowealthy)/mf/onboarding/screen5');
        }, 1200);
      } else {
        setErrorMessage(data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinueVerified = () => {
    router.push('/(gowealthy)/mf/onboarding/screen5');
  };

  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isOtpValid = otp.length === 6;

  const STEP = 4;
  const TOTAL_STEPS = 6;

  if (isLoadingData) {
    return (
      <View style={styles.loadingScreen}>
        <EmberField />
        <ActivityIndicator size="large" color={C.o} />
        <Text style={styles.loadingScreenText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <EmberField />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── top chrome: progress rail + back + step tag ── */}
        <View style={styles.progWrap}>
          <LinearGradient
            colors={[C.oDeep, C.o, C.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progBar, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]}
          />
        </View>

        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.stepTag}>
            <Text style={styles.stepTagText}>STEP {STEP} OF {TOTAL_STEPS}</Text>
          </View>
        </View>

        {/* ── heading ── */}
        <View style={styles.questionSection}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrow}>EMAIL VERIFICATION</Text>
            <View style={styles.eyebrowLine} />
          </View>
          <Text style={styles.questionTitle}>
            Verify your <Text style={styles.gradWord}>Email</Text>
          </Text>
          <Text style={styles.questionSubtitle}>
            We'll send a verification code to secure your investment account
          </Text>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.formContainer}>

            {/* ── Already verified state ── */}
            {alreadyVerified ? (
              <View style={styles.verifiedCard}>
                <Text style={styles.verifiedIcon}>✅</Text>
                <Text style={styles.verifiedTitle}>Email Already Verified</Text>
                <Text style={styles.verifiedEmail}>{email}</Text>
                <Text style={styles.verifiedSubtext}>
                  Your email was verified in a previous session.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setAlreadyVerified(false);
                    setEmail('');
                  }}
                  style={styles.changeEmailBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.changeEmailBtnText}>Use a different email</Text>
                </TouchableOpacity>
              </View>
            ) : !otpSent ? (
              /* ── Email input state ── */
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address *</Text>
                  <TextInput
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setErrorMessage('');
                    }}
                    placeholder="your@email.com"
                    placeholderTextColor={C.muted}
                    style={styles.formInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {email && !isEmailValid && (
                    <Text style={styles.inputError}>Please enter a valid email address</Text>
                  )}
                  {errorMessage ? <Text style={styles.inputError}>{errorMessage}</Text> : null}
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Text style={styles.infoIcon}>📧</Text>
                    <Text style={styles.infoCardHeaderText}>Email Verification</Text>
                  </View>
                  <Text style={styles.infoText}>
                    We'll send a 6-digit code to your email. This email will be used for all your investment communications.
                  </Text>
                </View>
              </>
            ) : (
              /* ── OTP input state ── */
              <>
                <View style={styles.otpSentMessage}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.otpSentText}>
                    Code sent to{' '}
                    <Text style={styles.emailBold}>{email}</Text>
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter 6-digit code *</Text>
                  <TextInput
                    value={otp}
                    onChangeText={(value) => {
                      setOtp(value.replace(/[^0-9]/g, '').slice(0, 6));
                      setErrorMessage('');
                    }}
                    placeholder="000000"
                    placeholderTextColor={C.muted}
                    style={[styles.formInput, styles.otpInput]}
                    maxLength={6}
                    keyboardType="number-pad"
                  />
                  {errorMessage ? <Text style={styles.inputError}>{errorMessage}</Text> : null}
                  {successMessage ? <Text style={styles.inputSuccess}>{successMessage}</Text> : null}
                </View>

                <View style={styles.resendSection}>
                  <TouchableOpacity onPress={handleSendOTP} style={styles.resendBtn} activeOpacity={0.8}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                  <Text style={styles.resendDivider}> | </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setOtpSent(false);
                      setOtp('');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    style={styles.resendBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resendText}>Change Email</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Text style={styles.infoIcon}>⏱️</Text>
                    <Text style={styles.infoCardHeaderText}>Code expires in 10 minutes</Text>
                  </View>
                  <Text style={styles.infoText}>
                    Check your inbox and spam folder. Enter the 6-digit code above.
                  </Text>
                </View>
              </>
            )}

          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          {alreadyVerified ? (
            <TouchableOpacity onPress={handleContinueVerified} activeOpacity={0.9} style={styles.continueButtonWrap}>
              <LinearGradient
                colors={[C.o2, C.o]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.continueButton}
              >
                <Text style={styles.continueButtonText}>→ Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : !otpSent ? (
            <TouchableOpacity
              onPress={handleSendOTP}
              disabled={!isEmailValid || isSendingOtp}
              activeOpacity={0.9}
              style={styles.continueButtonWrap}
            >
              <LinearGradient
                colors={(!isEmailValid || isSendingOtp) ? [C.faint, C.faint] : [C.o2, C.o]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.continueButton, (!isEmailValid || isSendingOtp) && styles.continueButtonDisabled]}
              >
                {isSendingOtp ? (
                  <View style={styles.buttonRow}>
                    <ActivityIndicator size="small" color={C.muted} />
                    <Text style={[styles.continueButtonText, styles.continueButtonTextDisabled]}>Sending Code...</Text>
                  </View>
                ) : (
                  <Text style={styles.continueButtonText}>📧 Send Verification Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleVerifyOTP}
              disabled={!isOtpValid || isVerifying}
              activeOpacity={0.9}
              style={styles.continueButtonWrap}
            >
              <LinearGradient
                colors={(!isOtpValid || isVerifying) ? [C.faint, C.faint] : [C.o2, C.o]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.continueButton, (!isOtpValid || isVerifying) && styles.continueButtonDisabled]}
              >
                {isVerifying ? (
                  <View style={styles.buttonRow}>
                    <ActivityIndicator size="small" color={C.muted} />
                    <Text style={[styles.continueButtonText, styles.continueButtonTextDisabled]}>Verifying...</Text>
                  </View>
                ) : (
                  <Text style={styles.continueButtonText}>✓ Verify & Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Dev skip */}
          <TouchableOpacity
            onPress={() => router.push('/(gowealthy)/mf/onboarding/screen5')}
            style={styles.devButton}
            activeOpacity={0.8}
          >
            <Text style={styles.devButtonText}>Skip (Dev) →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── shell ──
  screen: { flex: 1, backgroundColor: C.bg },
  embersWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 24 },

  loadingScreen: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingScreenText: { color: C.ink, fontSize: 14, fontWeight: '500' },

  // ── top chrome ──
  progWrap: { height: 3, width: '100%', backgroundColor: 'rgba(255,255,255,0.05)' },
  progBar: { height: '100%' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.glass,
    borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: C.muted, fontSize: 17, fontWeight: '600' },
  stepTag: {
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.line,
    borderRadius: 30, paddingVertical: 6, paddingHorizontal: 13,
  },
  stepTagText: { color: C.muted, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2 },

  // ── heading ──
  questionSection: { alignItems: 'center', marginTop: 22, marginBottom: 28, paddingHorizontal: 22 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  eyebrowLine: { width: 20, height: 1, backgroundColor: C.o2 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: C.o2, textTransform: 'uppercase' },
  questionTitle: {
    fontSize: 30, fontWeight: '700', color: C.ink, marginBottom: 12,
    textAlign: 'center', letterSpacing: -0.5, lineHeight: 36,
  },
  gradWord: { color: C.o2 },
  questionSubtitle: { fontSize: 14.5, color: C.muted, lineHeight: 21, maxWidth: 340, textAlign: 'center' },

  // ── content ──
  contentSection: { marginBottom: 8 },
  formContainer: { paddingHorizontal: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },

  inputGroup: { marginBottom: 22 },
  inputLabel: { fontSize: 12.5, fontWeight: '600', color: C.muted, marginBottom: 8, letterSpacing: 0.3 },
  formInput: {
    padding: 14, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line2,
    borderRadius: 13, color: C.ink, fontSize: 14.5,
  },
  otpInput: { textAlign: 'center', fontSize: 26, letterSpacing: 10, fontWeight: '700', color: C.o2 },
  inputError: { color: C.bad, fontSize: 12, marginTop: 6 },
  inputSuccess: { color: C.good, fontSize: 12, marginTop: 6 },

  otpSentMessage: {
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1.5, borderColor: 'rgba(79,211,154,0.3)',
    borderRadius: 16, padding: 16, marginBottom: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  successIcon: { fontSize: 16, color: C.good, fontWeight: 'bold' },
  otpSentText: { color: C.good, fontWeight: '600', fontSize: 13.5 },
  emailBold: { fontWeight: '700', color: C.ink },

  resendSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  resendBtn: { padding: 4 },
  resendText: { color: C.o2, fontSize: 13.5, fontWeight: '700' },
  resendDivider: { color: C.faint, fontSize: 14, marginHorizontal: 4 },

  infoCard: {
    backgroundColor: 'rgba(255,106,26,0.07)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.22)',
    borderRadius: 16, padding: 16,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 16 },
  infoCardHeaderText: { fontSize: 13.5, fontWeight: '700', color: C.ink },
  infoText: { fontSize: 13, color: C.muted, lineHeight: 20 },

  verifiedCard: {
    backgroundColor: 'rgba(79,211,154,0.08)', borderWidth: 1.5, borderColor: 'rgba(79,211,154,0.28)',
    borderRadius: 20, padding: 24, alignItems: 'center', gap: 8,
  },
  verifiedIcon: { fontSize: 38, marginBottom: 4 },
  verifiedTitle: { fontSize: 17, fontWeight: '700', color: C.good },
  verifiedEmail: { fontSize: 14.5, fontWeight: '700', color: C.ink },
  verifiedSubtext: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
  changeEmailBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 16 },
  changeEmailBtnText: { color: C.o2, fontSize: 13.5, fontWeight: '700' },

  buttonSection: { padding: 20, gap: 12, marginBottom: 20 },
  continueButtonWrap: { borderRadius: 15, shadowColor: C.o, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  continueButton: {
    paddingVertical: 16, borderRadius: 15, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  continueButtonDisabled: { shadowOpacity: 0 },
  continueButtonText: { color: '#1a0d04', fontSize: 15.5, fontWeight: '700' },
  continueButtonTextDisabled: { color: C.muted },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devButton: {
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1, borderColor: 'rgba(79,211,154,0.3)',
    paddingVertical: 10, borderRadius: 30, alignItems: 'center',
  },
  devButtonText: { color: C.good, fontSize: 13, fontWeight: '600' },
});

export default Screen4EmailOTP;