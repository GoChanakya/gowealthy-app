// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   ActivityIndicator,
//   TextInput,
//   Alert,
//   Linking,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { db } from '../../../../src/config/firebase';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';const AMC_CODE = 'B'; // ← replace with real AMC code when sir provides

// const Screen3FreshKYC = () => {
//   const router = useRouter();

//   const [email, setEmail] = useState('');
//   const [panNumber, setPanNumber] = useState('');
//   const [mobileNumber, setMobileNumber] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [ekycLink, setEkycLink] = useState(null); // NSE link returned after API call
//   const [isLoadingData, setIsLoadingData] = useState(true);

//   // ── On mount: load PAN from Firestore + mobile from AsyncStorage
//   useEffect(() => {
//     loadExistingData();
//   }, []);

//   const loadExistingData = async () => {
//     try {
//       setIsLoadingData(true);
//       const phone = await AsyncStorage.getItem('user_phone');
//       if (!phone) return;

//       // Mobile — strip country code if present (NSE needs 10 digits)
//       const mobile10 = String(phone).replace(/\D/g, '').slice(-10);
//       setMobileNumber(mobile10);

//       // PAN from Firestore
//       const docRef = doc(db, 'mf_onboarding', phone);
//       const docSnap = await getDoc(docRef);
//       if (docSnap.exists()) {
//         const pan = docSnap.data()?.pan_data?.pan_number || '';
//         setPanNumber(pan);

//         // If email was already saved (user came back), restore it
//         const savedEmail = docSnap.data()?.email_data?.email || '';
//         if (savedEmail) setEmail(savedEmail);

//         // If ekyc link was already generated, restore it too
//         const savedLink = docSnap.data()?.ekyc_link || '';
//         if (savedLink) setEkycLink(savedLink);
//       }
//     } catch (e) {
//       console.log('Error loading data for Screen 3:', e.message);
//     } finally {
//       setIsLoadingData(false);
//     }
//   };

//   const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

//   const handleSendKYCLink = async () => {
//     if (!isValidEmail(email)) {
//       Alert.alert('Invalid Email', 'Please enter a valid email address.');
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const phone = await AsyncStorage.getItem('user_phone');

//       console.log('📝 Calling EKYC Register...');
//       console.log('  PAN:', panNumber, 'Mobile:', mobileNumber, 'Email:', email);
//       console.log( 'AMC Code:', AMC_CODE);
//       const response = await fetch(`${NSE_SERVICE_URL}/api/nse/ekyc-register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           amcCode: AMC_CODE,
//           panNo: panNumber,
//           mobileNo: mobileNumber,
//           invEmail: email,
//         }),
//       });

//       const data = await response.json();
//       console.log('📋 EKYC Register Response:', data);

//       if (!response.ok || data.error) {
//         throw new Error(data.error || 'EKYC registration failed');
//       }

//       const link = data.link || '';
//       if (!link) throw new Error('No KYC link returned from NSE');

//       // Save email + ekyc link to Firestore
//       const docRef = doc(db, 'mf_onboarding', phone);
//       await updateDoc(docRef, {
//         'email_data.email': email,
//         'email_data.source': 'screen3',
//         ekyc_link: link,
//         ekyc_registered: true,
//         ekyc_registered_at: new Date().toISOString(),
//         onboarding_step: 3,
//       });

//       setEkycLink(link);
//       console.log('✅ EKYC link saved:', link);

//     } catch (error) {
//       console.error('❌ EKYC Register error:', error);
//       Alert.alert('Error', error.message || 'Failed to send KYC link. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleOpenLink = async () => {
//     if (!ekycLink) return;
//     try {
//       const supported = await Linking.canOpenURL(ekycLink);
//       if (supported) {
//         await Linking.openURL(ekycLink);
//       } else {
//         Alert.alert('Error', 'Cannot open this link on your device.');
//       }
//     } catch (e) {
//       Alert.alert('Error', 'Failed to open link.');
//     }
//   };

//   const handleContinue = async () => {
//     // Save onboarding step and go to Screen 4
//     try {
//       const phone = await AsyncStorage.getItem('user_phone');
//       const docRef = doc(db, 'mf_onboarding', phone);
//       await updateDoc(docRef, { onboarding_step: 3 });
//     } catch (e) {
//       console.log('Step update error:', e.message);
//     }
//     router.push('/(gowealthy)/mf/onboarding/screen4');
//   };

