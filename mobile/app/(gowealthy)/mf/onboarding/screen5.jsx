import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';const Screen5Bank = () => {
  const router = useRouter();

  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('SB'); // default savings
  const [isLoading, setIsLoading] = useState(false);
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

      // Save bank data to Firestore — Screen 6 will use this for UCC registration
      const docRef = doc(db, 'mf_onboarding', phone);
      await updateDoc(docRef, {
        bank_data: {
          account_no:       accountNumber,
          ifsc_code:        ifscCode,
          account_type:     accountType,  // "SB", "CB", "NE", "NO"
          default_bank:     'Y',
          saved_at:         new Date().toISOString(),
        },
        onboarding_step: 5,
      });

      console.log('✅ Bank data saved to Firestore');
      router.push('/(gowealthy)/mf/onboarding/screen6');

    } catch (error) {
      console.error('❌ Bank save error:', error);
      Alert.alert('Error', 'Failed to save bank details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6b50c4" />
        <Text style={styles.loadingText}>Loading...</Text>
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
              step <= 4 && styles.progressCircleCompleted,
              step === 5 && styles.progressCircleActive,
            ]}>
              <Text style={[
                styles.progressText,
                step <= 5 && styles.progressTextActive,
              ]}>{step <= 4 ? '✓' : step}</Text>
            </View>
            {idx < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Add Bank Account</Text>
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
            placeholderTextColor="#555"
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
            placeholderTextColor="#555"
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
            placeholderTextColor="#555"
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
          style={[styles.continueButton, (!isFormValid || isLoading) && styles.buttonDisabled]}
        >
          {isLoading ? (
            <View style={styles.buttonRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.continueButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.continueButtonText}>→ Continue to Final Step</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/mf/onboarding/screen6')}
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
  loadingText: { color: '#fff', fontSize: 15 },
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
  formContainer: { paddingHorizontal: 20, marginBottom: 16 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 10 },
  formInput: { padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
  formInputError: { borderColor: 'rgba(239,68,68,0.6)' },
  formInputSuccess: { borderColor: 'rgba(16,185,129,0.6)' },
  inputError: { color: '#ef4444', fontSize: 12, marginTop: 6 },
  inputSuccess: { color: '#10b981', fontSize: 12, marginTop: 6 },
  accountTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  accountTypeBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  accountTypeBtnActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4' },
  accountTypeBtnText: { color: '#888', fontSize: 13, fontWeight: '500' },
  accountTypeBtnTextActive: { color: '#fff' },
  testCard: { backgroundColor: 'rgba(255,165,0,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,165,0,0.25)', borderRadius: 12, padding: 14, marginBottom: 16 },
  testCardTitle: { color: '#FFA500', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  testCardText: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  infoCard: { backgroundColor: 'rgba(107,80,196,0.08)', borderWidth: 1.5, borderColor: 'rgba(107,80,196,0.25)', borderRadius: 12, padding: 16 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 18 },
  infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  infoText: { fontSize: 13, color: '#ccc', lineHeight: 20 },
  buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
  continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: '#333', opacity: 0.5 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devButton: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', opacity: 0.7 },
  devButtonText: { color: '#fff', fontSize: 14 },
});

export default Screen5Bank;