// import React, { useState } from 'react';
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

// const Screen4EmailOTP = () => {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [otp, setOtp] = useState('');
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [isSendingOtp, setIsSendingOtp] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');

//  const API_BASE_URL = 'http://192.168.1.20:5000';


//   const handleSendOTP = async () => {
//     setIsSendingOtp(true);
//     setErrorMessage('');
//     setSuccessMessage('');

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setOtpSent(true);
//         setSuccessMessage('Verification code sent! 📧');
//         setOtp('');
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
//       const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, otp }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setSuccessMessage('Email verified successfully! ✅');
        
//         await AsyncStorage.setItem('mf_email_verified', JSON.stringify({ email, verified: true }));
        
//         setTimeout(() => {
//           router.push('/(gowealthy)/mf/onboarding/screen5');
//         }, 1500);
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

//   const isEmailValid = email && email.includes('@');
//   const isOtpValid = otp.length === 6;

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Text style={styles.backButtonText}>← Back</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.progressContainer}>
//         {[1, 2, 3, 4, 5, 6].map((step, idx) => (
//           <View key={step} style={styles.progressStepContainer}>
//             <View style={[
//               styles.progressCircle,
//               step <= 3 && styles.progressCircleCompleted,
//               step === 4 && styles.progressCircleActive
//             ]}>
//               <Text style={[
//                 styles.progressText,
//                 step <= 4 && styles.progressTextActive
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
//           {!otpSent ? (
//             <>
//               <View style={styles.inputGroup}>
//                 <Text style={styles.inputLabel}>Email Address *</Text>
//                 <TextInput
//                   value={email}
//                   onChangeText={(value) => {
//                     setEmail(value);
//                     setErrorMessage('');
//                   }}
//                   placeholder="Enter your email address"
//                   placeholderTextColor="#666"
//                   style={styles.formInput}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                 />
//                 {email && !isEmailValid && (
//                   <Text style={styles.inputError}>Please enter a valid email address</Text>
//                 )}
//                 {errorMessage && <Text style={styles.inputError}>{errorMessage}</Text>}
//                 {successMessage && <Text style={styles.inputSuccess}>{successMessage}</Text>}
//               </View>

//               <View style={styles.infoCard}>
//                 <View style={styles.infoCardHeader}>
//                   <Text style={styles.infoIcon}>📧</Text>
//                   <Text style={styles.infoCardHeaderText}>Email Verification</Text>
//                 </View>
//                 <Text style={styles.infoText}>
//                   We'll send a 6-digit code to verify your email. This ensures secure access to your investment account.
//                 </Text>
//               </View>
//             </>
//           ) : (
//             <>
//               <View style={styles.otpSection}>
//                 <View style={styles.otpSentMessage}>
//                   <Text style={styles.successIcon}>✓</Text>
//                   <Text style={styles.otpSentText}>Code sent to <Text style={styles.emailBold}>{email}</Text></Text>
//                 </View>

//                 <View style={styles.inputGroup}>
//                   <Text style={styles.inputLabel}>Enter 6-digit code *</Text>
//                   <TextInput
//                     value={otp}
//                     onChangeText={(value) => {
//                       const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
//                       setOtp(cleanValue);
//                       setErrorMessage('');
//                     }}
//                     placeholder="000000"
//                     placeholderTextColor="#666"
//                     style={[styles.formInput, styles.otpInput]}
//                     maxLength={6}
//                     keyboardType="number-pad"
//                   />
//                   {errorMessage && <Text style={styles.inputError}>{errorMessage}</Text>}
//                   {successMessage && <Text style={styles.inputSuccess}>{successMessage}</Text>}
//                 </View>

//                 <View style={styles.resendSection}>
//                   <TouchableOpacity onPress={handleSendOTP} style={styles.resendBtn}>
//                     <Text style={styles.resendText}>Resend Code</Text>
//                   </TouchableOpacity>
//                   <Text style={styles.resendDivider}> | </Text>
//                   <TouchableOpacity onPress={() => {
//                     setOtpSent(false);
//                     setOtp('');
//                     setErrorMessage('');
//                     setSuccessMessage('');
//                   }} style={styles.resendBtn}>
//                     <Text style={styles.resendText}>Change Email</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               <View style={styles.infoCard}>
//                 <View style={styles.infoCardHeader}>
//                   <Text style={styles.infoIcon}>⚠️</Text>
//                   <Text style={styles.infoCardHeaderText}>Verification Code</Text>
//                 </View>
//                 <Text style={styles.infoText}>
//                   Check your email for the 6-digit code. It's valid for 10 minutes.
//                 </Text>
//               </View>
//             </>
//           )}
//         </View>
//       </View>

