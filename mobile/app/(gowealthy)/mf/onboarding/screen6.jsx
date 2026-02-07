import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Screen6Bank = () => {
  const router = useRouter();
  const [inputMethod, setInputMethod] = useState('manual');
  const [bankData, setBankData] = useState({
    chequeImage: null,
    accountNumber: '',
    ifscCode: '',
    accountType: '',
    accountHolderName: '',
    pennyDropVerified: false
  });
  const [isPennyDropping, setIsPennyDropping] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 1,
    });

    if (!result.canceled) {
      setBankData(prev => ({ ...prev, chequeImage: result.assets[0].uri, accountNumber: '', ifscCode: '', accountType: '' }));
    }
  };

  const handleInputChange = (field, value) => {
    setBankData(prev => ({ ...prev, [field]: value }));
  };

  const handleAccountNumberChange = (value) => {
    const formattedValue = value.replace(/[^0-9]/g, '').slice(0, 18);
    handleInputChange('accountNumber', formattedValue);
  };

  const handleIFSCChange = (value) => {
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    handleInputChange('ifscCode', formattedValue);
  };

  const handlePennyDrop = async () => {
    setIsPennyDropping(true);
    
    setTimeout(() => {
      setIsPennyDropping(false);
      const mockAccountHolderName = 'JOHN DOE';
      setBankData(prev => ({
        ...prev,
        accountHolderName: mockAccountHolderName,
        pennyDropVerified: true
      }));
      
      setTimeout(() => {
        handleComplete();
      }, 1000);
    }, 3000);
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('mf_bank_data', JSON.stringify(bankData));
      router.push('/(gowealthy)/mf/onboarding/preview');
    } catch (error) {
      console.error('Error saving bank data:', error);
    }
  };

  const isManualValid = inputMethod === 'manual' && 
                       bankData.accountNumber?.length >= 9 && 
                       bankData.ifscCode?.length === 11 && 
                       bankData.accountType;
  const isUploadValid = inputMethod === 'upload' && bankData.chequeImage;
  const isValid = isManualValid || isUploadValid;

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
              step <= 5 && styles.progressCircleCompleted,
              step === 6 && styles.progressCircleActive
            ]}>
              <Text style={[
                styles.progressText,
                step <= 6 && styles.progressTextActive
              ]}>{step <= 5 ? '✓' : step}</Text>
            </View>
            {idx < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Add Your Bank Account</Text>
        <Text style={styles.questionSubtitle}>
          Upload cancelled cheque or enter bank details manually for investments and redemptions
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => {
            setInputMethod('manual');
            setBankData(prev => ({ ...prev, chequeImage: null }));
          }}
          style={[styles.tabButton, inputMethod === 'manual' && styles.tabActive]}
        >
          <Text style={[styles.tabText, inputMethod === 'manual' && styles.tabTextActive]}>Enter Manually</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setInputMethod('upload');
            setBankData(prev => ({ ...prev, accountNumber: '', ifscCode: '', accountType: '' }));
          }}
          style={[styles.tabButton, inputMethod === 'upload' && styles.tabActive]}
        >
          <Text style={[styles.tabText, inputMethod === 'upload' && styles.tabTextActive]}>Upload Cheque</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.formContainer}>
          {inputMethod === 'manual' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number *</Text>
                <TextInput
                  value={bankData.accountNumber}
                  onChangeText={handleAccountNumberChange}
                  placeholder="Enter account number"
                  placeholderTextColor="#666"
                  style={styles.formInput}
                  maxLength={18}
                  keyboardType="number-pad"
                />
                {bankData.accountNumber && bankData.accountNumber.length < 9 && (
                  <Text style={styles.inputError}>Account number should be at least 9 digits</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IFSC Code *</Text>
                <TextInput
                  value={bankData.ifscCode}
                  onChangeText={handleIFSCChange}
                  placeholder="HDFC0000001"
                  placeholderTextColor="#666"
                  style={styles.formInput}
                  maxLength={11}
                  autoCapitalize="characters"
                />
                {bankData.ifscCode && bankData.ifscCode.length !== 11 && (
                  <Text style={styles.inputError}>IFSC code should be 11 characters</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Type *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={bankData.accountType}
                    onValueChange={(value) => handleInputChange('accountType', value)}
                    style={styles.picker}
                    dropdownIconColor="#6b50c4"
                  >
                    <Picker.Item label="Select Account Type" value="" />
                    <Picker.Item label="Savings Account" value="savings" />
                    <Picker.Item label="Current Account" value="current" />
                    <Picker.Item label="NRI Account" value="nri" />
                  </Picker>
                </View>
              </View>

              {bankData.accountHolderName && (
                <View style={styles.verificationSection}>
                  <View style={styles.verificationResult}>
                    <Text style={styles.verificationIcon}>✓</Text>
                    <View>
                      <Text style={styles.verificationTitle}>Account Verified</Text>
                      <Text style={styles.verificationSubtitle}>Account Holder: {bankData.accountHolderName}</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.imageUploadSection}>
              {!bankData.chequeImage ? (
                <TouchableOpacity 
                  style={styles.imageUploadArea}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadIconContainer}>
                    <Text style={styles.uploadIcon}>📤</Text>
                  </View>
                  <Text style={styles.uploadTitle}>Upload Cancelled Cheque</Text>
                  <Text style={styles.uploadSubtitle}>
                    Click to select your cancelled cheque image
                  </Text>
                  <View style={styles.uploadBrowseBtn}>
                    <Text style={styles.uploadBrowseBtnText}>Browse Files</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: bankData.chequeImage }} 
                    style={styles.uploadedImagePreview}
                    resizeMode="contain"
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      onPress={() => setBankData(prev => ({ ...prev, chequeImage: null }))}
                      style={styles.removeImageBtn}
                    >
                      <Text style={styles.removeImageBtnText}>✕ Remove</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={pickImage}
                      style={styles.changeImageBtn}
                    >
                      <Text style={styles.changeImageBtnText}>📤 Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoIcon}>🏦</Text>
              <Text style={styles.infoCardHeaderText}>Bank Account Security</Text>
            </View>
            <Text style={styles.infoText}>
              Your bank details are encrypted and stored securely. We'll verify account ownership through penny drop.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonSection}>
        {!bankData.pennyDropVerified ? (
          <TouchableOpacity
            onPress={handlePennyDrop}
            disabled={!isValid || isPennyDropping}
            style={[styles.continueButton, (!isValid || isPennyDropping) && styles.continueButtonDisabled]}
          >
            {isPennyDropping ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.continueButtonText}>Verifying Account...</Text>
              </>
            ) : (
              <Text style={styles.continueButtonText}>🏦 Verify & Complete Setup</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleComplete}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>→ Complete Setup & Start Investing</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/mf/onboarding/preview')}
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
  questionSection: { alignItems: 'center', marginBottom: 24, paddingHorizontal: 20 },
  questionTitle: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
  questionSubtitle: { fontSize: 16, color: '#999', lineHeight: 24, maxWidth: 600, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 6, marginHorizontal: 20, marginBottom: 32 },
  tabButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#6b50c4' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#999' },
  tabTextActive: { color: '#fff' },
  contentSection: { marginBottom: 32 },
  formContainer: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
  formInput: { padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
  inputError: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  pickerContainer: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, overflow: 'hidden' },
  picker: { color: '#fff', height: 50 },
  verificationSection: { marginTop: 20 },
  verificationResult: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1.5, borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  verificationIcon: { fontSize: 24, color: '#10b981', fontWeight: 'bold' },
  verificationTitle: { fontSize: 14, fontWeight: '600', color: '#10b981' },
  verificationSubtitle: { fontSize: 13, color: 'rgba(16, 185, 129, 0.9)', marginTop: 2 },
  imageUploadSection: { marginBottom: 24 },
  imageUploadArea: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)', borderStyle: 'dashed', borderRadius: 16, padding: 40, alignItems: 'center' },
  uploadIconContainer: { width: 64, height: 64, backgroundColor: 'rgba(107, 80, 196, 0.1)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  uploadIcon: { fontSize: 32 },
  uploadTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  uploadSubtitle: { fontSize: 14, color: '#999', marginBottom: 16, textAlign: 'center' },
  uploadBrowseBtn: { backgroundColor: '#6b50c4', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  uploadBrowseBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  imagePreviewContainer: { alignItems: 'center' },
  uploadedImagePreview: { width: '100%', height: 250, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 16 },
  imageActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  removeImageBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.3)', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  removeImageBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
  changeImageBtn: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1.5, borderColor: 'rgba(107, 80, 196, 0.3)', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  changeImageBtnText: { color: '#6b50c4', fontSize: 14, fontWeight: '500' },
  infoCard: { backgroundColor: 'rgba(59, 130, 246, 0.08)', borderWidth: 1.5, borderColor: 'rgba(59, 130, 246, 0.25)', borderRadius: 12, padding: 16 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 18 },
  infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  infoText: { fontSize: 13, color: '#3b82f6', lineHeight: 18, opacity: 0.9 },
  buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
  continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  continueButtonDisabled: { backgroundColor: '#444', opacity: 0.6 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  nextDevButton: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', opacity: 0.8 },
  nextDevButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});

export default Screen6Bank;