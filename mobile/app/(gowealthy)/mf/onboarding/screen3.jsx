import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';const AMC_CODE = 'AXF'; // ← replace with real AMC code when sir provides

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

  if (isLoadingData) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6b50c4" />
        <Text style={styles.loadingScreenText}>Loading your details...</Text>
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
              step <= 2 && styles.progressCircleCompleted,
              step === 3 && styles.progressCircleActive,
            ]}>
              <Text style={[
                styles.progressText,
                step <= 3 && styles.progressTextActive,
              ]}>{step <= 2 ? '✓' : step}</Text>
            </View>
            {idx < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Complete your KYC</Text>
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
              placeholderTextColor="#666"
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
              style={[
                styles.sendButton,
                (isLoading || !isValidEmail(email)) && styles.buttonDisabled,
              ]}
            >
              {isLoading ? (
                <View style={styles.buttonRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.sendButtonText}>Sending KYC Link...</Text>
                </View>
              ) : (
                <Text style={styles.sendButtonText}>📨 Send KYC Verification Link</Text>
              )}
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

              <TouchableOpacity onPress={handleOpenLink} style={styles.openLinkButton}>
                <Text style={styles.openLinkButtonText}>🔗 Open KYC Verification →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendKYCLink}
                disabled={isLoading}
                style={styles.resendButton}
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
          style={[styles.continueButton, !ekycLink && styles.buttonDisabled]}
        >
          <Text style={styles.continueButtonText}>
            {ekycLink ? "✓ I've completed KYC → Continue" : 'Send KYC link first'}
          </Text>
        </TouchableOpacity>

        {/* Dev skip */}
        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/mf/onboarding/screen4')}
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
  prefilledCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 24 },
  prefilledTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  prefilledRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  prefilledLabel: { fontSize: 14, color: '#888' },
  prefilledValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 8 },
  formInput: { padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
  formInputDisabled: { opacity: 0.6 },
  inputError: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  sendButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  buttonDisabled: { backgroundColor: '#333', opacity: 0.5 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkCard: { backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 16, padding: 20, marginBottom: 24 },
  linkCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  linkCardIcon: { fontSize: 20 },
  linkCardTitle: { fontSize: 16, fontWeight: '600', color: '#10b981' },
  linkCardSubtext: { fontSize: 14, color: '#ccc', lineHeight: 22, marginBottom: 16 },
  linkCardEmail: { color: '#fff', fontWeight: '600' },
  openLinkButton: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  openLinkButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resendButton: { paddingVertical: 10, alignItems: 'center' },
  resendButtonText: { color: '#6b50c4', fontSize: 14, fontWeight: '500' },
  infoCard: { backgroundColor: 'rgba(107,80,196,0.08)', borderWidth: 1.5, borderColor: 'rgba(107,80,196,0.25)', borderRadius: 12, padding: 16 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 18 },
  infoCardHeaderText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  infoText: { fontSize: 14, color: '#ccc', lineHeight: 22 },
  buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
  continueButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  devButton: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', opacity: 0.7 },
  devButtonText: { color: '#fff', fontSize: 14 },
});

export default Screen3FreshKYC;