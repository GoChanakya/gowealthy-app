import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Linking, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { NSE_SERVICE_URL } from '../../../../src/config/services';

const SIPMandateScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fundName = decodeURIComponent(params.fundName || '');
  const amount = parseInt(params.amount || 0);
  const schemeCode = params.schemeCode || '';
  const tenureMonths = parseInt(params.tenureMonths || 36);
  const tenureLabel = decodeURIComponent(params.tenureLabel || '3 Years');

  const [step, setStep] = useState(1); // 1=confirm, 2=mandate pending, 3=mandate done
  const [isLoading, setIsLoading] = useState(false);
  const [mandateLink, setMandateLink] = useState('');
  const [mandateId, setMandateId] = useState('');
  const [showMandateModal, setShowMandateModal] = useState(false);

  const MANDATE_MAX_AMOUNT = 99999; // ₹99,999 standard mandate limit

  const handleCreateMandate = async () => {
    try {
      setIsLoading(true);

      // Get phone — try all key variants
      const raw = await AsyncStorage.getItem('user_phone')
               || await AsyncStorage.getItem('userPhone')
               || await AsyncStorage.getItem('phone')
               || await AsyncStorage.getItem('mobile');

      if (!raw) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'OK', onPress: () => router.replace('/(gowealthy)') },
        ]);
        setIsLoading(false);
        return;
      }

      // Normalize to 10 digits — Firestore key was saved as 10-digit during onboarding
      const phone = String(raw).replace(/\D/g, '').slice(-10);
      console.log('📱 Raw:', raw, '→ Normalized:', phone);

      // Try 10-digit first, then raw as fallback
      let docSnap = await getDoc(doc(db, 'mf_onboarding', phone));
      if (!docSnap.exists()) {
        console.log('⚠️ Not found with', phone, '→ trying raw:', raw);
        docSnap = await getDoc(doc(db, 'mf_onboarding', raw));
      }
      if (!docSnap.exists()) {
        throw new Error(`Onboarding data not found. Tried: "${phone}" and "${raw}". Please complete onboarding first.`);
      }
      const firestoreKey = docSnap.ref.id;
      console.log('✅ Found doc:', firestoreKey);
      const data = docSnap.data();

      const ucc       = data.ucc_code;
      const accountNo = data.bank_data?.account_no;
      const ifsc      = data.bank_data?.ifsc_code;
      const acType    = data.bank_data?.account_type || 'SB';

      if (!ucc || !accountNo || !ifsc) {
        throw new Error('Bank details missing. Please complete onboarding first.');
      }

      // Build start + end dates
      const today = new Date();
      const start = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
      const end   = '31/12/2099';
// UAT BYPASS — remove this block once sir provides active UCC
const UAT_BYPASS = true; // ← set to false when active UCC available

