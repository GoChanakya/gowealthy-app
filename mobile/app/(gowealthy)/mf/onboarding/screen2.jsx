import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../../../src/config/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';  // ← added getDoc, updateDoc
import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';
import { uploadToSignedPost } from '../../../../src/utils/upload';
import { hapticError, hapticSmall, hapticSuccess, hapticWarning } from '../../../../src/lib/haptics';
const OCR_ENDPOINT = 'https://adhar-parser-763133497996.asia-south1.run.app';

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
      left: Math.random() * SCREEN_W,
      size: 2 + Math.random() * 2.5,
      duration: 5500 + Math.random() * 5000,
      delay: Math.random() * 6000,
      drift: (Math.random() - 0.5) * 30,
    }))
  ), []);

  return (
    <View style={styles.embersWrap} pointerEvents="none">
      {embers.map((e, i) => (
        <Ember key={i} {...e} />
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

const Screen2AadhaarBackend = () => {
  const router = useRouter();
  const [aadharImage, setAadharImage] = useState(null);
  const [aadharData, setAadharData] = useState({
    number: '',
    name: '',
    address: '',
    dob: ''
  });
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState(null);
  const [isCheckingKYC, setIsCheckingKYC] = useState(false);  // ← NEW
  const [kycResult, setKycResult] = useState(null);           // ← NEW
        useEffect(() => {
  loadExistingData();
}, []);

const loadExistingData = async () => {
  try {
    setIsLoadingExisting(true);
    const phoneNumber = await AsyncStorage.getItem('user_phone');
    if (!phoneNumber) return;
 
    const docRef = doc(db, 'mf_onboarding', phoneNumber);
    const docSnap = await getDoc(docRef);
 
    if (docSnap.exists() && docSnap.data()?.aadhaar_data) {
      const saved = docSnap.data().aadhaar_data;
      console.log('📂 Existing Aadhaar data found, restoring...');
 
      setAadharData({
        number:  saved.aadhaar_number || '',
        name:    saved.name           || '',
        address: saved.address        || '',
        dob:     saved.dob            || '',
      });
 
      if (saved.aadhaar_image_url) {
        setFileUrl(saved.aadhaar_image_url);
        
      }
 
      setIsProcessed(true);
      console.log('✅ Aadhaar data restored from Firestore');
    }
  } catch (error) {
    console.log('ℹ️ No existing Aadhaar data:', error.message);
  } finally {
    setIsLoadingExisting(false);
  }
};
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      hapticSmall();
      setAadharImage(result.assets[0].uri);
      setIsProcessed(false);
      setAadharData({ number: '', name: '', address: '', dob: '' });
      setFileUrl(null);
      setUploadProgress(0);
      setKycResult(null);
    }
  };

  const handleProcessAadhar = async () => {
    if (!aadharImage) {
      hapticError();
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const phoneNumber = await AsyncStorage.getItem('user_phone');
      if (!phoneNumber) {
        hapticError();
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      console.log('📱 Phone Number:', phoneNumber);

      // Step 1: Get signed upload URL
      const fileName = `aadhaar_${Date.now()}.jpg`;
      const urlResponse = await fetch(`${BACKEND_URL}/api/generate-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          contentType: 'image/jpeg',
          userId: phoneNumber,
          docType: 'aadhaar'
        })
      });

      if (!urlResponse.ok) throw new Error('Failed to get upload URL');

      const { url, fields, fileUrl: gcsFileUrl, gcsUri } = await urlResponse.json();
      setUploadProgress(25);

      // Step 2: Upload to GCS via signed POST
      console.log('📤 Uploading to GCS...');
      await uploadToSignedPost({ url, fields, uri: aadharImage });

      console.log('✅ GCS upload successful');
      setUploadProgress(50);
      setFileUrl(gcsFileUrl);
      setIsUploading(false);

      // Step 3: OCR extraction
      setIsProcessing(true);
      setUploadProgress(75);
      const encodedFileUrl = encodeURIComponent(gcsUri);
      const ocrUrl = `${OCR_ENDPOINT}?file_uri=${encodedFileUrl}`;
      console.log('🔄 Calling OCR:', ocrUrl);

      const ocrResponse = await fetch(ocrUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const ocrText = await ocrResponse.text();
      if (!ocrResponse.ok) throw new Error(`OCR failed: ${ocrResponse.status}`);

      let extractedData;
      try {
        extractedData = JSON.parse(ocrText);
        console.log('✅ OCR result:', extractedData);
      } catch {
        throw new Error('Failed to parse OCR response');
      }

      if (extractedData.Error || extractedData.error) {
        throw new Error(extractedData.Error || extractedData.error);
      }

      const mappedData = {
        number: extractedData.aadhaarNumber || extractedData.number || '',
        name: extractedData.name || '',
        address: extractedData.address || '',
        dob: extractedData.dob || extractedData.dateOfBirth || ''
      };

      setAadharData(mappedData);
      setUploadProgress(100);
      setIsProcessing(false);
      setIsProcessed(true);

      // Step 4: Save Aadhaar data to mf_onboarding
      await saveToFirebase(phoneNumber, mappedData, gcsFileUrl, gcsUri);
      hapticSuccess();

    } catch (error) {
      hapticError();
      console.error('❌ Error:', error);
      Alert.alert('Error', error.message || 'Failed to process Aadhaar');
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  // ─── CHANGED: saves to mf_onboarding/{phone} ───────────────────────────────
  const saveToFirebase = async (phoneNumber, data, gcsFileUrl, gcsUri) => {
    try {
      console.log('💾 Saving Aadhaar to mf_onboarding...');
      const docRef = doc(db, 'mf_onboarding', phoneNumber);
      await setDoc(docRef, {
        aadhaar_data: {
          name: data.name,
          dob: data.dob,
          aadhaar_number: data.number,   // masked/raw as returned by OCR
          address: data.address,
          aadhaar_image_url: gcsFileUrl,
          aadhaar_image_gcs_uri: gcsUri || null,
          extracted_at: new Date().toISOString(),
        },
        onboarding_step: 2,
        updated_at: new Date().toISOString(),
      }, { merge: true });
      console.log('✅ Aadhaar saved to mf_onboarding/' + phoneNumber);
    } catch (error) {
      console.error('❌ Firestore save error:', error);
      throw new Error('Failed to save Aadhaar data');
    }
  };

  const handleInputChange = (field, value) => {
    setAadharData(prev => ({ ...prev, [field]: value }));
  };

  // ─── CHANGED: reads PAN from Firestore → calls NSE KYC Check → routes ──────
  const handleContinue = async () => {
    try {
      setIsCheckingKYC(true);

      const phoneNumber = await AsyncStorage.getItem('user_phone');
      if (!phoneNumber) {
        hapticError();
        Alert.alert('Error', 'User session expired. Please log in again.');
        return;
      }

      // Save any manual edits to Firestore first
      if (isProcessed) {
        await saveToFirebase(phoneNumber, aadharData, fileUrl, null);
      }

      // Read PAN number from Firestore (set by Screen 1)
      console.log('📖 Reading PAN from Firestore...');
      const docRef = doc(db, 'mf_onboarding', phoneNumber);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists() || !docSnap.data()?.pan_data?.pan_number) {
        hapticError();
        Alert.alert('Error', 'PAN data not found. Please complete Screen 1 first.');
        setIsCheckingKYC(false);
        return;
      }

      const panNumber = docSnap.data().pan_data.pan_number;
      console.log('🪪 PAN from Firestore:', panNumber);

      // Call NSE KYC Check
      console.log('🔍 Calling NSE KYC Check...');
      const kycResponse = await fetch(`${NSE_SERVICE_URL}/api/nse/kyc-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan_no: panNumber })
      });

      const kycData = await kycResponse.json();
      console.log('📋 KYC Response:', kycData);

      // ── kyc_status "S" = KYC exists (REGISTERED or Validated)
      // ── kyc_status "F" = KYC not available / rejected / needs fresh KYC
      // ── error field means NSE API returned an error (treat as needs fresh KYC)
      const kycStatus = kycData.kyc_status;   // "S" or "F"
      const kycRemark = kycData.kyc_status_remark || '';

      console.log(`📊 KYC Status: ${kycStatus} | Remark: ${kycRemark}`);

      // Save KYC status to Firestore
      await updateDoc(docRef, {
        kyc_status: kycStatus || 'UNKNOWN',
        kyc_status_remark: kycRemark,
        kyc_checked_at: new Date().toISOString(),
        kyc_pan_used: panNumber,
        onboarding_step: 2,
      });

      setKycResult({ status: kycStatus, remark: kycRemark });
      setIsCheckingKYC(false);

      // ── Routing decision ──────────────────────────────────────────────────
      if (kycStatus === 'S') {
        hapticSuccess();
        // KYC verified or registered — skip fresh KYC, go to email OTP
        console.log('✅ KYC found → navigating to Screen 4 (Email OTP)');
        router.push('/(gowealthy)/mf/onboarding/screen4');
      } else {
        hapticWarning();
        // KYC not found / rejected — needs fresh KYC registration
        console.log('⚠️ KYC not found → navigating to Screen 3 (Fresh KYC)');
        router.push('/(gowealthy)/mf/onboarding/screen3');
      }

    } catch (error) {
      hapticError();
      console.error('❌ KYC check error:', error);
      setIsCheckingKYC(false);
      Alert.alert(
        'KYC Check Failed',
        'Unable to verify KYC status. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: handleContinue,
          },
          {
            text: 'Proceed Anyway',
            onPress: () => router.push('/(gowealthy)/mf/onboarding/screen3'),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const STEP = 2;
  const TOTAL_STEPS = 6;

  return (
    <View style={styles.screen}>
      <EmberField />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoadingExisting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={C.o} />
            <Text style={styles.loadingText}>Loading your saved data...</Text>
          </View>
        )}

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
            <Text style={styles.eyebrow}>IDENTITY VERIFICATION</Text>
            <View style={styles.eyebrowLine} />
          </View>
          <Text style={styles.questionTitle}>
            Upload your <Text style={styles.gradWord}>Aadhaar Card</Text>
          </Text>
          <Text style={styles.questionSubtitle}>
            Upload a clear image of your Aadhaar card for automatic data extraction
          </Text>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.formContainer}>
            <View style={styles.imageUploadSection}>
              {!aadharImage ? (
                <TouchableOpacity
                  style={styles.imageUploadArea}
                  onPress={pickImage}
                  activeOpacity={0.85}
                >
                  <View style={styles.uploadIconContainer}>
                    <Text style={styles.uploadIcon}>📤</Text>
                  </View>
                  <Text style={styles.uploadTitle}>Upload Aadhaar Card Image</Text>
                  <Text style={styles.uploadSubtitle}>
                    Tap to select your Aadhaar card image
                  </Text>
                  <View style={styles.uploadBrowseBtn}>
                    <Text style={styles.uploadBrowseBtnText}>Browse Files</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePreviewContainer}>
                  <View style={styles.imageFrame}>
                    <Image
                      source={{ uri: aadharImage }}
                      style={styles.uploadedImagePreview}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setAadharImage(null);
                        setIsProcessed(false);
                        setAadharData({ number: '', name: '', address: '', dob: '' });
                        setFileUrl(null);
                        setUploadProgress(0);
                        setKycResult(null);
                      }}
                      style={styles.removeImageBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeImageBtnText}>✕ Remove</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage} style={styles.changeImageBtn} activeOpacity={0.8}>
                      <Text style={styles.changeImageBtnText}>📤 Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Upload / OCR Progress Bar */}
            {(isUploading || isProcessing) && uploadProgress > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>
                    {isUploading ? 'Uploading to Cloud...' : 'Extracting Data...'}
                  </Text>
                  <Text style={styles.progressPercent}>{uploadProgress}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={[C.o, C.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
                  />
                </View>
              </View>
            )}

            {aadharImage && !isProcessed && !isUploading && !isProcessing && (
              <View style={styles.processSection}>
                <TouchableOpacity onPress={handleProcessAadhar} activeOpacity={0.9} style={styles.processButtonWrap}>
                  <LinearGradient
                    colors={[C.o2, C.o]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.processButton}
                  >
                    <Text style={styles.processButtonText}>→ Extract Details</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {isProcessed && (
              <View style={styles.extractedDataSection}>
                {isProcessed && !isEditing && (
                  <View style={styles.savedBanner}>
                    <Text style={styles.savedBannerText}>✓ Saved data loaded — tap Edit to change or Upload new Image</Text>
                  </View>
                )}
                <View style={styles.extractedHeader}>
                  <Text style={styles.extractedHeaderTitle}>Extracted Information</Text>

                  <TouchableOpacity
                    onPress={() => setIsEditing(!isEditing)}
                    style={styles.editToggleBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editToggleBtnText}>
                      {isEditing ? '👁️ View Mode' : '✏️ Edit Details'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Aadhaar Number</Text>
                    <TextInput
                      value={aadharData.number}
                      onChangeText={(value) => handleInputChange('number', value)}
                      editable={isEditing}
                      style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                      keyboardType="number-pad"
                      placeholderTextColor={C.muted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Date of Birth</Text>
                    <TextInput
                      value={aadharData.dob}
                      onChangeText={(value) => handleInputChange('dob', value)}
                      editable={isEditing}
                      style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={C.muted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    value={aadharData.name}
                    onChangeText={(value) => handleInputChange('name', value.toUpperCase())}
                    editable={isEditing}
                    style={[styles.formInput, !isEditing && styles.formInputDisabled]}
                    autoCapitalize="characters"
                    placeholderTextColor={C.muted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    value={aadharData.address}
                    onChangeText={(value) => handleInputChange('address', value)}
                    editable={isEditing}
                    style={[styles.formTextarea, !isEditing && styles.formInputDisabled]}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={C.muted}
                  />
                </View>

                {/* <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                  <Text style={styles.verifiedText}>Data extracted and saved</Text>
                </View> */}
              </View>
            )}

            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoIcon}>🛡️</Text>
                <Text style={styles.infoCardHeaderText}>Privacy Protected</Text>
              </View>
              <Text style={styles.infoText}>
                Your Aadhaar details are processed securely using Google Cloud and stored encrypted.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonSection}>
          {isProcessed ? (
            <TouchableOpacity
              onPress={handleContinue}
              disabled={isCheckingKYC}
              activeOpacity={0.9}
              style={styles.continueButtonWrap}
            >
              <LinearGradient
                colors={isCheckingKYC ? [C.faint, C.faint] : [C.o2, C.o]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.continueButton, isCheckingKYC && styles.continueButtonDisabled]}
              >
                {isCheckingKYC ? (
                  <>
                    <ActivityIndicator size="small" color={C.muted} style={{ marginRight: 8 }} />
                    <Text style={[styles.continueButtonText, styles.continueButtonTextDisabled]}>Checking KYC Status...</Text>
                  </>
                ) : (
                  <Text style={styles.continueButtonText}>🛡️ Verify KYC & Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleProcessAadhar}
              disabled={!aadharImage || isUploading || isProcessing}
              activeOpacity={0.9}
              style={styles.continueButtonWrap}
            >
              <LinearGradient
                colors={(!aadharImage || isUploading || isProcessing) ? [C.faint, C.faint] : [C.o2, C.o]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.continueButton, (!aadharImage || isUploading || isProcessing) && styles.continueButtonDisabled]}
              >
                <Text style={[styles.continueButtonText, (!aadharImage || isUploading || isProcessing) && styles.continueButtonTextDisabled]}>
                  {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : '→ Process Aadhaar Card'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* DEV SKIP BUTTONS */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/(gowealthy)/mf/onboarding/screen3')}
              style={[styles.nextDevButton, { flex: 1 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.nextDevButtonText}>Dev → S3 (Fresh KYC)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(gowealthy)/mf/onboarding/screen4')}
              style={[styles.nextDevButtonGold, { flex: 1 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.nextDevButtonGoldText}>Dev → S4 (KYC Found)</Text>
            </TouchableOpacity>
          </View>
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

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(8,6,10,0.88)', zIndex: 99,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
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
  contentSection: { marginBottom: 8 },
  formContainer: { paddingHorizontal: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },

  // upload area
  imageUploadSection: { marginBottom: 20 },
  imageUploadArea: {
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line,
    borderStyle: 'dashed', borderRadius: 22, padding: 36, alignItems: 'center',
  },
  uploadIconContainer: {
    width: 60, height: 60, backgroundColor: 'rgba(255,106,26,0.12)', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,106,26,0.25)',
  },
  uploadIcon: { fontSize: 28 },
  uploadTitle: { fontSize: 17, fontWeight: '700', color: C.ink, marginBottom: 6 },
  uploadSubtitle: { fontSize: 13, color: C.muted, marginBottom: 18, textAlign: 'center' },
  uploadBrowseBtn: {
    backgroundColor: 'rgba(255,106,26,0.12)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.35)',
    paddingVertical: 10, paddingHorizontal: 22, borderRadius: 30,
  },
  uploadBrowseBtnText: { color: C.o2, fontSize: 13.5, fontWeight: '700' },

  imagePreviewContainer: { alignItems: 'center' },
  imageFrame: {
    width: '100%', borderRadius: 18, padding: 4, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line2, marginBottom: 14,
  },
  uploadedImagePreview: { width: '100%', height: 230, borderRadius: 14 },
  imageActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  removeImageBtn: {
    backgroundColor: 'rgba(255,107,107,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.3)',
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 30,
  },
  removeImageBtnText: { color: C.bad, fontSize: 13.5, fontWeight: '600' },
  changeImageBtn: {
    backgroundColor: 'rgba(255,106,26,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,106,26,0.3)',
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 30,
  },
  changeImageBtnText: { color: C.o2, fontSize: 13.5, fontWeight: '600' },

  // progress
  progressSection: { marginVertical: 20 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 13.5, fontWeight: '600', color: C.ink },
  progressPercent: { fontSize: 13.5, fontWeight: '700', color: C.o2 },
  progressBarContainer: { width: '100%', height: 6, backgroundColor: C.faint, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },

  // extract cta
  processSection: { alignItems: 'center', marginVertical: 20 },
  processButtonWrap: { width: '100%', maxWidth: 420, borderRadius: 15, shadowColor: C.o, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  processButton: { paddingVertical: 15, paddingHorizontal: 28, borderRadius: 15, alignItems: 'center' },
  processButtonText: { color: '#1a0d04', fontSize: 15, fontWeight: '700' },

  // extracted card
  extractedDataSection: {
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.line, borderRadius: 22,
    padding: 22, marginBottom: 20,
  },
  savedBanner: {
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1, borderColor: 'rgba(79,211,154,0.3)',
    borderRadius: 12, padding: 10, marginBottom: 16, alignItems: 'center',
  },
  savedBannerText: { color: C.good, fontSize: 12.5, fontWeight: '600', textAlign: 'center' },
  extractedHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  extractedHeaderTitle: { fontSize: 15.5, fontWeight: '700', color: C.ink },
  editToggleBtn: {
    backgroundColor: 'rgba(255,106,26,0.1)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.3)',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 30,
  },
  editToggleBtnText: { color: C.o2, fontSize: 12.5, fontWeight: '700' },

  formRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  inputGroup: { flex: 1, marginBottom: 14 },
  inputLabel: { fontSize: 12.5, fontWeight: '600', color: C.muted, marginBottom: 8, letterSpacing: 0.3 },
  formInput: {
    padding: 14, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line2,
    borderRadius: 13, color: C.ink, fontSize: 14.5,
  },
  formTextarea: {
    padding: 14, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line2,
    borderRadius: 13, color: C.ink, fontSize: 14.5, height: 80, textAlignVertical: 'top',
  },
  formInputDisabled: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: C.line, opacity: 0.75 },

  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1.5, borderColor: 'rgba(79,211,154,0.3)',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8,
  },
  verifiedIcon: { fontSize: 20, color: C.good, marginRight: 8 },
  verifiedText: { fontSize: 14, fontWeight: '600', color: C.good },

  // info card
  infoCard: {
    backgroundColor: 'rgba(255,106,26,0.07)', borderWidth: 1, borderColor: 'rgba(255,106,26,0.22)',
    borderRadius: 16, padding: 16,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 18 },
  infoCardHeaderText: { fontSize: 13.5, fontWeight: '700', color: C.ink },
  infoText: { fontSize: 13, color: C.muted, lineHeight: 19 },

  // bottom buttons
  buttonSection: { padding: 20, gap: 12, marginBottom: 20 },
  continueButtonWrap: { borderRadius: 15, shadowColor: C.o, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 6 },
  continueButton: {
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 15, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  continueButtonDisabled: { shadowOpacity: 0 },
  continueButtonText: { color: '#1a0d04', fontSize: 15.5, fontWeight: '700' },
  continueButtonTextDisabled: { color: C.muted },
  nextDevButton: {
    backgroundColor: 'rgba(79,211,154,0.1)', borderWidth: 1, borderColor: 'rgba(79,211,154,0.3)',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 30, alignItems: 'center',
  },
  nextDevButtonText: { color: C.good, fontSize: 12, fontWeight: '600' },
  nextDevButtonGold: {
    backgroundColor: 'rgba(247,200,90,0.1)', borderWidth: 1, borderColor: 'rgba(247,200,90,0.35)',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 30, alignItems: 'center',
  },
  nextDevButtonGoldText: { color: C.gold, fontSize: 12, fontWeight: '600' },
});

export default Screen2AadhaarBackend;
