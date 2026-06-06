import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Linking, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { NSE_SERVICE_URL } from '../../../../src/config/services';

const SIPConfirmScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fundName    = decodeURIComponent(params.fundName || '');
  const amount      = parseInt(params.amount || 0);
  const schemeCode  = params.schemeCode || '';
  const tenureMonths= parseInt(params.tenureMonths || 36);
  const tenureLabel = decodeURIComponent(params.tenureLabel || '');
  const mandateId   = params.mandateId || '';

  const [isLoading, setIsLoading] = useState(false);
  const [sipLink, setSipLink]     = useState('');
  const [sipRegId, setSipRegId]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError]         = useState('');

  const handleRegisterSIP = async () => {
    try {
      setIsLoading(true);
      setError('');
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) throw new Error('Session expired');

      const docSnap = await getDoc(doc(db, 'mf_onboarding', phone));
      if (!docSnap.exists()) throw new Error('User data not found');
      const data = docSnap.data();

      const ucc     = data.ucc_code;
      const mId     = mandateId || data.mandate_id || '';

      // SIP start date — 1st of next month
      const today  = new Date();
      const sipStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      const startDate = fmt(sipStart);
      const endDate   = tenureMonths > 0
        ? fmt(new Date(sipStart.getFullYear() + Math.floor(tenureMonths/12), sipStart.getMonth() + (tenureMonths%12), 1))
        : '31/12/2099';

      console.log('📋 Registering SIP:', { ucc, schemeCode, amount, startDate, endDate });

      // SIP fields — verified from NSE API doc page 25-29
      // trans_mode P = Physical, dp_txn_mode P = Physical
      // installment_no = number of months, frequency_allowed always "1"
      // amc_code and sch_code come from scheme master (hardcoded for UAT)
      const sipPayload = {
        amc_code:           'PPFASMUTUALFUND_MF', // ← get from scheme master for real funds
        sch_code:           schemeCode,
        client_code:        ucc,
        internal_ref_no:    `SIP${Date.now()}`,
        trans_mode:         'P',                  // P = Physical (non-demat)
        dp_txn_mode:        'P',                  // P = Physical
        start_date:         startDate,
        frequency_type:     'MONTHLY',
        frequency_allowed:  '1',                  // 1 = Rolling, always 1
        installment_amount: String(amount),
        status:             '1',                  // 1 = Active
        member_code:        process.env.NSE_MEMBER_CODE || '',
        folio_no:           '',
        sip_remarks:        `SIP for ${fundName}`,
        installment_no:     String(tenureMonths > 0 ? tenureMonths : 999),
        sip_mandate_id:     mId,                  // approved mandate id
        sub_broker_code:    '',
        euin_number:        '',
        euin_declaration:   'N',                  // N = no EUIN (direct plan)
        dpc_flag:           'Y',
        first_order_today:  'N',
        sub_broker_arn:     '',
        end_date:           tenureMonths > 0 ? endDate : '',
        primary_holder_mobile: String(phone).replace(/\D/g, '').slice(-10),
        primary_holder_email:  data.email_data?.email || '',
        step_up_required:   'N',
        filler_1: '', filler_2: '', filler_3: '', filler_4: '', filler_5: '',
      };

      const res = await fetch(`${NSE_SERVICE_URL}/api/nse/sip-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg_data: [sipPayload] }),
      });

      const resData = await res.json();
      console.log('📋 SIP register response:', JSON.stringify(resData));

      const result = resData?.reg_data?.[0];
      if (!res.ok || result?.reg_status === 'REG_FAILED') {
        throw new Error(`SIP registration failed: ${result?.reg_remark || resData?.error || 'Unknown'}`);
      }

      const sId = result?.reg_id || '';
      setSipRegId(sId);
      console.log('✅ SIP registered, id:', sId);

      // Get SIP auth link
      await new Promise(r => setTimeout(r, 2000));
      const linkRes = await fetch(`${NSE_SERVICE_URL}/api/nse/get-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType: 'SIP_REG', productRefId: sId }),
      });
      const linkData = await linkRes.json();
      const sLink = linkData?.firstHolderLink || '';
      setSipLink(sLink);

      // Save to Firestore
      await updateDoc(doc(db, 'mf_onboarding', phone), {
        [`sip_mandates.${sId}`]: {
          sip_reg_id:   sId,
          scheme_code:  schemeCode,
          fund_name:    fundName,
          amount:       amount,
          tenure:       tenureLabel,
          start_date:   startDate,
          end_date:     endDate,
          mandate_id:   mId,
          sip_link:     sLink,
          status:       'PENDING_AUTH',
          created_at:   new Date().toISOString(),
        },
      });

      setShowModal(true);

    } catch (err) {
      console.error('❌ SIP error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* SIP Auth Modal */}
      <Modal visible={showModal} transparent animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>SIP Registered!</Text>
            <Text style={styles.modalSub}>
              Your SIP has been registered with NSE. Tap below to authorize it — this is the final step.
            </Text>
            <View style={styles.successSteps}>
              <Text style={styles.successStep}>✅ Mandate setup complete</Text>
              <Text style={styles.successStep}>✅ SIP registered with NSE</Text>
              <Text style={styles.successStep}>⏳ SIP authorization pending</Text>
            </View>
            {sipLink ? (
              <TouchableOpacity style={styles.authBtn}
                onPress={() => Linking.openURL(sipLink)}>
                <Text style={styles.authBtnTxt}>🔗 Authorize SIP on NSE →</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noLinkBox}>
                <Text style={styles.noLinkTxt}>Check your email from NSE for the authorization link.</Text>
              </View>
            )}
            <Text style={styles.modalNote}>
              After authorizing, your SIP starts on {'\n'}1st of next month automatically.
            </Text>
            <TouchableOpacity style={styles.doneBtn}
              onPress={() => {
                setShowModal(false);
                router.replace('/(gowealthy)/mf/trading/funds');
              }}>
              <Text style={styles.doneBtnTxt}>✅ Done — Go to My Funds</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm SIP</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 120 }}>

        {/* Final summary */}
        <View style={styles.bigSummary}>
          <Text style={styles.bigAmount}>₹{amount.toLocaleString()}</Text>
          <Text style={styles.bigAmtSub}>per month</Text>
          <Text style={styles.bigFundName}>{fundName}</Text>
          <View style={styles.tenurePill}>
            <Text style={styles.tenurePillTxt}>{tenureLabel}</Text>
          </View>
        </View>

        {/* Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardLbl}>SIP DETAILS</Text>
          {[
            ['Scheme Code', schemeCode],
            ['Monthly SIP', `₹${amount.toLocaleString()}`],
            ['Duration', tenureLabel],
            ['SIP Date', '1st of every month'],
            ['Mandate ID', mandateId || 'From onboarding'],
            ['Payment', 'Auto-debit (eNACH)'],
          ].map(([l, v]) => (
            <View key={l} style={styles.row}>
              <Text style={styles.rowLbl}>{l}</Text>
              <Text style={styles.rowVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* What happens next */}
        <View style={styles.card}>
          <Text style={styles.cardLbl}>WHAT HAPPENS NEXT</Text>
          {[
            ['NSE registers your SIP', '✅ Done after you tap below'],
            ['Authorize on NSE portal', '⏳ Open link & confirm'],
            ['SIP starts', '📅 1st of next month'],
            ['Monthly auto-debit', '🔁 Ongoing until tenure ends'],
          ].map(([title, sub]) => (
            <View key={title} style={styles.nextRow}>
              <View>
                <Text style={styles.nextTitle}>{title}</Text>
                <Text style={styles.nextSub}>{sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ Error</Text>
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}

      </ScrollView>

      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, isLoading && styles.ctaBtnDisabled]}
          disabled={isLoading}
          onPress={handleRegisterSIP}>
          {isLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.ctaBtnTxt}>Registering SIP...</Text>
            </View>
          ) : (
            <Text style={styles.ctaBtnTxt}>🚀 Start My SIP</Text>
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
  bigSummary: { backgroundColor: '#1A1512', borderRadius: 24, padding: 28, alignItems: 'center', gap: 6 },
  bigAmount: { fontSize: 48, fontWeight: '800', color: '#ff6500' },
  bigAmtSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: -4 },
  bigFundName: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center', marginTop: 8 },
  tenurePill: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  tenurePillTxt: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  card: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 20, borderWidth: 0.5, borderColor: '#E8E4DC', gap: 12 },
  cardLbl: { fontSize: 10, fontWeight: '700', color: '#A89F95', letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
  rowLbl: { fontSize: 13, color: '#7C766E' },
  rowVal: { fontSize: 13, fontWeight: '600', color: '#1A1512' },
  nextRow: { paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
  nextTitle: { fontSize: 13, fontWeight: '600', color: '#1A1512' },
  nextSub: { fontSize: 11, color: '#A89F95', marginTop: 2 },
  errorCard: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FCA5A5' },
  errorTitle: { fontSize: 13, fontWeight: '700', color: '#ef4444', marginBottom: 4 },
  errorTxt: { fontSize: 12, color: '#ef4444', lineHeight: 18 },
  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 34, backgroundColor: '#FFFDF9', borderTopWidth: 0.5, borderTopColor: '#E8E4DC' },
  ctaBtn: { backgroundColor: '#ff6500', borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaBtnDisabled: { backgroundColor: '#E8E4DC' },
  ctaBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFDF9', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44, alignItems: 'center' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E8E4DC', borderRadius: 2, marginBottom: 20 },
  modalEmoji: { fontSize: 52, marginBottom: 10 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1A1512', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#7C766E', lineHeight: 22, textAlign: 'center', marginBottom: 18 },
  successSteps: { width: '100%', backgroundColor: '#F5F3EF', borderRadius: 14, padding: 16, gap: 10, marginBottom: 20 },
  successStep: { fontSize: 13, color: '#1A1512', fontWeight: '500' },
  authBtn: { width: '100%', backgroundColor: '#532ea6', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  authBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noLinkBox: { width: '100%', backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, marginBottom: 10 },
  noLinkTxt: { fontSize: 13, color: '#ff6500', textAlign: 'center' },
  modalNote: { fontSize: 11, color: '#A89F95', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  doneBtn: { width: '100%', backgroundColor: '#10b981', borderRadius: 14, padding: 14, alignItems: 'center' },
  doneBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default SIPConfirmScreen;