if (UAT_BYPASS) {
  const fakeMandateId = `MUAT${Date.now()}`;
  setMandateId(fakeMandateId);
  setMandateLink('https://nseinvestuat.nseindia.com/mandate-demo');
  await updateDoc(doc(db, 'mf_onboarding', firestoreKey), {
    mandate_id: fakeMandateId,
    mandate_status: 'PENDING',
  });
  setStep(2);
  setShowMandateModal(true);
  setIsLoading(false);
  return;
}
// real NSE call below...
      console.log('💳 Creating mandate for UCC:', ucc);

      const res = await fetch(`${NSE_SERVICE_URL}/api/nse/mandate-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_data: [{
            client_code:  ucc,
            amount:       String(MANDATE_MAX_AMOUNT),
            mandate_type: 'E',        // E = eNACH (digital)
            account_no:   accountNo,
            ac_type:      acType,
            ifsc_code:    ifsc,
            micr_no:      '',
            start_date:   start,
            end_date:     end,
          }],
        }),
      });

      const resData = await res.json();
      console.log('📋 Mandate response:', JSON.stringify(resData));

      const result = resData?.reg_data?.[0];
      if (!res.ok || result?.reg_status === 'REG_FAILED') {
        throw new Error(`Mandate failed: ${result?.reg_remark || resData?.error || 'Unknown error'}`);
      }

      const mId = result?.reg_id || '';
      setMandateId(mId);
      console.log('✅ Mandate created, id:', mId);

      // Get mandate auth link
      const linkRes = await fetch(`${NSE_SERVICE_URL}/api/nse/get-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType: 'MANDATE_AUTH', productRefId: mId }),
      });
      const linkData = await linkRes.json();
      const mLink = linkData?.firstHolderLink || '';
      setMandateLink(mLink);

      // Save mandate id to Firestore
      await updateDoc(doc(db, 'mf_onboarding', firestoreKey), {
        mandate_id:     mId,
        mandate_link:   mLink,
        mandate_status: 'PENDING',
      });

      setStep(2);
      setShowMandateModal(true);

    } catch (err) {
      console.error('❌ Mandate error:', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMandateDone = async () => {
    setShowMandateModal(false);
    setStep(3);
    // Proceed to SIP registration
    router.push(`/(gowealthy)/mf/trading/sip-confirm?schemeCode=${schemeCode}&fundName=${encodeURIComponent(fundName)}&amount=${amount}&tenureMonths=${tenureMonths}&tenureLabel=${encodeURIComponent(tenureLabel)}&mandateId=${mandateId}`);
  };

  return (
    <View style={styles.container}>
      {/* Mandate Modal */}
      <Modal visible={showMandateModal} transparent animationType="slide"
        onRequestClose={() => setShowMandateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalEmoji}>🏦</Text>
            <Text style={styles.modalTitle}>Authorize Auto-Debit</Text>
            <Text style={styles.modalSub}>
              NSE needs your permission to auto-debit your bank account every month for this SIP.
              This is a one-time setup.
            </Text>
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLine}>📋 Max monthly debit: ₹{MANDATE_MAX_AMOUNT.toLocaleString()}</Text>
              <Text style={styles.modalInfoLine}>🏦 Bank: Your linked account</Text>
              <Text style={styles.modalInfoLine}>🔒 Secure eNACH via NSE</Text>
            </View>
            {mandateLink ? (
              <TouchableOpacity style={styles.openLinkBtn}
                onPress={() => Linking.openURL(mandateLink)}>
                <Text style={styles.openLinkTxt}>🔗 Authorize on NSE →</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noLinkBox}>
                <Text style={styles.noLinkTxt}>Link not available yet. Check your email from NSE.</Text>
              </View>
            )}
            <Text style={styles.modalNote}>After authorizing, come back and tap Done.</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={handleMandateDone}>
              <Text style={styles.doneBtnTxt}>✅ Done — I've Authorized</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMandateModal(false)} style={styles.laterBtn}>
              <Text style={styles.laterTxt}>Remind me later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Mandate</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 120 }}>

        {/* Step tracker */}
        <View style={styles.stepTracker}>
          {['Mandate Setup', 'Authorize Bank', 'SIP Active'].map((s, i) => (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step - 1 && styles.stepDotActive]}>
                  <Text style={styles.stepDotTxt}>{i < step ? '✓' : i + 1}</Text>
                </View>
                <Text style={[styles.stepLbl, i === step - 1 && styles.stepLblActive]}>{s}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, i < step - 1 && styles.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardLbl}>YOUR SIP SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>Fund</Text>
            <Text style={styles.summaryVal} numberOfLines={2}>{fundName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>Monthly Amount</Text>
            <Text style={[styles.summaryVal, { color: '#ff6500', fontWeight: '800' }]}>₹{amount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>Duration</Text>
            <Text style={styles.summaryVal}>{tenureLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>Scheme Code</Text>
            <Text style={styles.summaryVal}>{schemeCode}</Text>
          </View>
        </View>

        {/* What is mandate */}
        <View style={styles.explainCard}>
          <Text style={styles.explainTitle}>🏦 What is a Mandate?</Text>
          <Text style={styles.explainTxt}>
            A mandate is a one-time permission that allows NSE to automatically debit your bank account
            on your SIP date every month. It's like a standing instruction — you set it once and your
            SIP runs automatically.
          </Text>
          <View style={styles.explainPoints}>
            <Text style={styles.explainPoint}>✓ Set up once, works for all future SIPs</Text>
            <Text style={styles.explainPoint}>✓ Max limit: ₹99,999 per month</Text>
            <Text style={styles.explainPoint}>✓ Can be cancelled anytime</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, isLoading && styles.ctaBtnDisabled]}
          disabled={isLoading}
          onPress={handleCreateMandate}>
          {isLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.ctaBtnTxt}>Setting up mandate...</Text>
            </View>
          ) : (
            <Text style={styles.ctaBtnTxt}>Setup Mandate & Continue →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3EF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#FFFDF9', borderBottomWidth: 0.5, borderBottomColor: '#E8E4DC' },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#532ea6', fontSize: 22, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1512' },
  stepTracker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF9', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#E8E4DC' },
  stepItem: { alignItems: 'center', gap: 6, flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0EDE6', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8E4DC' },
  stepDotActive: { backgroundColor: '#ff6500', borderColor: '#ff6500' },
  stepDotDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepDotTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stepLbl: { fontSize: 9, color: '#A89F95', fontWeight: '600', textAlign: 'center' },
  stepLblActive: { color: '#ff6500' },
  stepLine: { flex: 1, height: 1.5, backgroundColor: '#E8E4DC', marginBottom: 16 },
  stepLineDone: { backgroundColor: '#10b981' },
  summaryCard: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 20, borderWidth: 0.5, borderColor: '#E8E4DC', gap: 12 },
  cardLbl: { fontSize: 10, fontWeight: '700', color: '#A89F95', letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLbl: { fontSize: 13, color: '#7C766E', flex: 1 },
  summaryVal: { fontSize: 13, fontWeight: '600', color: '#1A1512', flex: 1, textAlign: 'right' },
  explainCard: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 20, borderWidth: 0.5, borderColor: '#E8E4DC', gap: 10 },
  explainTitle: { fontSize: 14, fontWeight: '700', color: '#1A1512' },
  explainTxt: { fontSize: 13, color: '#4A4540', lineHeight: 22 },
  explainPoints: { gap: 6 },
  explainPoint: { fontSize: 12, color: '#532ea6', fontWeight: '500' },
  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, backgroundColor: '#FFFDF9', borderTopWidth: 0.5, borderTopColor: '#E8E4DC' },
  ctaBtn: { backgroundColor: '#ff6500', borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaBtnDisabled: { backgroundColor: '#E8E4DC' },
  ctaBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFDF9', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44, alignItems: 'center' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E8E4DC', borderRadius: 2, marginBottom: 20 },
  modalEmoji: { fontSize: 44, marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1A1512', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#7C766E', lineHeight: 22, textAlign: 'center', marginBottom: 18 },
  modalInfo: { width: '100%', backgroundColor: '#F5F3EF', borderRadius: 12, padding: 16, gap: 8, marginBottom: 20 },
  modalInfoLine: { fontSize: 13, color: '#4A4540', lineHeight: 22 },
  openLinkBtn: { width: '100%', backgroundColor: '#532ea6', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  openLinkTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noLinkBox: { width: '100%', backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, marginBottom: 10 },
  noLinkTxt: { fontSize: 13, color: '#ff6500', textAlign: 'center' },
  modalNote: { fontSize: 11, color: '#A89F95', textAlign: 'center', marginBottom: 16 },
  doneBtn: { width: '100%', backgroundColor: '#10b981', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 8 },
  doneBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  laterBtn: { padding: 8 },
  laterTxt: { fontSize: 13, color: '#A89F95' },
});

export default SIPMandateScreen;