// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { db } from '../../../../src/config/firebase';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';const Screen5Bank = () => {
//   const router = useRouter();

//   // Penny-drop bank verification. OFF until a RazorpayX account + keys are set up.
//   // Flip to true (and configure RAZORPAY_* in nse-service/.env) to re-enable.
//   const ENABLE_PENNY_DROP = false;

//   const [accountNumber, setAccountNumber] = useState('');
//   const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
//   const [ifscCode, setIfscCode] = useState('');
//   const [accountType, setAccountType] = useState('SB'); // default savings
//   const [isLoading, setIsLoading] = useState(false);
//   const [verifyStep, setVerifyStep] = useState(''); // progress label during penny drop
//   const [isLoadingData, setIsLoadingData] = useState(true);

//   // Account type options — NSE codes
//   const accountTypes = [
//     { label: 'Savings Account', value: 'SB' },
//     { label: 'Current Account', value: 'CB' },
//     { label: 'NRE Account', value: 'NE' },
//     { label: 'NRO Account', value: 'NO' },
//   ];

//   // ── Resume: load saved bank data if exists
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

//       if (docSnap.exists() && docSnap.data()?.bank_data) {
//         const saved = docSnap.data().bank_data;
//         console.log('📂 Existing bank data found, restoring...');
//         setAccountNumber(saved.account_no || '');
//         setConfirmAccountNumber(saved.account_no || '');
//         setIfscCode(saved.ifsc_code || '');
//         setAccountType(saved.account_type || 'SB');
//       }
//     } catch (e) {
//       console.log('Screen 5 load error:', e.message);
//     } finally {
//       setIsLoadingData(false);
//     }
//   };

//   const handleAccountNumberChange = (value) => {
//     setAccountNumber(value.replace(/[^0-9]/g, '').slice(0, 18));
//   };

//   const handleConfirmAccountChange = (value) => {
//     setConfirmAccountNumber(value.replace(/[^0-9]/g, '').slice(0, 18));
//   };

//   const handleIfscChange = (value) => {
//     setIfscCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11));
//   };

//   const isFormValid =
//     accountNumber.length >= 9 &&
//     confirmAccountNumber === accountNumber &&
//     ifscCode.length === 11 &&
//     accountType;

//   const handleContinue = async () => {
//     if (accountNumber !== confirmAccountNumber) {
//       Alert.alert('Mismatch', 'Account numbers do not match. Please re-enter.');
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const phone = await AsyncStorage.getItem('user_phone');
//       if (!phone) {
//         Alert.alert('Error', 'Session expired. Please log in again.');
//         return;
//       }

//       const docRef = doc(db, 'mf_onboarding', phone);

//       let verified = false;
//       let registeredName = null;
//       let verificationId = null;

//       // ── Penny drop: verify the account is real & operable before saving ──
//       if (ENABLE_PENNY_DROP) {
//         // Pull the investor name (from PAN OCR) for name matching
//         let expectedName = '';
//         try {
//           const snap = await getDoc(docRef);
//           expectedName = snap.data()?.pan_data?.name || '';
//         } catch { /* name match is best-effort */ }

//         setVerifyStep('Verifying bank account…');
//         const vRes = await fetch(`${NSE_SERVICE_URL}/api/razorpay/verify-bank`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             account_number: accountNumber,
//             ifsc: ifscCode,
//             name: expectedName,
//             reference_id: phone,
//           }),
//         });
//         const vData = await vRes.json().catch(() => ({}));

//         if (!vRes.ok || !vData.success || vData.account_status !== 'active') {
//           Alert.alert(
//             'Verification Failed',
//             vData.error || 'We could not verify this bank account. Please double-check the account number and IFSC.'
//           );
//           return;
//         }

//         // Soft warning if the account holder name doesn't match the PAN name
//         if (vData.name_match === false && vData.registered_name) {
//           const proceed = await new Promise((resolve) => {
//             Alert.alert(
//               'Name Mismatch',
//               `This account is registered to "${vData.registered_name}", which doesn't match your PAN name. Continue only if this is your own account.`,
//               [
//                 { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
//                 { text: "It's my account", onPress: () => resolve(true) },
//               ]
//             );
//           });
//           if (!proceed) return;
//         }