//       <View style={styles.buttonSection}>
//         {!otpSent ? (
//           <TouchableOpacity
//             onPress={handleSendOTP}
//             disabled={!isEmailValid || isSendingOtp}
//             style={[styles.continueButton, (!isEmailValid || isSendingOtp) && styles.continueButtonDisabled]}
//           >
//             {isSendingOtp ? (
//               <>
//                 <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
//                 <Text style={styles.continueButtonText}>Sending Code...</Text>
//               </>
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
//               <>
//                 <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
//                 <Text style={styles.continueButtonText}>Verifying...</Text>
//               </>
//             ) : (
//               <Text style={styles.continueButtonText}>✓ Verify & Continue</Text>
//             )}
//           </TouchableOpacity>
//         )}

//         <TouchableOpacity
//           onPress={() => router.push('/(gowealthy)/mf/onboarding/screen5')}
//           style={styles.nextDevButton}
//         >
//           <Text style={styles.nextDevButtonText}>Next →</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000' },
//   header: { padding: 20, paddingTop: 60 },
//   backButton: { padding: 8 },
//   backButtonText: { color: '#fff', fontSize: 16 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingHorizontal: 20 },
//   progressStepContainer: { flexDirection: 'row', alignItems: 'center' },
//   progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
//   progressCircleActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4' },
//   progressCircleCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
//   progressText: { fontSize: 14, fontWeight: '600', color: '#666' },
//   progressTextActive: { color: '#fff' },
//   progressLine: { width: 24, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginHorizontal: 4 },
//   questionSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
//   questionTitle: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
//   questionSubtitle: { fontSize: 16, color: '#999', lineHeight: 24, maxWidth: 600, textAlign: 'center' },
//   contentSection: { marginBottom: 32 },
//   formContainer: { paddingHorizontal: 20 },
//   inputGroup: { marginBottom: 24 },
//   inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
//   formInput: { padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
//   otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '600' },
//   inputError: { color: '#ef4444', fontSize: 12, marginTop: 4 },
//   inputSuccess: { color: '#10b981', fontSize: 12, marginTop: 4 },
//   otpSection: { marginBottom: 16 },
//   otpSentMessage: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1.5, borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: 12, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
//   successIcon: { fontSize: 20, color: '#10b981', fontWeight: 'bold' },
//   otpSentText: { color: '#10b981', fontWeight: '500', fontSize: 14 },
//   emailBold: { fontWeight: '700' },
//   resendSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
//   resendBtn: { padding: 4 },
//   resendText: { color: '#6b50c4', fontSize: 14, fontWeight: '600' },
//   resendDivider: { color: '#666', fontSize: 14 },
//   infoCard: { backgroundColor: 'rgba(59, 130, 246, 0.08)', borderWidth: 1.5, borderColor: 'rgba(59, 130, 246, 0.25)', borderRadius: 12, padding: 16 },
//   infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
//   infoIcon: { fontSize: 18 },
//   infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
//   infoText: { fontSize: 13, color: '#3b82f6', lineHeight: 18, opacity: 0.9 },
//   buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
//   continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
//   continueButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
//   continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
//   nextDevButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', opacity: 0.8 },
//   nextDevButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
// });

