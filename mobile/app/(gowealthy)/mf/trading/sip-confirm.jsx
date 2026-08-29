import React, { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../src/config/firebase';
import { NSE_SERVICE_URL } from '../../../../src/config/services';

const valueOf = (value, fallback = '') => Array.isArray(value) ? value[0] : (value ?? fallback);
const dateText = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

export default function SIPConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fundName = valueOf(params.fundName, 'Selected scheme');
  const schemeCode = valueOf(params.schemeCode);
  const amcCode = valueOf(params.amcCode, '360_ONE_MUTUALFUND_MF');
  const amount = Number(valueOf(params.amount, 0));
  const tenureMonths = Number(valueOf(params.tenureMonths, 36));
  const tenureLabel = valueOf(params.tenureLabel, '3 years');
  const mandateId = valueOf(params.mandateId);
  const purchaseOrderId = valueOf(params.purchaseOrderId);
  const [loading, setLoading] = useState(false);
  const [sipId, setSipId] = useState('');
  const [sipLink, setSipLink] = useState('');
  const [error, setError] = useState('');

  const registerSIP = async () => {
    try {
      setLoading(true);
      setError('');
      const phoneRaw = await AsyncStorage.getItem('user_phone');
      const phone = phoneRaw ? String(phoneRaw).replace(/\D/g, '').slice(-10) : '';
      if (!phone) throw new Error('Session expired. Please log in again.');
      const snapshot = await getDoc(doc(db, 'mf_onboarding', phone));
      if (!snapshot.exists()) throw new Error('Onboarding data not found.');
      const data = snapshot.data();
      const clientCode = data.ucc_code;
      if (!clientCode) throw new Error('UCC code is missing. Complete onboarding first.');
      const mandate = mandateId || data.mandate_id;
      if (!mandate) throw new Error('Mandate ID is missing. Register the mandate first.');
      const purchaseOrder = purchaseOrderId || data.first_purchase_order_id;
      if (!purchaseOrder) throw new Error('Purchase order ID is missing. Start the SIP flow again.');

      // NSE enforces a minimum gap between registering a SIP and its first
      // installment ("START DATE IS BEFORE MINIMUM DAYS FROM REGISTRATION").
      // Registering late in a month puts the 1st of next month inside that
      // window, so skip to the 1st of the month after when it's too close.
      const MIN_START_GAP_DAYS = 7;
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      if ((startDate - today) / 86400000 < MIN_START_GAP_DAYS) {
        startDate.setMonth(startDate.getMonth() + 1);
      }
      const payload = {
        amc_code: amcCode,
        sch_code: schemeCode,
        client_code: clientCode,
        internal_ref_no: `SIP${Date.now()}`,
        trans_mode: 'P',
        dp_txn_mode: 'P',
        start_date: dateText(startDate),
        frequency_type: 'MONTHLY',
        frequency_allowed: '1',
        installment_amount: String(amount),
        status: '1',
        member_code: '',
        folio_no: '',
        sip_remarks: `SIP for ${fundName}`,
        installment_no: String(tenureMonths > 0 ? tenureMonths : 999),
        // Spec p.26: sip_mandate_id is Optional, but "Must be approved mandate".
        // The mandate was registered seconds ago and is still PENDING approval,
        // so sending it here is what NSE rejects. Register the SIP without it and
        // attach the mandate once approved via the SIPUMRN API (spec p.77).
        sip_mandate_id: '',
        euin_number: '',
        euin_declaration: 'N',
        dpc_flag: 'Y',
        first_order_today: 'N',
        sub_broker_code: '',
        sub_broker_arn: '',
        // Spec p.27: end_date is "Mandatory in case of DAILY frequency. Must be
        // blank in case of frequency other than DAILY." This is MONTHLY.
        end_date: '',
        primary_holder_mobile: phone,
        primary_holder_email: data.email_data?.email || '',
      };

      const response = await fetch(`${NSE_SERVICE_URL}/api/nse/sip-register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reg_data: [payload] }),
      });
      const responseData = await response.json();
      const result = responseData?.reg_data?.[0];
      if (!response.ok || result?.reg_status === 'REG_FAILED') throw new Error(result?.reg_remark || responseData?.error || 'SIP registration failed.');
      const id = result?.reg_id;
      if (!id) throw new Error('NSE did not return a SIP registration ID.');

      const linkResponse = await fetch(`${NSE_SERVICE_URL}/api/nse/get-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productType: 'SIP_REG', productRefId: id }),
      });
      const linkData = await linkResponse.json();
      const link = linkData?.firstHolderLink || '';
      await updateDoc(snapshot.ref, { [`sip_mandates.${id}`]: { sip_reg_id: id, purchase_order_id: purchaseOrder, scheme_code: schemeCode, fund_name: fundName, amount, tenure: tenureLabel, mandate_id: mandate, sip_link: link, status: 'PENDING_AUTH', created_at: new Date().toISOString() } });
      setSipId(id);
      setSipLink(link);
    } catch (err) {
      setError(err.message || 'Could not register SIP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity><Text style={styles.headerTitle}>Confirm SIP</Text><View style={styles.headerSpacer} /></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}><Text style={styles.kicker}>FINAL STEP</Text><Text style={styles.heroTitle}>Register your SIP</Text><Text style={styles.heroMeta}>{fundName}</Text></View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SIP summary</Text>
          {[['Scheme code', schemeCode], ['Monthly amount', `₹${amount.toLocaleString('en-IN')}`], ['Duration', tenureLabel], ['Frequency', 'Monthly'], ['Mandate', mandateId || 'Registered mandate']].map(([label, value]) => <View style={styles.row} key={label}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>)}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sipId ? <View style={styles.success}><Text style={styles.successTitle}>SIP registered with NSE</Text><Text style={styles.successText}>Registration ID: {sipId}</Text></View> : null}
        {sipLink ? <TouchableOpacity onPress={() => Linking.openURL(sipLink)} style={styles.linkButton}><Text style={styles.linkText}>Open SIP authorization link</Text></TouchableOpacity> : null}
        <TouchableOpacity disabled={loading} onPress={sipId ? () => router.replace('/(gowealthy)/mf/trading/funds') : registerSIP} style={styles.primary}>
          {loading ? <ActivityIndicator color="#FFFDF8" /> : <Text style={styles.primaryText}>{sipId ? 'Done' : 'Register SIP with NSE'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F2EA' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54, paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#FFFDF8', borderBottomWidth: 1, borderBottomColor: '#E4E6DE' }, back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, backText: { color: '#17352B', fontSize: 34, lineHeight: 30 }, headerTitle: { color: '#17352B', fontSize: 17, fontWeight: '800' }, headerSpacer: { width: 36 },
  content: { padding: 18, paddingBottom: 50, gap: 13 }, hero: { backgroundColor: '#17352B', borderRadius: 17, padding: 18 }, kicker: { color: '#91D2B5', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 }, heroTitle: { color: '#FFFDF8', fontSize: 20, fontWeight: '800' }, heroMeta: { color: '#B6D4C5', fontSize: 12, marginTop: 8 },
  card: { backgroundColor: '#FFFDF8', borderRadius: 17, padding: 18, borderWidth: 1, borderColor: '#E2E5DD' }, cardTitle: { color: '#17352B', fontSize: 16, fontWeight: '800', marginBottom: 11 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDF0E9' }, rowLabel: { color: '#8C9890', fontSize: 12 }, rowValue: { flex: 1, color: '#17352B', fontSize: 12, fontWeight: '800', textAlign: 'right' },
  success: { backgroundColor: '#E5F2E9', borderRadius: 15, padding: 16 }, successTitle: { color: '#176B50', fontSize: 14, fontWeight: '800' }, successText: { color: '#4F7565', fontSize: 12, marginTop: 5 }, error: { color: '#C04B48', fontSize: 13, lineHeight: 19 }, linkButton: { borderWidth: 1, borderColor: '#07805E', borderRadius: 13, padding: 14, alignItems: 'center' }, linkText: { color: '#07805E', fontSize: 13, fontWeight: '800' }, primary: { backgroundColor: '#07805E', borderRadius: 13, padding: 16, alignItems: 'center' }, primaryText: { color: '#FFFDF8', fontSize: 14, fontWeight: '800' },
});