//   if (isLoadingData) {
//     return (
//       <View style={styles.loadingScreen}>
//         <ActivityIndicator size="large" color="#6b50c4" />
//         <Text style={styles.loadingScreenText}>Loading your details...</Text>
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
//               step <= 2 && styles.progressCircleCompleted,
//               step === 3 && styles.progressCircleActive,
//             ]}>
//               <Text style={[
//                 styles.progressText,
//                 step <= 3 && styles.progressTextActive,
//               ]}>{step <= 2 ? '✓' : step}</Text>
//             </View>
//             {idx < 5 && <View style={styles.progressLine} />}
//           </View>
//         ))}
//       </View>

//       <View style={styles.questionSection}>
//         <Text style={styles.questionTitle}>Complete your KYC</Text>
//         <Text style={styles.questionSubtitle}>
//           Your KYC is not registered. We'll send a verification link to your email to complete it on NSE's platform.
//         </Text>
//       </View>

//       <View style={styles.contentSection}>
//         <View style={styles.formContainer}>

//           {/* Pre-filled info card */}
//           <View style={styles.prefilledCard}>
//             <Text style={styles.prefilledTitle}>Details from your documents</Text>
//             <View style={styles.prefilledRow}>
//               <Text style={styles.prefilledLabel}>PAN</Text>
//               <Text style={styles.prefilledValue}>{panNumber || '—'}</Text>
//             </View>
//             <View style={styles.prefilledRow}>
//               <Text style={styles.prefilledLabel}>Mobile</Text>
//               <Text style={styles.prefilledValue}>{mobileNumber || '—'}</Text>
//             </View>
//           </View>

//           {/* Email input */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.inputLabel}>Email Address *</Text>
//             <TextInput
//               value={email}
//               onChangeText={setEmail}
//               placeholder="your@email.com"
//               placeholderTextColor="#666"
//               style={[
//                 styles.formInput,
//                 ekycLink && styles.formInputDisabled, // lock after link sent
//               ]}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoCorrect={false}
//               editable={!ekycLink} // can't change after link is sent
//             />
//             {email && !isValidEmail(email) && (
//               <Text style={styles.inputError}>Please enter a valid email address</Text>
//             )}
//           </View>

//           {/* Step 1 — Send link button (shown before link is generated) */}
//           {!ekycLink && (
//             <TouchableOpacity
//               onPress={handleSendKYCLink}
//               disabled={isLoading || !isValidEmail(email)}
//               style={[
//                 styles.sendButton,
//                 (isLoading || !isValidEmail(email)) && styles.buttonDisabled,
//               ]}
//             >
//               {isLoading ? (
//                 <View style={styles.buttonRow}>
//                   <ActivityIndicator size="small" color="#fff" />
//                   <Text style={styles.sendButtonText}>Sending KYC Link...</Text>
//                 </View>
//               ) : (
//                 <Text style={styles.sendButtonText}>📨 Send KYC Verification Link</Text>
//               )}
//             </TouchableOpacity>
//           )}

//           {/* Step 2 — Link generated state */}
//           {ekycLink && (
//             <View style={styles.linkCard}>
//               <View style={styles.linkCardHeader}>
//                 <Text style={styles.linkCardIcon}>✅</Text>
//                 <Text style={styles.linkCardTitle}>KYC Link Ready</Text>
//               </View>
//               <Text style={styles.linkCardSubtext}>
//                 A verification link has been sent to{' '}
//                 <Text style={styles.linkCardEmail}>{email}</Text>.
//                 {'\n\n'}
//                 Tap below to open NSE's verification page. Complete the process and come back here.
//               </Text>

//               <TouchableOpacity onPress={handleOpenLink} style={styles.openLinkButton}>
//                 <Text style={styles.openLinkButtonText}>🔗 Open KYC Verification →</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={handleSendKYCLink}
//                 disabled={isLoading}
//                 style={styles.resendButton}
//               >
//                 <Text style={styles.resendButtonText}>
//                   {isLoading ? 'Resending...' : '↺ Resend Link'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           <View style={styles.infoCard}>
//             <View style={styles.infoCardHeader}>
//               <Text style={styles.infoIcon}>ℹ️</Text>
//               <Text style={styles.infoCardHeaderText}>What happens next?</Text>
//             </View>
//             <Text style={styles.infoText}>
//               1. Open the KYC verification link{'\n'}
//               2. Complete verification on NSE's platform{'\n'}
//               3. Come back and tap Continue below{'\n'}
//               4. Your KYC will be active within 24 hours
//             </Text>
//           </View>

//         </View>
//       </View>