//         verified = true;
//         registeredName = vData.registered_name || null;
//         verificationId = vData.validation_id || null;
//       }

//       // Save bank data — Screen 6 uses this for UCC registration
//       setVerifyStep('Saving…');
//       await updateDoc(docRef, {
//         bank_data: {
//           account_no:       accountNumber,
//           ifsc_code:        ifscCode,
//           account_type:     accountType,  // "SB", "CB", "NE", "NO"
//           default_bank:     'Y',
//           verified:         verified,
//           registered_name:  registeredName,
//           verification_id:  verificationId,
//           verified_at:      verified ? new Date().toISOString() : null,
//           saved_at:         new Date().toISOString(),
//         },
//         onboarding_step: 5,
//       });

//       console.log('✅ Bank verified & saved to Firestore');
//       router.push('/(gowealthy)/mf/onboarding/screen6');

//     } catch (error) {
//       console.error('❌ Bank verify/save error:', error);
//       Alert.alert('Error', 'Something went wrong verifying your bank account. Please try again.');
//     } finally {
//       setIsLoading(false);
//       setVerifyStep('');
//     }
//   };

//   if (isLoadingData) {
//     return (
//       <View style={styles.loadingScreen}>
//         <ActivityIndicator size="large" color="#6b50c4" />
//         <Text style={styles.loadingText}>Loading...</Text>
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
//               step <= 4 && styles.progressCircleCompleted,
//               step === 5 && styles.progressCircleActive,
//             ]}>
//               <Text style={[
//                 styles.progressText,
//                 step <= 5 && styles.progressTextActive,
//               ]}>{step <= 4 ? '✓' : step}</Text>
//             </View>
//             {idx < 5 && <View style={styles.progressLine} />}
//           </View>
//         ))}
//       </View>

//       <View style={styles.questionSection}>
//         <Text style={styles.questionTitle}>Add Bank Account</Text>
//         <Text style={styles.questionSubtitle}>
//           Your bank account for investments and redemptions
//         </Text>
//       </View>

//       <View style={styles.formContainer}>

//         {/* Account Type selector */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Account Type *</Text>
//           <View style={styles.accountTypeRow}>
//             {accountTypes.map((type) => (
//               <TouchableOpacity
//                 key={type.value}
//                 onPress={() => setAccountType(type.value)}
//                 style={[
//                   styles.accountTypeBtn,
//                   accountType === type.value && styles.accountTypeBtnActive,
//                 ]}
//               >
//                 <Text style={[
//                   styles.accountTypeBtnText,
//                   accountType === type.value && styles.accountTypeBtnTextActive,
//                 ]}>{type.label}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         {/* Account Number */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Account Number *</Text>
//           <TextInput
//             value={accountNumber}
//             onChangeText={handleAccountNumberChange}
//             placeholder="Enter account number"
//             placeholderTextColor="#555"
//             style={styles.formInput}
//             keyboardType="number-pad"
//             maxLength={18}
//           />
//           {accountNumber.length > 0 && accountNumber.length < 9 && (
//             <Text style={styles.inputError}>Minimum 9 digits required</Text>
//           )}
//         </View>

//         {/* Confirm Account Number */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Confirm Account Number *</Text>
//           <TextInput
//             value={confirmAccountNumber}
//             onChangeText={handleConfirmAccountChange}
//             placeholder="Re-enter account number"
//             placeholderTextColor="#555"
//             style={[
//               styles.formInput,
//               confirmAccountNumber.length > 0 && confirmAccountNumber !== accountNumber
//                 && styles.formInputError,
//               confirmAccountNumber.length > 0 && confirmAccountNumber === accountNumber
//                 && styles.formInputSuccess,
//             ]}
//             keyboardType="number-pad"
//             maxLength={18}
//           />
//           {confirmAccountNumber.length > 0 && confirmAccountNumber !== accountNumber && (
//             <Text style={styles.inputError}>Account numbers do not match</Text>
//           )}
//           {confirmAccountNumber.length > 0 && confirmAccountNumber === accountNumber && (
//             <Text style={styles.inputSuccess}>✓ Account numbers match</Text>
//           )}
//         </View>

