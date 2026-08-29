import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../src/config/firebase';
import { NSE_SERVICE_URL } from '../../../../src/config/services';
import { refreshUccActivation } from '../../../../src/lib/ucc';

const valueOf = (value, fallback = '') => Array.isArray(value) ? value[0] : (value ?? fallback);
const getPhone = async () => {
  const raw = await AsyncStorage.getItem('user_phone') || await AsyncStorage.getItem('userPhone') || await AsyncStorage.getItem('phone');
  return raw ? String(raw).replace(/\D/g, '').slice(-10) : '';
};
const dateText = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

export default function SIPMandateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fundName = valueOf(params.fundName, 'Selected scheme');
  const schemeCode = valueOf(params.schemeCode);
  const amcCode = valueOf(params.amcCode, '360_ONE_MUTUALFUND_MF');
  const amount = Number(valueOf(params.amount, 0));
  const tenureMonths = Number(valueOf(params.tenureMonths, 36));
  const tenureLabel = valueOf(params.tenureLabel, '3 years');
  const purchaseOrderId = valueOf(params.purchaseOrderId);
  const [loading, setLoading] = useState(false);
  const [mandateId, setMandateId] = useState('');
  const [mandateLink, setMandateLink] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [authStatusRaw, setAuthStatusRaw] = useState('');
  const [authLink, setAuthLink] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [error, setError] = useState('');

  const logActivity = useCallback((stage, details = {}) => {
    console.log(`[MF][Mandate][${stage}]`, details);
  }, []);

  const requestAuthLink = useCallback(async (clientCode) => {
    logActivity('UCC_AUTH_LINK_REQUEST_START', { clientCode });
    const authLinkResponse = await fetch(`${NSE_SERVICE_URL}/api/nse/get-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType: 'CL_ACT', productRefId: clientCode }),
    });
    const authLinkData = await authLinkResponse.json().catch(() => ({}));
    const refreshedAuthLink = authLinkData?.firstHolderLink || '';
    setAuthLink(refreshedAuthLink);
    logActivity('UCC_AUTH_LINK_RESULT', {
      httpStatus: authLinkResponse.status,
      ok: authLinkResponse.ok,
      hasLink: Boolean(refreshedAuthLink),
      error: authLinkData?.errorMessage || authLinkData?.error,
    });
    if (!authLinkResponse.ok || !refreshedAuthLink) {
      throw new Error(authLinkData?.errorMessage || authLinkData?.error || 'NSE did not return an authorization link.');
    }
    return refreshedAuthLink;
  }, [logActivity]);

  const loadAuthorization = useCallback(async () => {
    try {
      setAuthLoading(true);
      setAuthError('');
      const phone = await getPhone();
      if (!phone) throw new Error('Session expired. Please log in again.');
      const snapshot = await getDoc(doc(db, 'mf_onboarding', phone));
      if (!snapshot.exists()) throw new Error('Onboarding data not found.');
      const data = snapshot.data();
      const currentClientCode = data.ucc_code;
      if (!currentClientCode) throw new Error('NSE client code is missing.');
      setClientCode(currentClientCode);
      const savedAuthLink = data.ucc_auth_link || '';
      setAuthLink(savedAuthLink);
      const status = await refreshUccActivation(phone);
      setAuthStatus(status.status);
      setAuthStatusRaw(status.authStatusRaw || 'No NSE authorization row');
      if (!status.authorized && !savedAuthLink && ['PENDING', 'NOT_FOUND'].includes(status.status)) {
        await requestAuthLink(currentClientCode);
      }
      logActivity('AUTHORIZATION_PAGE_READY', {
        clientCode: currentClientCode,
        status: status.status,
        authorized: status.authorized,
        hasLink: Boolean(savedAuthLink),
      });
    } catch (err) {
      setAuthError(err.message || 'Could not prepare NSE authorization.');
      logActivity('AUTHORIZATION_PAGE_FAILED', { error: err.message });
    } finally {
      setAuthLoading(false);
    }
  }, [logActivity, requestAuthLink]);

  useEffect(() => {
    const timer = setTimeout(() => { loadAuthorization(); }, 0);
    return () => clearTimeout(timer);
  }, [loadAuthorization]);

  const createMandate = async () => {
    try {
      setLoading(true);
      setError('');
      setAuthStatus('');
      logActivity('START', { schemeCode, amount, tenureMonths });
      const phone = await getPhone();
      if (!phone) throw new Error('Session expired. Please log in again.');
      logActivity('PHONE_RESOLVED', { phoneLast4: phone.slice(-4) });
      const snapshot = await getDoc(doc(db, 'mf_onboarding', phone));
      if (!snapshot.exists()) throw new Error('Onboarding data not found.');
      const data = snapshot.data();
      const clientCode = data.ucc_code;
      const accountNo = data.bank_data?.account_no;
      const ifsc = data.bank_data?.ifsc_code;
      if (!clientCode || !accountNo || !ifsc) throw new Error('UCC or bank details are missing.');
      setClientCode(clientCode);
      const savedAuthLink = data.ucc_auth_link || '';
      setAuthLink(savedAuthLink);
      logActivity('FIRESTORE_LOADED', {
        clientCode,
        uccRegistered: Boolean(data.ucc_registered),
        uccAuthorizedStored: Boolean(data.ucc_authorized),
        accountLast4: String(accountNo).slice(-4),
        ifsc,
      });

      logActivity('UCC_STATUS_CHECK_START', { clientCode });
      const uccStatus = await refreshUccActivation(phone);
      setAuthStatus(uccStatus.status);
      setAuthStatusRaw(uccStatus.authStatusRaw || 'No NSE authorization row');
      logActivity('UCC_STATUS_CHECK_RESULT', {
        clientCode,
        status: uccStatus.status,
        authorized: uccStatus.authorized,
        authStatusRaw: uccStatus.authStatusRaw,
      });
      if (!uccStatus.authorized) {
        if (!savedAuthLink && ['PENDING', 'NOT_FOUND'].includes(uccStatus.status)) {
          await requestAuthLink(clientCode);
        }
        throw new Error(`Client code ${clientCode} is ${uccStatus.status}. Complete the NSE investor authorization first, then retry mandate registration.`);
      }

      const start = new Date();
      const end = new Date(start.getFullYear() + 30, start.getMonth(), start.getDate());
      const mandatePayload = {
        client_code: clientCode,
        amount: String(Math.max(amount, 99999)),
        mandate_type: 'E',
        account_no: accountNo,
        ac_type: data.bank_data?.account_type || 'SB',
        ifsc_code: ifsc,
        micr_no: '',
        start_date: dateText(start),
        end_date: dateText(end),
      };
      logActivity('MANDATE_REQUEST_START', {
        endpoint: '/api/nse/mandate-register',
        clientCode,
        amount: mandatePayload.amount,
        mandateType: mandatePayload.mandate_type,
        accountLast4: String(accountNo).slice(-4),
        ifsc,
      });
      const response = await fetch(`${NSE_SERVICE_URL}/api/nse/mandate-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg_data: [mandatePayload] }),
      });
      const resultData = await response.json();
      const result = resultData?.reg_data?.[0];
      logActivity('MANDATE_REQUEST_RESULT', {
        httpStatus: response.status,
        ok: response.ok,
        regStatus: result?.reg_status,
        regId: result?.reg_id,
        error: result?.reg_remark || resultData?.error,
      });
      if (!response.ok || result?.reg_status === 'REG_FAILED') throw new Error(result?.reg_remark || resultData?.error || 'Mandate registration failed.');

      const id = result?.reg_id;
      if (!id) throw new Error('NSE did not return a mandate ID.');
      const linkResponse = await fetch(`${NSE_SERVICE_URL}/api/nse/get-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType: 'MANDATE_AUTH', productRefId: id }),
      });
      const linkData = await linkResponse.json();
      const link = linkData?.firstHolderLink || '';
      logActivity('MANDATE_LINK_RESULT', { httpStatus: linkResponse.status, ok: linkResponse.ok, hasLink: Boolean(link), error: linkData?.errorMessage || linkData?.error });
      await updateDoc(snapshot.ref, {
        mandate_id: id,
        mandate_link: link,
        mandate_status: 'PENDING',
        first_purchase_order_id: purchaseOrderId || data.first_purchase_order_id || '',
      });
      logActivity('FIRESTORE_UPDATED', { mandateId: id, mandateStatus: 'PENDING' });
      setMandateId(id);
      setMandateLink(link);
    } catch (err) {
      logActivity('FAILED', { error: err.message });
      setError(err.message || 'Could not register mandate.');
    } finally {
      setLoading(false);
    }
  };

  const continueToSIP = () => {
    router.push(`/(gowealthy)/mf/trading/sip-confirm?schemeCode=${encodeURIComponent(schemeCode)}&amcCode=${encodeURIComponent(amcCode)}&fundName=${encodeURIComponent(fundName)}&amount=${amount}&tenureMonths=${tenureMonths}&tenureLabel=${encodeURIComponent(tenureLabel)}&mandateId=${encodeURIComponent(mandateId)}&purchaseOrderId=${encodeURIComponent(purchaseOrderId)}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Authorize mandate</Text><View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}><Text style={styles.heroKicker}>SIP SETUP</Text><Text style={styles.heroTitle}>{fundName}</Text><Text style={styles.heroMeta}>₹{amount.toLocaleString('en-IN')} monthly · {tenureLabel}</Text></View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bank mandate required</Text>
          <Text style={styles.body}>NSE needs one-time permission to debit your linked bank account for each SIP installment.</Text>
          <View style={styles.rows}><Text style={styles.row}>• eNACH mandate through NSE</Text><Text style={styles.row}>• Maximum debit: ₹99,999 per installment</Text><Text style={styles.row}>• Your SIP starts after authorization</Text></View>
        </View>
        {mandateId ? (
          <View style={styles.success}><Text style={styles.successTitle}>Mandate registered</Text><Text style={styles.successText}>Mandate ID: {mandateId}</Text></View>
        ) : null}
        <View style={styles.authBox}>
          <Text style={styles.authTitle}>NSE investor authorization{authStatus ? `: ${authStatus}` : ''}</Text>
          {clientCode ? <Text style={styles.authCode}>Client code: {clientCode}</Text> : null}
          {authStatusRaw ? <Text style={styles.authRaw}>NSE response: {authStatusRaw}</Text> : null}
          <Text style={styles.authDescription}>Complete this authorization before registering your bank mandate.</Text>
          {authLink ? (
            <TouchableOpacity onPress={() => Linking.openURL(authLink)} style={styles.authButton}>
              <Text style={styles.authLink}>Authorize client code on NSE</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity disabled={authLoading} onPress={loadAuthorization} style={styles.authButton}>
              <Text style={styles.authLink}>{authLoading ? 'Preparing authorization link...' : 'Get NSE authorization link'}</Text>
            </TouchableOpacity>
          )}
          {authError ? <Text style={styles.authError}>{authError}</Text> : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mandateLink ? <TouchableOpacity onPress={() => Linking.openURL(mandateLink)} style={styles.linkButton}><Text style={styles.linkText}>Open NSE mandate authorization</Text></TouchableOpacity> : null}
        <TouchableOpacity disabled={loading} onPress={mandateId ? continueToSIP : createMandate} style={styles.primary}>
          {loading ? <ActivityIndicator color="#FFFDF8" /> : <Text style={styles.primaryText}>{mandateId ? 'Continue to SIP registration' : 'Register mandate with NSE'}</Text>}
        </TouchableOpacity>
        {mandateId ? <Text style={styles.note}>Authorize the mandate first, then continue to register the SIP.</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F2EA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54, paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#FFFDF8', borderBottomWidth: 1, borderBottomColor: '#E4E6DE' },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, backText: { color: '#17352B', fontSize: 34, lineHeight: 30 }, headerTitle: { color: '#17352B', fontSize: 17, fontWeight: '800' }, headerSpacer: { width: 36 },
  content: { padding: 18, paddingBottom: 50, gap: 13 },
  hero: { backgroundColor: '#17352B', borderRadius: 17, padding: 18 }, heroKicker: { color: '#91D2B5', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 }, heroTitle: { color: '#FFFDF8', fontSize: 19, fontWeight: '800', lineHeight: 25 }, heroMeta: { color: '#B6D4C5', fontSize: 12, marginTop: 8 },
  card: { backgroundColor: '#FFFDF8', borderRadius: 17, padding: 18, borderWidth: 1, borderColor: '#E2E5DD' }, cardTitle: { color: '#17352B', fontSize: 16, fontWeight: '800', marginBottom: 8 }, body: { color: '#66736B', fontSize: 13, lineHeight: 20 }, rows: { marginTop: 14, gap: 9 }, row: { color: '#4F7565', fontSize: 12 },
  success: { backgroundColor: '#E5F2E9', borderRadius: 15, padding: 16 }, successTitle: { color: '#176B50', fontSize: 14, fontWeight: '800' }, successText: { color: '#4F7565', fontSize: 12, marginTop: 5 }, error: { color: '#C04B48', fontSize: 13, lineHeight: 19 },
  authBox: { backgroundColor: '#FFF4D6', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#F1D58A' }, authTitle: { color: '#795E17', fontSize: 13, fontWeight: '800' }, authCode: { color: '#795E17', fontSize: 12, fontWeight: '700', marginTop: 7 }, authRaw: { color: '#8A7027', fontSize: 11, lineHeight: 16, marginTop: 5 }, authDescription: { color: '#8A7027', fontSize: 12, lineHeight: 18, marginTop: 6 }, authButton: { marginTop: 10 }, authLink: { color: '#07805E', fontSize: 12, fontWeight: '800' }, authError: { color: '#C04B48', fontSize: 12, lineHeight: 17, marginTop: 8 },
  linkButton: { borderWidth: 1, borderColor: '#07805E', borderRadius: 13, padding: 14, alignItems: 'center' }, linkText: { color: '#07805E', fontSize: 13, fontWeight: '800' }, primary: { backgroundColor: '#07805E', borderRadius: 13, padding: 16, alignItems: 'center' }, primaryText: { color: '#FFFDF8', fontSize: 14, fontWeight: '800' }, note: { color: '#8C9890', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