//       <View style={styles.buttonSection}>
//         {/* Continue — enabled only after link is generated */}
//         <TouchableOpacity
//           onPress={handleContinue}
//           disabled={!ekycLink}
//           style={[styles.continueButton, !ekycLink && styles.buttonDisabled]}
//         >
//           <Text style={styles.continueButtonText}>
//             {ekycLink ? "✓ I've completed KYC → Continue" : 'Send KYC link first'}
//           </Text>
//         </TouchableOpacity>

//         {/* Dev skip */}
//         <TouchableOpacity
//           onPress={() => router.push('/(gowealthy)/mf/onboarding/screen4')}
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
//   prefilledCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 24 },
//   prefilledTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
//   prefilledRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
//   prefilledLabel: { fontSize: 14, color: '#888' },
//   prefilledValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
//   inputGroup: { marginBottom: 24 },
//   inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
//   formInput: { padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
//   formInputDisabled: { opacity: 0.6 },
//   inputError: { color: '#ef4444', fontSize: 12, marginTop: 4 },
//   sendButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
//   buttonDisabled: { backgroundColor: '#333', opacity: 0.5 },
//   buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   linkCard: { backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 16, padding: 20, marginBottom: 24 },
//   linkCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
//   linkCardIcon: { fontSize: 20 },
//   linkCardTitle: { fontSize: 16, fontWeight: '600', color: '#10b981' },
//   linkCardSubtext: { fontSize: 14, color: '#ccc', lineHeight: 22, marginBottom: 16 },
//   linkCardEmail: { color: '#fff', fontWeight: '600' },
//   openLinkButton: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
//   openLinkButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
//   resendButton: { paddingVertical: 10, alignItems: 'center' },
//   resendButtonText: { color: '#6b50c4', fontSize: 14, fontWeight: '500' },
//   infoCard: { backgroundColor: 'rgba(107,80,196,0.08)', borderWidth: 1.5, borderColor: 'rgba(107,80,196,0.25)', borderRadius: 12, padding: 16 },
//   infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
//   infoIcon: { fontSize: 18 },
//   infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
//   infoText: { fontSize: 14, color: '#ccc', lineHeight: 22 },
//   buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
//   continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
//   continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   devButton: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', opacity: 0.7 },
//   devButtonText: { color: '#fff', fontSize: 14 },
// });

// export default Screen3FreshKYC;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';const AMC_CODE = 'INDIABULLSMUTUALFUND_MF'; // ← replace with real AMC code when sir provides

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