//         {/* IFSC Code */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>IFSC Code *</Text>
//           <TextInput
//             value={ifscCode}
//             onChangeText={handleIfscChange}
//             placeholder="SBIN0000019"
//             placeholderTextColor="#555"
//             style={styles.formInput}
//             maxLength={11}
//             autoCapitalize="characters"
//             autoCorrect={false}
//           />
//           {ifscCode.length > 0 && ifscCode.length !== 11 && (
//             <Text style={styles.inputError}>IFSC must be exactly 11 characters</Text>
//           )}
//           {ifscCode.length === 11 && (
//             <Text style={styles.inputSuccess}>✓ Valid IFSC format</Text>
//           )}
//         </View>

//         {/* UAT test hint */}
//         <View style={styles.testCard}>
//           <Text style={styles.testCardTitle}>🧪 UAT Test Values</Text>
//           <Text style={styles.testCardText}>Account No: 311242065229</Text>
//           <Text style={styles.testCardText}>IFSC: KKBK0000872</Text>
//           <Text style={styles.testCardText}>Type: Savings (SB)</Text>
//         </View>

//         <View style={styles.infoCard}>
//           <View style={styles.infoCardHeader}>
//             <Text style={styles.infoIcon}>🏦</Text>
//             <Text style={styles.infoCardHeaderText}>Bank Account Info</Text>
//           </View>
//           <Text style={styles.infoText}>
//             This account will be linked to your mutual fund investments for purchases and redemptions. Make sure the account belongs to you.
//           </Text>
//         </View>

//       </View>

//       <View style={styles.buttonSection}>
//         <TouchableOpacity
//           onPress={handleContinue}
//           disabled={!isFormValid || isLoading}
//           style={[styles.continueButton, (!isFormValid || isLoading) && styles.buttonDisabled]}
//         >
//           {isLoading ? (
//             <View style={styles.buttonRow}>
//               <ActivityIndicator size="small" color="#fff" />
//               <Text style={styles.continueButtonText}>{verifyStep || 'Saving...'}</Text>
//             </View>
//           ) : (
//             <Text style={styles.continueButtonText}>→ Continue to Final Step</Text>
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => router.push('/(gowealthy)/mf/onboarding/screen6')}
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
//   loadingText: { color: '#fff', fontSize: 15 },
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
//   formContainer: { paddingHorizontal: 20, marginBottom: 16 },
//   inputGroup: { marginBottom: 24 },
//   inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 10 },
//   formInput: { padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
//   formInputError: { borderColor: 'rgba(239,68,68,0.6)' },
//   formInputSuccess: { borderColor: 'rgba(16,185,129,0.6)' },
//   inputError: { color: '#ef4444', fontSize: 12, marginTop: 6 },
//   inputSuccess: { color: '#10b981', fontSize: 12, marginTop: 6 },
//   accountTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
//   accountTypeBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
//   accountTypeBtnActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4' },
//   accountTypeBtnText: { color: '#888', fontSize: 13, fontWeight: '500' },
//   accountTypeBtnTextActive: { color: '#fff' },
//   testCard: { backgroundColor: 'rgba(255,165,0,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,165,0,0.25)', borderRadius: 12, padding: 14, marginBottom: 16 },
//   testCardTitle: { color: '#FFA500', fontSize: 13, fontWeight: '700', marginBottom: 6 },
//   testCardText: { color: '#ccc', fontSize: 13, lineHeight: 20 },
//   infoCard: { backgroundColor: 'rgba(107,80,196,0.08)', borderWidth: 1.5, borderColor: 'rgba(107,80,196,0.25)', borderRadius: 12, padding: 16 },
//   infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
//   infoIcon: { fontSize: 18 },
//   infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
//   infoText: { fontSize: 13, color: '#ccc', lineHeight: 20 },
//   buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
//   continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
//   buttonDisabled: { backgroundColor: '#333', opacity: 0.5 },
//   continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   devButton: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', opacity: 0.7 },
//   devButtonText: { color: '#fff', fontSize: 14 },
// });