// export default Screen4EmailOTP;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';
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

  if (isLoadingData) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6b50c4" />
        <Text style={styles.loadingScreenText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6].map((step, idx) => (
          <View key={step} style={styles.progressStepContainer}>
            <View style={[
              styles.progressCircle,
              step <= 3 && styles.progressCircleCompleted,
              step === 4 && styles.progressCircleActive,
            ]}>
              <Text style={[
                styles.progressText,
                step <= 4 && styles.progressTextActive,
              ]}>{step <= 3 ? '✓' : step}</Text>
            </View>
            {idx < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Verify Your Email</Text>
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
                  placeholderTextColor="#666"
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
                  placeholderTextColor="#666"
                  style={[styles.formInput, styles.otpInput]}
                  maxLength={6}
                  keyboardType="number-pad"
                />
                {errorMessage ? <Text style={styles.inputError}>{errorMessage}</Text> : null}
                {successMessage ? <Text style={styles.inputSuccess}>{successMessage}</Text> : null}
              </View>

              <View style={styles.resendSection}>
                <TouchableOpacity onPress={handleSendOTP} style={styles.resendBtn}>
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
          <TouchableOpacity onPress={handleContinueVerified} style={styles.continueButton}>
            <Text style={styles.continueButtonText}>→ Continue</Text>
          </TouchableOpacity>
        ) : !otpSent ? (
          <TouchableOpacity
            onPress={handleSendOTP}
            disabled={!isEmailValid || isSendingOtp}
            style={[styles.continueButton, (!isEmailValid || isSendingOtp) && styles.continueButtonDisabled]}
          >
            {isSendingOtp ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.continueButtonText}>Sending Code...</Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>📧 Send Verification Code</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleVerifyOTP}
            disabled={!isOtpValid || isVerifying}
            style={[styles.continueButton, (!isOtpValid || isVerifying) && styles.continueButtonDisabled]}
          >
            {isVerifying ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.continueButtonText}>Verifying...</Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>✓ Verify & Continue</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Dev skip */}
        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/mf/onboarding/screen5')}
          style={styles.devButton}
        >
          <Text style={styles.devButtonText}>Skip (Dev) →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingScreen: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingScreenText: { color: '#fff', fontSize: 15 },
  header: { padding: 20, paddingTop: 60 },
  backButton: { padding: 8 },
  backButtonText: { color: '#fff', fontSize: 16 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingHorizontal: 20 },
  progressStepContainer: { flexDirection: 'row', alignItems: 'center' },
  progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  progressCircleActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4', shadowColor: '#6b50c4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  progressCircleCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
  progressText: { fontSize: 14, fontWeight: '600', color: '#666' },
  progressTextActive: { color: '#fff' },
  progressLine: { width: 24, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
  questionSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
  questionTitle: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
  questionSubtitle: { fontSize: 16, color: '#999', lineHeight: 24, textAlign: 'center' },
  contentSection: { marginBottom: 32 },
  formContainer: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
  formInput: { padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
  otpInput: { textAlign: 'center', fontSize: 28, letterSpacing: 10, fontWeight: '700' },
  inputError: { color: '#ef4444', fontSize: 12, marginTop: 6 },
  inputSuccess: { color: '#10b981', fontSize: 12, marginTop: 6 },
  otpSentMessage: { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 12, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  successIcon: { fontSize: 18, color: '#10b981', fontWeight: 'bold' },
  otpSentText: { color: '#10b981', fontWeight: '500', fontSize: 14 },
  emailBold: { fontWeight: '700' },
  resendSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  resendBtn: { padding: 4 },
  resendText: { color: '#6b50c4', fontSize: 14, fontWeight: '600' },
  resendDivider: { color: '#555', fontSize: 14, marginHorizontal: 4 },
  infoCard: { backgroundColor: 'rgba(107,80,196,0.08)', borderWidth: 1.5, borderColor: 'rgba(107,80,196,0.25)', borderRadius: 12, padding: 16 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 18 },
  infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  infoText: { fontSize: 13, color: '#ccc', lineHeight: 20 },
  verifiedCard: { backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  verifiedIcon: { fontSize: 40, marginBottom: 4 },
  verifiedTitle: { fontSize: 18, fontWeight: '700', color: '#10b981' },
  verifiedEmail: { fontSize: 15, fontWeight: '600', color: '#fff' },
  verifiedSubtext: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },
  changeEmailBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 16 },
  changeEmailBtnText: { color: '#6b50c4', fontSize: 14, fontWeight: '600' },
  buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
  continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  continueButtonDisabled: { backgroundColor: '#333', opacity: 0.5 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devButton: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', opacity: 0.7 },
  devButtonText: { color: '#fff', fontSize: 14 },
});

export default Screen4EmailOTP;