const Screen3FreshKYC = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ekycLink, setEkycLink] = useState(null); // NSE link returned after API call
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ── On mount: load PAN from Firestore + mobile from AsyncStorage
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setIsLoadingData(true);
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) return;

      // Mobile — strip country code if present (NSE needs 10 digits)
      const mobile10 = String(phone).replace(/\D/g, '').slice(-10);
      setMobileNumber(mobile10);

      // PAN from Firestore
      const docRef = doc(db, 'mf_onboarding', phone);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const pan = docSnap.data()?.pan_data?.pan_number || '';
        setPanNumber(pan);

        // If email was already saved (user came back), restore it
        const savedEmail = docSnap.data()?.email_data?.email || '';
        if (savedEmail) setEmail(savedEmail);

        // If ekyc link was already generated, restore it too
        const savedLink = docSnap.data()?.ekyc_link || '';
        if (savedLink) setEkycLink(savedLink);
      }
    } catch (e) {
      console.log('Error loading data for Screen 3:', e.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSendKYCLink = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      const phone = await AsyncStorage.getItem('user_phone');

      console.log('📝 Calling EKYC Register...');
      console.log('  PAN:', panNumber, 'Mobile:', mobileNumber, 'Email:', email);
      console.log( 'AMC Code:', AMC_CODE);
      const response = await fetch(`${NSE_SERVICE_URL}/api/nse/ekyc-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amcCode: AMC_CODE,
          panNo: panNumber,
          mobileNo: mobileNumber,
          invEmail: email,
        }),
      });

      const data = await response.json();
      console.log('📋 EKYC Register Response:', data);

      if (!response.ok || data.error) {
        throw new Error(data.error || 'EKYC registration failed');
      }

      const link = data.link || '';
      if (!link) throw new Error('No KYC link returned from NSE');

      // Save email + ekyc link to Firestore
      const docRef = doc(db, 'mf_onboarding', phone);
      await updateDoc(docRef, {
        'email_data.email': email,
        'email_data.source': 'screen3',
        ekyc_link: link,
        ekyc_registered: true,
        ekyc_registered_at: new Date().toISOString(),
        onboarding_step: 3,
      });

      setEkycLink(link);
      console.log('✅ EKYC link saved:', link);

    } catch (error) {
      console.error('❌ EKYC Register error:', error);
      Alert.alert('Error', error.message || 'Failed to send KYC link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLink = async () => {
    if (!ekycLink) return;
    try {
      const supported = await Linking.canOpenURL(ekycLink);
      if (supported) {
        await Linking.openURL(ekycLink);
      } else {
        Alert.alert('Error', 'Cannot open this link on your device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  const handleContinue = async () => {
    // Save onboarding step and go to Screen 4
    try {
      const phone = await AsyncStorage.getItem('user_phone');
      const docRef = doc(db, 'mf_onboarding', phone);
      await updateDoc(docRef, { onboarding_step: 3 });
    } catch (e) {
      console.log('Step update error:', e.message);
    }
    router.push('/(gowealthy)/mf/onboarding/screen4');
  };

  const STEP = 3;
  const TOTAL_STEPS = 6;

  if (isLoadingData) {
    return (
      <View style={styles.loadingScreen}>
        <EmberField />
        <ActivityIndicator size="large" color={C.o} />
        <Text style={styles.loadingScreenText}>Loading your details...</Text>
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
            <Text style={styles.eyebrow}>KYC VERIFICATION</Text>
            <View style={styles.eyebrowLine} />
          </View>
          <Text style={styles.questionTitle}>
            Complete your <Text style={styles.gradWord}>KYC</Text>
          </Text>
          <Text style={styles.questionSubtitle}>
            Your KYC is not registered. We'll send a verification link to your email to complete it on NSE's platform.
          </Text>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.formContainer}>

            {/* Pre-filled info card */}
            <View style={styles.prefilledCard}>
              <Text style={styles.prefilledTitle}>Details from your documents</Text>
              <View style={styles.prefilledRow}>
                <Text style={styles.prefilledLabel}>PAN</Text>
                <Text style={styles.prefilledValue}>{panNumber || '—'}</Text>
              </View>
              <View style={styles.prefilledRow}>
                <Text style={styles.prefilledLabel}>Mobile</Text>
                <Text style={styles.prefilledValue}>{mobileNumber || '—'}</Text>
              </View>
            </View>

            {/* Email input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={C.muted}
                style={[
                  styles.formInput,
                  ekycLink && styles.formInputDisabled, // lock after link sent
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!ekycLink} // can't change after link is sent
              />
              {email && !isValidEmail(email) && (
                <Text style={styles.inputError}>Please enter a valid email address</Text>
              )}
            </View>

            {/* Step 1 — Send link button (shown before link is generated) */}
            {!ekycLink && (
              <TouchableOpacity
                onPress={handleSendKYCLink}
                disabled={isLoading || !isValidEmail(email)}
                activeOpacity={0.9}
                style={styles.sendButtonWrap}
              >
                <LinearGradient
                  colors={(isLoading || !isValidEmail(email)) ? [C.faint, C.faint] : [C.o2, C.o]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.sendButton, (isLoading || !isValidEmail(email)) && styles.buttonDisabled]}
                >
                  {isLoading ? (
                    <View style={styles.buttonRow}>
                      <ActivityIndicator size="small" color={C.muted} />
                      <Text style={[styles.sendButtonText, styles.sendButtonTextDisabled]}>Sending KYC Link...</Text>
                    </View>
                  ) : (
                    <Text style={styles.sendButtonText}>📨 Send KYC Verification Link</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Step 2 — Link generated state */}
            {ekycLink && (
              <View style={styles.linkCard}>
                <View style={styles.linkCardHeader}>
                  <Text style={styles.linkCardIcon}>✅</Text>
                  <Text style={styles.linkCardTitle}>KYC Link Ready</Text>
                </View>
                <Text style={styles.linkCardSubtext}>
                  A verification link has been sent to{' '}
                  <Text style={styles.linkCardEmail}>{email}</Text>.
                  {'\n\n'}
                  Tap below to open NSE's verification page. Complete the process and come back here.
                </Text>

                <TouchableOpacity onPress={handleOpenLink} activeOpacity={0.9} style={styles.openLinkButtonWrap}>
                  <LinearGradient
                    colors={[C.o2, C.o]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.openLinkButton}
                  >
                    <Text style={styles.openLinkButtonText}>🔗 Open KYC Verification →</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendKYCLink}
                  disabled={isLoading}
                  style={styles.resendButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resendButtonText}>
                    {isLoading ? 'Resending...' : '↺ Resend Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoCardHeaderText}>What happens next?</Text>
              </View>
              <Text style={styles.infoText}>
                1. Open the KYC verification link{'\n'}
                2. Complete verification on NSE's platform{'\n'}
                3. Come back and tap Continue below{'\n'}
                4. Your KYC will be active within 24 hours
              </Text>
            </View>

          </View>
        </View>

        <View style={styles.buttonSection}>
          {/* Continue — enabled only after link is generated */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!ekycLink}
            activeOpacity={0.9}
            style={styles.continueButtonWrap}
          >
            <LinearGradient
              colors={!ekycLink ? [C.faint, C.faint] : [C.o2, C.o]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.continueButton, !ekycLink && styles.buttonDisabled]}
            >
              <Text style={[styles.continueButtonText, !ekycLink && styles.continueButtonTextDisabled]}>
                {ekycLink ? "✓ I've completed KYC → Continue" : 'Send KYC link first'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Dev skip */}
          <TouchableOpacity
            onPress={() => router.push('/(gowealthy)/mf/onboarding/screen4')}
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

  prefilledCard: {
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.line, borderRadius: 18,
    padding: 18, marginBottom: 22,
  },
  prefilledTitle: { fontSize: 11.5, fontWeight: '700', color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  prefilledRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  prefilledLabel: { fontSize: 13.5, color: C.muted },
  prefilledValue: { fontSize: 13.5, fontWeight: '700', color: C.ink },

  inputGroup: { marginBottom: 22 },
  inputLabel: { fontSize: 12.5, fontWeight: '600', color: C.muted, marginBottom: 8, letterSpacing: 0.3 },
  formInput: {
    padding: 14, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line2,
    borderRadius: 13, color: C.ink, fontSize: 14.5,
  },
  formInputDisabled: { opacity: 0.6 },
  inputError: { color: C.bad, fontSize: 12, marginTop: 6 },

  sendButtonWrap: { borderRadius: 15, marginBottom: 22, shadowColor: C.o, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  sendButton: { paddingVertical: 16, borderRadius: 15, alignItems: 'center' },
  buttonDisabled: { shadowOpacity: 0 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sendButtonText: { color: '#1a0d04', fontSize: 15.5, fontWeight: '700' },
  sendButtonTextDisabled: { color: C.muted },

  linkCard: {
    backgroundColor: 'rgba(79,211,154,0.08)', borderWidth: 1.5, borderColor: 'rgba(79,211,154,0.28)',
    borderRadius: 20, padding: 20, marginBottom: 22,
  },
  linkCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  linkCardIcon: { fontSize: 18 },
  linkCardTitle: { fontSize: 15.5, fontWeight: '700', color: C.good },
  linkCardSubtext: { fontSize: 13.5, color: C.muted, lineHeight: 20, marginBottom: 16 },
  linkCardEmail: { color: C.ink, fontWeight: '700' },
  openLinkButtonWrap: { borderRadius: 12, marginBottom: 10, shadowColor: C.good, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  openLinkButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  openLinkButtonText: { color: '#062018', fontSize: 14.5, fontWeight: '700' },
  resendButton: { paddingVertical: 10, alignItems: 'center' },
  resendButtonText: { color: C.o2, fontSize: 13.5, fontWeight: '600' },

  infoCard: {
    backgroundColor: 'rgba(255,106,26,0.07)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.22)',
    borderRadius: 16, padding: 16,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 16 },
  infoCardHeaderText: { fontSize: 13.5, fontWeight: '700', color: C.ink },
  infoText: { fontSize: 13, color: C.muted, lineHeight: 21 },

  buttonSection: { padding: 20, gap: 12, marginBottom: 20 },
  continueButtonWrap: { borderRadius: 15, shadowColor: C.o, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  continueButton: { paddingVertical: 16, borderRadius: 15, alignItems: 'center' },
  continueButtonText: { color: '#1a0d04', fontSize: 15.5, fontWeight: '700' },
  continueButtonTextDisabled: { color: C.muted },
  devButton: {
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1, borderColor: 'rgba(79,211,154,0.3)',
    paddingVertical: 10, borderRadius: 30, alignItems: 'center',
  },
  devButtonText: { color: C.good, fontSize: 13, fontWeight: '600' },
});

export default Screen3FreshKYC;