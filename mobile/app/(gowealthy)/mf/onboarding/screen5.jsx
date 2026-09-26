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
import { NSE_SERVICE_URL } from '../../../../src/config/services';
import { hapticError, hapticSmall, hapticSuccess } from '../../../../src/lib/haptics';

import { LogoSpinner } from '../../../../src/components/LogoLoader';
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

  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('SB'); // default savings
  const [isLoading, setIsLoading] = useState(false);
  const [verifyStep, setVerifyStep] = useState(''); // progress label during penny drop
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pendingValidationId, setPendingValidationId] = useState(null);
  const [verifiedBank, setVerifiedBank] = useState(null);

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
        if (saved.penny_drop_status === 'VERIFIED') {
          setVerifiedBank({
            account_no: saved.account_no,
            ifsc_code: saved.ifsc_code,
            registered_name: saved.razorpay_registered_name || '',
          });
        }
      }
    } catch (e) {
      console.log('Screen 5 load error:', e.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAccountNumberChange = (value) => {
    setAccountNumber(value.replace(/[^0-9]/g, '').slice(0, 18));
    setPendingValidationId(null);
  };

  const handleConfirmAccountChange = (value) => {
    setConfirmAccountNumber(value.replace(/[^0-9]/g, '').slice(0, 18));
  };

  const handleIfscChange = (value) => {
    setIfscCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11));
    setPendingValidationId(null);
  };

  const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode);
  const isAlreadyVerified =
    verifiedBank?.account_no === accountNumber &&
    verifiedBank?.ifsc_code === ifscCode;

  const isFormValid =
    accountNumber.length >= 9 &&
    confirmAccountNumber === accountNumber &&
    isIfscValid &&
    accountType;

  const handleContinue = async () => {
    if (accountNumber !== confirmAccountNumber) {
      hapticError();
      Alert.alert('Mismatch', 'Account numbers do not match. Please re-enter.');
      return;
    }

    try {
      setIsLoading(true);
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) {
        hapticError();
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      const docRef = doc(db, 'mf_onboarding', phone);

      if (isAlreadyVerified) {
        hapticSmall();
        router.push('/(gowealthy)/mf/onboarding/screen6');
        return;
      }

      const onboardingSnap = await getDoc(docRef);
      const onboarding = onboardingSnap.data() || {};
      const accountHolderName = String(onboarding?.pan_data?.name || '').trim();
      const email = String(onboarding?.email_data?.email || '').trim();

      if (!accountHolderName) {
        throw new Error('PAN name is missing. Please complete PAN verification first.');
      }

      setVerifyStep(pendingValidationId ? 'Checking verification...' : 'Running penny drop...');
      const verifyResponse = await fetch(`${NSE_SERVICE_URL}/api/nse/bank-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingValidationId
          ? { validation_id: pendingValidationId }
          : {
              account_number: accountNumber,
              ifsc: ifscCode,
              name: accountHolderName,
              email,
              contact: phone,
            }),
      });

      const responseText = await verifyResponse.text();
      let verification = {};
      try {
        verification = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error('Bank verification returned an invalid response.');
      }

      if (!verifyResponse.ok) {
        throw new Error(
          typeof verification.error === 'string'
            ? verification.error
            : 'Unable to verify this bank account right now.'
        );
      }

      if (verification.pending) {
        setPendingValidationId(verification.validation_id);
        hapticSmall();
        Alert.alert(
          'Verification is still processing',
          'Razorpay has started the penny drop. Tap "Check verification" in a moment; this checks the same transaction without starting another one.'
        );
        return;
      }

      if (!verification.verified) {
        setPendingValidationId(null);
        throw new Error(
          verification.details ||
          'Razorpay could not verify these bank details. Check the account number and IFSC and try again.'
        );
      }

      setVerifyStep('Saving verified account...');
      const verifiedAt = new Date().toISOString();

      await updateDoc(docRef, {
        bank_data: {
          account_no:       accountNumber,
          ifsc_code:        ifscCode,
          account_type:     accountType,  // "SB", "CB", "NE", "NO"
          default_bank:     'Y',
          nse_bank_status:  'NOT_SUBMITTED', // → PENDING after bank-add, then ACTIVE
          penny_drop_status: 'VERIFIED',
          razorpay_validation_id: verification.validation_id,
          razorpay_account_status: verification.account_status,
          razorpay_registered_name: verification.registered_name || null,
          razorpay_name_match_score: verification.name_match_score,
          razorpay_utr: verification.utr || null,
          penny_drop_verified_at: verifiedAt,
          saved_at: verifiedAt,
        },
        onboarding_step: 5,
      });

      console.log('Bank account verified by Razorpay and saved');
      setVerifiedBank({
        account_no: accountNumber,
        ifsc_code: ifscCode,
        registered_name: verification.registered_name || '',
      });
      setPendingValidationId(null);
      hapticSuccess();
      router.push('/(gowealthy)/mf/onboarding/screen6');

    } catch (error) {
      hapticError();
      console.error('❌ Bank verify/save error:', error);
      Alert.alert('Bank verification failed', error.message || 'Please check your details and try again.');
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
        <LogoSpinner />
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
          <TouchableOpacity onPress={() => { hapticSmall(); router.back(); }} style={styles.backBtn} activeOpacity={0.8}>
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
                  onPress={() => { if (accountType !== type.value) hapticSmall(); setAccountType(type.value); }}
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
            {ifscCode.length > 0 && !isIfscValid && (
              <Text style={styles.inputError}>Enter a valid IFSC (for example, HDFC0000053)</Text>
            )}
            {isIfscValid && (
              <Text style={styles.inputSuccess}>✓ Valid IFSC format</Text>
            )}
          </View>

          {isAlreadyVerified && (
            <View style={styles.verifiedCard}>
              <Text style={styles.verifiedCardTitle}>✓ Bank account verified</Text>
              {!!verifiedBank?.registered_name && (
                <Text style={styles.verifiedCardText}>Registered to {verifiedBank.registered_name}</Text>
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoIcon}>🏦</Text>
              <Text style={styles.infoCardHeaderText}>Secure penny-drop verification</Text>
            </View>
            <Text style={styles.infoText}>
              Razorpay will make a small penny-drop transfer to confirm that this account is active. We continue only after the bank confirms it.
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
                <Text style={styles.continueButtonText}>
                  {isAlreadyVerified
                    ? '→ Continue to Final Step'
                    : pendingValidationId
                      ? '↻ Check Verification'
                      : '✓ Verify Bank Account'}
                </Text>
              )}
            </LinearGradient>
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

  verifiedCard: {
    backgroundColor: 'rgba(79,211,154,0.08)', borderWidth: 1.5, borderColor: 'rgba(79,211,154,0.28)',
    borderRadius: 16, padding: 14, marginBottom: 18,
  },
  verifiedCardTitle: { color: C.good, fontSize: 12.5, fontWeight: '700', marginBottom: 4 },
  verifiedCardText: { color: C.muted, fontSize: 12.5, lineHeight: 19 },

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
});

export default Screen5Bank;
