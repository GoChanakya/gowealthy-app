import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Screen3FreshKYC = () => {
  const router = useRouter();
  const [freshKycData, setFreshKycData] = useState({
    pan: '',
    mobile: '',
    email: ''
  });

  const handleInputChange = (field, value) => {
    setFreshKycData(prev => ({ ...prev, [field]: value }));
  };

  const handlePanChange = (value) => {
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    handleInputChange('pan', formattedValue);
  };

  const handleMobileChange = (value) => {
    const formattedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    handleInputChange('mobile', formattedValue);
  };

  const isFormComplete = freshKycData.pan?.length === 10 && 
                        freshKycData.mobile?.length === 10 && 
                        freshKycData.email && 
                        freshKycData.email.includes('@');

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem('mf_kyc_data', JSON.stringify(freshKycData));
      router.push('/(gowealthy)/mf/onboarding/screen4');
    } catch (error) {
      console.error('Error saving KYC data:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6].map((step, idx) => (
          <View key={step} style={styles.progressStepContainer}>
            <View style={[
              styles.progressCircle,
              step <= 2 && styles.progressCircleCompleted,
              step === 3 && styles.progressCircleActive
            ]}>
              <Text style={[
                styles.progressText,
                step <= 3 && styles.progressTextActive
              ]}>{step <= 2 ? '✓' : step}</Text>
            </View>
            {idx < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Fresh KYC Registration</Text>
        <Text style={styles.questionSubtitle}>
          Your KYC was not found. Please provide basic details for fresh KYC registration
        </Text>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PAN Number *</Text>
            <TextInput
              value={freshKycData.pan}
              onChangeText={handlePanChange}
              placeholder="ABCDE1234F"
              placeholderTextColor="#666"
              style={styles.formInput}
              maxLength={10}
              autoCapitalize="characters"
            />
            {freshKycData.pan && freshKycData.pan.length !== 10 && (
              <Text style={styles.inputError}>PAN number should be 10 characters</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number *</Text>
            <TextInput
              value={freshKycData.mobile}
              onChangeText={handleMobileChange}
              placeholder="9876543210"
              placeholderTextColor="#666"
              style={styles.formInput}
              maxLength={10}
              keyboardType="phone-pad"
            />
            {freshKycData.mobile && freshKycData.mobile.length !== 10 && (
              <Text style={styles.inputError}>Mobile number should be 10 digits</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              value={freshKycData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="example@email.com"
              placeholderTextColor="#666"
              style={styles.formInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {freshKycData.email && !freshKycData.email.includes('@') && (
              <Text style={styles.inputError}>Please enter a valid email address</Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoIcon}>👤</Text>
              <Text style={styles.infoCardHeaderText}>Fresh KYC Registration</Text>
            </View>
            <Text style={styles.infoText}>
              We'll process your KYC application with these details. You'll receive updates on your mobile and email.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isFormComplete}
          style={[styles.continueButton, !isFormComplete && styles.continueButtonDisabled]}
        >
          <Text style={styles.continueButtonText}>→ Submit KYC Application</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/mf/onboarding/screen4')}
          style={styles.nextDevButton}
        >
          <Text style={styles.nextDevButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, paddingTop: 60 },
  backButton: { padding: 8 },
  backButtonText: { color: '#fff', fontSize: 16 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingHorizontal: 20 },
  progressStepContainer: { flexDirection: 'row', alignItems: 'center' },
  progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
  progressCircleActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4' },
  progressCircleCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
  progressText: { fontSize: 14, fontWeight: '600', color: '#666' },
  progressTextActive: { color: '#fff' },
  progressLine: { width: 24, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginHorizontal: 4 },
  questionSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
  questionTitle: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
  questionSubtitle: { fontSize: 16, color: '#999', lineHeight: 24, maxWidth: 600, textAlign: 'center' },
  contentSection: { marginBottom: 32 },
  formContainer: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
  formInput: { padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
  inputError: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  infoCard: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1.5, borderColor: 'rgba(107, 80, 196, 0.3)', borderRadius: 12, padding: 16, marginTop: 8 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 20 },
  infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  infoText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
  continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  nextDevButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', opacity: 0.8 },
  nextDevButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});

export default Screen3FreshKYC;