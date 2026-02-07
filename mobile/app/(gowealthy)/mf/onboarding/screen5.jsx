import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Screen5FATCA = () => {
  const router = useRouter();
  const [fatcaData, setFatcaData] = useState({
    countryOfBirth: '',
    taxResidency: '',
    sourceOfIncome: '',
    annualIncome: '',
    politicallyExposed: false
  });

  const handleInputChange = (field, value) => {
    setFatcaData(prev => ({ ...prev, [field]: value }));
  };

  const isFormComplete = fatcaData.countryOfBirth && fatcaData.taxResidency && 
                        fatcaData.sourceOfIncome && fatcaData.annualIncome;

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem('mf_fatca_data', JSON.stringify(fatcaData));
      router.push('/(gowealthy)/mf/onboarding/screen6');
    } catch (error) {
      console.error('Error saving FATCA data:', error);
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
              step <= 4 && styles.progressCircleCompleted,
              step === 5 && styles.progressCircleActive
            ]}>
              <Text style={[
                styles.progressText,
                step <= 5 && styles.progressTextActive
              ]}>{step <= 4 ? '✓' : step}</Text>
            </View>
            {idx < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>FATCA Declaration</Text>
        <Text style={styles.questionSubtitle}>
          Foreign Account Tax Compliance Act - Required for compliance
        </Text>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.formContainer}>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Country of Birth *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={fatcaData.countryOfBirth}
                  onValueChange={(value) => handleInputChange('countryOfBirth', value)}
                  style={styles.picker}
                  dropdownIconColor="#6b50c4"
                >
                  <Picker.Item label="Select Country" value="" />
                  <Picker.Item label="India" value="India" />
                  <Picker.Item label="USA" value="USA" />
                  <Picker.Item label="UK" value="UK" />
                  <Picker.Item label="Canada" value="Canada" />
                  <Picker.Item label="Australia" value="Australia" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tax Residency *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={fatcaData.taxResidency}
                  onValueChange={(value) => handleInputChange('taxResidency', value)}
                  style={styles.picker}
                  dropdownIconColor="#6b50c4"
                >
                  <Picker.Item label="Select Country" value="" />
                  <Picker.Item label="India" value="India" />
                  <Picker.Item label="USA" value="USA" />
                  <Picker.Item label="UK" value="UK" />
                  <Picker.Item label="Canada" value="Canada" />
                  <Picker.Item label="Australia" value="Australia" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Income Source *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={fatcaData.sourceOfIncome}
                  onValueChange={(value) => handleInputChange('sourceOfIncome', value)}
                  style={styles.picker}
                  dropdownIconColor="#6b50c4"
                >
                  <Picker.Item label="Select Source" value="" />
                  <Picker.Item label="Salary" value="salary" />
                  <Picker.Item label="Business" value="business" />
                  <Picker.Item label="Investment" value="investment" />
                  <Picker.Item label="Pension" value="pension" />
                  <Picker.Item label="Rental Income" value="rental" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Income Range *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={fatcaData.annualIncome}
                  onValueChange={(value) => handleInputChange('annualIncome', value)}
                  style={styles.picker}
                  dropdownIconColor="#6b50c4"
                >
                  <Picker.Item label="Select Range" value="" />
                  <Picker.Item label="Below ₹5 Lakhs" value="below-5l" />
                  <Picker.Item label="₹5 - 10 Lakhs" value="5l-10l" />
                  <Picker.Item label="₹10 - 25 Lakhs" value="10l-25l" />
                  <Picker.Item label="₹25 - 50 Lakhs" value="25l-50l" />
                  <Picker.Item label="Above ₹50 Lakhs" value="above-50l" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.checkboxGroup}>
            <TouchableOpacity
              style={styles.checkboxLabel}
              onPress={() => handleInputChange('politicallyExposed', !fatcaData.politicallyExposed)}
            >
              <View style={[styles.checkbox, fatcaData.politicallyExposed && styles.checkboxChecked]}>
                {fatcaData.politicallyExposed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I am a Politically Exposed Person (PEP) or related to a PEP
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoIcon}>🌍</Text>
              <Text style={styles.infoCardHeaderText}>About FATCA</Text>
            </View>
            <Text style={styles.infoText}>
              FATCA compliance helps prevent tax evasion by ensuring proper tax reporting. Your information is kept secure and confidential.
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
          <Text style={styles.continueButtonText}>→ Continue to Bank Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/mf/onboarding/screen6')}
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
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  inputGroup: { flex: 1, marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
  pickerContainer: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, overflow: 'hidden' },
  picker: { color: '#fff', height: 50 },
  checkboxGroup: { marginVertical: 20 },
  checkboxLabel: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8, backgroundColor: 'rgba(107, 80, 196, 0.05)' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#6b50c4', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#6b50c4' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  checkboxText: { flex: 1, fontSize: 14, color: '#fff', lineHeight: 20 },
  infoCard: { backgroundColor: 'rgba(59, 130, 246, 0.08)', borderWidth: 1.5, borderColor: 'rgba(59, 130, 246, 0.25)', borderRadius: 12, padding: 16, marginTop: 8 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 18 },
  infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  infoText: { fontSize: 13, color: '#3b82f6', lineHeight: 18, opacity: 0.9 },
  buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
  continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  nextDevButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', opacity: 0.8 },
  nextDevButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});

export default Screen5FATCA;