// export default Screen5Bank;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
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

const Screen5Bank = () => {
  const router = useRouter();

  // Penny-drop bank verification. OFF until a RazorpayX account + keys are set up.
  // Flip to true (and configure RAZORPAY_* in nse-service/.env) to re-enable.
  const ENABLE_PENNY_DROP = false;

  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('SB'); // default savings
  const [isLoading, setIsLoading] = useState(false);
  const [verifyStep, setVerifyStep] = useState(''); // progress label during penny drop
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Account type options — NSE codes
  const accountTypes = [
    { label: 'Savings Account', value: 'SB' },
    { label: 'Current Account', value: 'CB' },
    { label: 'NRE Account', value: 'NE' },
    { label: 'NRO Account', value: 'NO' },
  ];

  // ── Resume: load saved bank data if exists
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

      if (docSnap.exists() && docSnap.data()?.bank_data) {
        const saved = docSnap.data().bank_data;
        console.log('📂 Existing bank data found, restoring...');
        setAccountNumber(saved.account_no || '');
        setConfirmAccountNumber(saved.account_no || '');
        setIfscCode(saved.ifsc_code || '');
        setAccountType(saved.account_type || 'SB');
      }
    } catch (e) {
      console.log('Screen 5 load error:', e.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAccountNumberChange = (value) => {
    setAccountNumber(value.replace(/[^0-9]/g, '').slice(0, 18));
  };

  const handleConfirmAccountChange = (value) => {
    setConfirmAccountNumber(value.replace(/[^0-9]/g, '').slice(0, 18));
  };

  const handleIfscChange = (value) => {
    setIfscCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11));
  };

  const isFormValid =
    accountNumber.length >= 9 &&
    confirmAccountNumber === accountNumber &&
    ifscCode.length === 11 &&
    accountType;

  const handleContinue = async () => {
    if (accountNumber !== confirmAccountNumber) {
      Alert.alert('Mismatch', 'Account numbers do not match. Please re-enter.');
      return;
    }

    try {
      setIsLoading(true);
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      const docRef = doc(db, 'mf_onboarding', phone);

      let verified = false;
      let registeredName = null;
      let verificationId = null;

      // ── Penny drop: verify the account is real & operable before saving ──
      if (ENABLE_PENNY_DROP) {
        // Pull the investor name (from PAN OCR) for name matching
        let expectedName = '';
        try {
          const snap = await getDoc(docRef);
          expectedName = snap.data()?.pan_data?.name || '';
        } catch { /* name match is best-effort */ }

        setVerifyStep('Verifying bank account…');
        const vRes = await fetch(`${NSE_SERVICE_URL}/api/razorpay/verify-bank`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_number: accountNumber,
            ifsc: ifscCode,
            name: expectedName,
            reference_id: phone,
          }),
        });
        const vData = await vRes.json().catch(() => ({}));

        if (!vRes.ok || !vData.success || vData.account_status !== 'active') {
          Alert.alert(
            'Verification Failed',
            vData.error || 'We could not verify this bank account. Please double-check the account number and IFSC.'
          );
          return;
        }

        // Soft warning if the account holder name doesn't match the PAN name
        if (vData.name_match === false && vData.registered_name) {
          const proceed = await new Promise((resolve) => {
            Alert.alert(
              'Name Mismatch',
              `This account is registered to "${vData.registered_name}", which doesn't match your PAN name. Continue only if this is your own account.`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: "It's my account", onPress: () => resolve(true) },
              ]
            );
          });
          if (!proceed) return;
        }

        verified = true;
        registeredName = vData.registered_name || null;
        verificationId = vData.validation_id || null;
      }

      // Save bank data — Screen 6 uses this for UCC registration
      setVerifyStep('Saving…');
      await updateDoc(docRef, {
        bank_data: {
          account_no:       accountNumber,
          ifsc_code:        ifscCode,
          account_type:     accountType,  // "SB", "CB", "NE", "NO"
          default_bank:     'Y',
          verified:         verified,
          registered_name:  registeredName,
          verification_id:  verificationId,
          verified_at:      verified ? new Date().toISOString() : null,
          saved_at:         new Date().toISOString(),
        },
        onboarding_step: 5,
      });

      console.log('✅ Bank verified & saved to Firestore');
      router.push('/(gowealthy)/mf/onboarding/screen6');

    } catch (error) {
      console.error('❌ Bank verify/save error:', error);
      Alert.alert('Error', 'Something went wrong verifying your bank account. Please try again.');
    } finally {
      setIsLoading(false);
      setVerifyStep('');
    }
  };

  const STEP = 5;
  const TOTAL_STEPS = 6;

  if (isLoadingData) {
    return (
      <View style={styles.loadingScreen}>
        <EmberField />
        <ActivityIndicator size="large" color={C.o} />
        <Text style={styles.loadingText}>Loading...</Text>
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
            <Text style={styles.eyebrow}>BANK LINKAGE</Text>
            <View style={styles.eyebrowLine} />
          </View>
          <Text style={styles.questionTitle}>
            Add your <Text style={styles.gradWord}>Bank Account</Text>
          </Text>
          <Text style={styles.questionSubtitle}>
            Your bank account for investments and redemptions
          </Text>
        </View>

        <View style={styles.formContainer}>

          {/* Account Type selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Type *</Text>
            <View style={styles.accountTypeRow}>
              {accountTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setAccountType(type.value)}
                  style={[
                    styles.accountTypeBtn,
                    accountType === type.value && styles.accountTypeBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.accountTypeBtnText,
                    accountType === type.value && styles.accountTypeBtnTextActive,
                  ]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput
              value={accountNumber}
              onChangeText={handleAccountNumberChange}
              placeholder="Enter account number"
              placeholderTextColor={C.muted}
              style={styles.formInput}
              keyboardType="number-pad"
              maxLength={18}
            />
            {accountNumber.length > 0 && accountNumber.length < 9 && (
              <Text style={styles.inputError}>Minimum 9 digits required</Text>
            )}
          </View>

          {/* Confirm Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Account Number *</Text>
            <TextInput
              value={confirmAccountNumber}
              onChangeText={handleConfirmAccountChange}
              placeholder="Re-enter account number"
              placeholderTextColor={C.muted}
              style={[
                styles.formInput,
                confirmAccountNumber.length > 0 && confirmAccountNumber !== accountNumber
                  && styles.formInputError,
                confirmAccountNumber.length > 0 && confirmAccountNumber === accountNumber
                  && styles.formInputSuccess,
              ]}
              keyboardType="number-pad"
              maxLength={18}
            />
            {confirmAccountNumber.length > 0 && confirmAccountNumber !== accountNumber && (
              <Text style={styles.inputError}>Account numbers do not match</Text>
            )}
            {confirmAccountNumber.length > 0 && confirmAccountNumber === accountNumber && (
              <Text style={styles.inputSuccess}>✓ Account numbers match</Text>
            )}
          </View>

          {/* IFSC Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IFSC Code *</Text>
            <TextInput
              value={ifscCode}
              onChangeText={handleIfscChange}
              placeholder="SBIN0000019"
              placeholderTextColor={C.muted}
              style={styles.formInput}
              maxLength={11}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {ifscCode.length > 0 && ifscCode.length !== 11 && (
              <Text style={styles.inputError}>IFSC must be exactly 11 characters</Text>
            )}
            {ifscCode.length === 11 && (
              <Text style={styles.inputSuccess}>✓ Valid IFSC format</Text>
            )}
          </View>

          {/* UAT test hint */}
          <View style={styles.testCard}>
            <Text style={styles.testCardTitle}>🧪 UAT Test Values</Text>
            <Text style={styles.testCardText}>Account No: 311242065229</Text>
            <Text style={styles.testCardText}>IFSC: KKBK0000872</Text>
            <Text style={styles.testCardText}>Type: Savings (SB)</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoIcon}>🏦</Text>
              <Text style={styles.infoCardHeaderText}>Bank Account Info</Text>
            </View>
            <Text style={styles.infoText}>
              This account will be linked to your mutual fund investments for purchases and redemptions. Make sure the account belongs to you.
            </Text>
          </View>

        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.9}
            style={styles.continueButtonWrap}
          >
            <LinearGradient
              colors={(!isFormValid || isLoading) ? [C.faint, C.faint] : [C.o2, C.o]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.continueButton, (!isFormValid || isLoading) && styles.buttonDisabled]}
            >
              {isLoading ? (
                <View style={styles.buttonRow}>
                  <ActivityIndicator size="small" color={C.muted} />
                  <Text style={[styles.continueButtonText, styles.continueButtonTextDisabled]}>{verifyStep || 'Saving...'}</Text>
                </View>
              ) : (
                <Text style={styles.continueButtonText}>→ Continue to Final Step</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(gowealthy)/mf/onboarding/screen6')}
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
  loadingText: { color: C.ink, fontSize: 14, fontWeight: '500' },

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
  formContainer: { paddingHorizontal: 20, marginBottom: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  inputGroup: { marginBottom: 22 },
  inputLabel: { fontSize: 12.5, fontWeight: '600', color: C.muted, marginBottom: 10, letterSpacing: 0.3 },
  formInput: {
    padding: 14, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line2,
    borderRadius: 13, color: C.ink, fontSize: 14.5,
  },
  formInputError: { borderColor: 'rgba(255,107,107,0.6)' },
  formInputSuccess: { borderColor: 'rgba(79,211,154,0.6)' },
  inputError: { color: C.bad, fontSize: 12, marginTop: 6 },
  inputSuccess: { color: C.good, fontSize: 12, marginTop: 6 },

  accountTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  accountTypeBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 30,
    borderWidth: 1.5, borderColor: C.line2, backgroundColor: C.surface,
  },
  accountTypeBtnActive: { backgroundColor: 'rgba(255,106,26,0.14)', borderColor: C.o },
  accountTypeBtnText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  accountTypeBtnTextActive: { color: C.o2 },

  testCard: {
    backgroundColor: 'rgba(247,200,90,0.08)', borderWidth: 1.5, borderColor: 'rgba(247,200,90,0.28)',
    borderRadius: 16, padding: 14, marginBottom: 18,
  },
  testCardTitle: { color: C.gold, fontSize: 12.5, fontWeight: '700', marginBottom: 6 },
  testCardText: { color: C.muted, fontSize: 12.5, lineHeight: 19 },

  infoCard: {
    backgroundColor: 'rgba(255,106,26,0.07)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.22)',
    borderRadius: 16, padding: 16,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 16 },
  infoCardHeaderText: { fontSize: 13.5, fontWeight: '700', color: C.ink },
  infoText: { fontSize: 13, color: C.muted, lineHeight: 20 },

  buttonSection: { padding: 20, gap: 12, marginBottom: 20 },
  continueButtonWrap: { borderRadius: 15, shadowColor: C.o, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  continueButton: {
    paddingVertical: 16, borderRadius: 15, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  buttonDisabled: { shadowOpacity: 0 },
  continueButtonText: { color: '#1a0d04', fontSize: 15.5, fontWeight: '700' },
  continueButtonTextDisabled: { color: C.muted },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devButton: {
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1, borderColor: 'rgba(79,211,154,0.3)',
    paddingVertical: 10, borderRadius: 30, alignItems: 'center',
  },
  devButtonText: { color: C.good, fontSize: 13, fontWeight: '600' },
});

export default Screen5Bank;