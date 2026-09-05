import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../src/config/firebase';
import { NSE_SERVICE_URL } from '../../../../src/config/services';
import { awardBadge, classifyFund } from '../../../../src/lib/xpBadges';
import { celebratePayment } from '../../../../src/components/XPCelebration';
import { getPurchasePaymentLink, cancelPurchaseOrder } from '../../../../src/lib/payment';

const readPhone = async () => {
  const raw = await AsyncStorage.getItem('user_phone')
    || await AsyncStorage.getItem('userPhone')
    || await AsyncStorage.getItem('phone');
  return raw ? String(raw).replace(/\D/g, '').slice(-10) : '';
};

const DURATIONS = [
  { label: '1 year', months: 12 },
  { label: '3 years', months: 36 },
  { label: '5 years', months: 60 },
  { label: 'Ongoing', months: 0 },
];

const valueOf = (value, fallback = '') => Array.isArray(value) ? value[0] : (value ?? fallback);

export default function SIPAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fundName = valueOf(params.fundName, 'Selected scheme');
  const schemeCode = valueOf(params.schemeCode);
  const amcCode = valueOf(params.amcCode, '360_ONE_MUTUALFUND_MF');
  const minSIP = Number(valueOf(params.minSIP, 1000)) || 1000;
  const [amount, setAmount] = useState(String(minSIP));
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Set once the order exists, which switches the screen into its "pay" stage.
  const [order, setOrder] = useState({ id: '', paymentLink: '' });
  const [paymentOpened, setPaymentOpened] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const numericAmount = Number(amount) || 0;
  const isValid = numericAmount >= minSIP;

  // An unpaid order from a previous visit is still live at NSE. Reuse it rather
  // than creating a second one, otherwise abandoning the payment page and
  // coming back leaves the investor owing two installments for one SIP.
  useEffect(() => {
    let active = true;
    (async () => {
      const phone = await readPhone();
      if (!phone || !active) return;
      const snapshot = await getDoc(doc(db, 'mf_onboarding', phone));
      const data = snapshot.data() || {};
      const pending = data.first_purchase_payment_status === 'PENDING'
        && data.first_purchase_order_scheme === schemeCode
        && data.first_purchase_order_id;
      if (!active || !pending) return;
      setOrder({ id: data.first_purchase_order_id, paymentLink: data.first_purchase_payment_link || '' });
      if (data.first_purchase_order_amount) setAmount(String(data.first_purchase_order_amount));
      console.log('[MF][Purchase] reusing unpaid order', { orderId: data.first_purchase_order_id });
    })();
    return () => { active = false; };
  }, [schemeCode]);

  const createPurchaseOrder = async () => {
    if (!isValid || loading) return;
    try {
      setLoading(true);
      setError('');
      const rawPhone = await AsyncStorage.getItem('user_phone')
        || await AsyncStorage.getItem('userPhone')
        || await AsyncStorage.getItem('phone');
      const phone = rawPhone ? String(rawPhone).replace(/\D/g, '').slice(-10) : '';
      if (!phone) throw new Error('Session expired. Please log in again.');

      const snapshot = await getDoc(doc(db, 'mf_onboarding', phone));
      if (!snapshot.exists()) throw new Error('Onboarding data not found.');
      const data = snapshot.data();
      const clientCode = data.ucc_code;
      if (!clientCode) throw new Error('NSE client code is missing. Complete onboarding first.');

      const euinNumber = data.euin_number || '';
      const euinDeclaration = data.euin_declaration || (euinNumber ? 'Y' : 'N');
      const memberUniqueId = `MUPUR${Date.now()}`.slice(0, 20);
      const orderPayload = {
        order_ref_number: `PUR${Date.now()}`.slice(0, 19),
        scheme_code: schemeCode,
        trxn_type: 'P',
        buy_sell_type: 'FRESH',
        client_code: clientCode,
        demat_physical: data.demat_physical || 'P',
        order_amount: String(numericAmount),
        folio_no: data.folio_no || '',
        remarks: `First purchase for ${fundName}`.slice(0, 200),
        kyc_flag: data.kyc_flag || 'Y',
        sub_broker_code: data.sub_broker_code || '',
        euin_number: euinNumber,
        euin_declaration: euinDeclaration,
        min_redemption_flag: 'N',
        dpc_flag: 'Y',
        all_units: 'N',
        redemption_units: '',
        sub_broker_arn: data.sub_broker_arn || '',
        bank_ref_no: '',
        account_no: data.bank_data?.account_no || '',
        mobile_no: phone,
        email: data.email_data?.email || '',
        mandate_id: '',
        filler1: '',
        member_unique_id: memberUniqueId,
      };

      console.log('[MF][Purchase][ORDER_START]', {
        clientCode,
        schemeCode,
        amount: orderPayload.order_amount,
        memberUniqueId,
      });
      const response = await fetch(`${NSE_SERVICE_URL}/api/nse/order-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_details: [orderPayload] }),
      });
      const responseData = await response.json().catch(() => ({}));
      const result = responseData?.transaction_details?.[0];
      console.log('[MF][Purchase][ORDER_RESULT]', {
        httpStatus: response.status,
        ok: response.ok,
        orderId: result?.trxn_order_id,
        status: result?.trxn_status,
        remark: result?.trxn_remark || responseData?.error,
      });
      if (!response.ok || !String(result?.trxn_status || '').toUpperCase().includes('SUCCESS')) {
        throw new Error(result?.trxn_remark || responseData?.error || 'Purchase order failed.');
      }

      const purchaseOrderId = result.trxn_order_id;
      if (!purchaseOrderId) throw new Error('NSE did not return a purchase order ID.');

      // An order that is never funded is dropped by NSE at settlement cut-off,
      // so fetch the payment link before treating this as a success.
      const paymentLink = await getPurchasePaymentLink(purchaseOrderId);

      await updateDoc(snapshot.ref, {
        first_purchase_order_id: purchaseOrderId,
        first_purchase_order_status: result.trxn_status,
        first_purchase_order_amount: numericAmount,
        first_purchase_order_scheme: schemeCode,
        first_purchase_order_created_at: new Date().toISOString(),
        first_purchase_payment_link: paymentLink,
        first_purchase_payment_status: 'PENDING',
      });

      setOrder({ id: purchaseOrderId, paymentLink });
    } catch (err) {
      console.log('[MF][Purchase][ORDER_FAILED]', { error: err.message });
      setError(err.message || 'Could not create purchase order.');
    } finally {
      setLoading(false);
    }
  };

  // Opens NSE's hosted payment page. The investor chooses UPI or netbanking
  // there, so no bank credentials pass through this app.
  const openPayment = async () => {
    try {
      setError('');
      await Linking.openURL(order.paymentLink);
      setPaymentOpened(true);
    } catch {
      setError('Could not open the payment page. Copy the link and try in a browser.');
    }
  };

  // Cancels the unpaid order at NSE so the investor is not left owing it.
  const cancelOrder = async () => {
    if (cancelling) return;
    try {
      setCancelling(true);
      setError('');
      const phone = await readPhone();
      if (!phone) throw new Error('Session expired. Please log in again.');
      const snapshot = await getDoc(doc(db, 'mf_onboarding', phone));
      const data = snapshot.data() || {};
      const clientCode = data.ucc_code;
      if (!clientCode) throw new Error('NSE client code is missing.');

      await cancelPurchaseOrder({ clientCode, orderNo: order.id });

      await updateDoc(snapshot.ref, {
        first_purchase_order_id: '',
        first_purchase_payment_link: '',
        first_purchase_payment_status: 'CANCELLED',
        first_purchase_order_cancelled_at: new Date().toISOString(),
      });
      setOrder({ id: '', paymentLink: '' });
      setPaymentOpened(false);
    } catch (err) {
      console.log('[MF][Purchase][CANCEL_FAILED]', { error: err.message });
      setError(err.message || 'Could not cancel the order.');
    } finally {
      setCancelling(false);
    }
  };

  // NSE confirms payment asynchronously, so the app marks the installment as
  // initiated and moves on to the mandate. Reconciliation happens later from
  // the order status report.
  const continueToMandate = async () => {
    const phone = await readPhone();

    if (phone) {
      celebratePayment({ amount: numericAmount, fundName });
      awardBadge(phone, 'first_investment', order.id).catch(() => {});
      const { isGold, isInternational } = classifyFund(fundName);
      if (isGold) awardBadge(phone, 'first_gold_investment', order.id).catch(() => {});
      if (isInternational) awardBadge(phone, 'first_international_investment', order.id).catch(() => {});
    }

    router.push(`/(gowealthy)/mf/trading/sip-mandate?schemeCode=${encodeURIComponent(schemeCode)}&amcCode=${encodeURIComponent(amcCode)}&fundName=${encodeURIComponent(fundName)}&amount=${numericAmount}&tenureMonths=${duration.months}&tenureLabel=${encodeURIComponent(duration.label)}&purchaseOrderId=${encodeURIComponent(order.id)}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Set up SIP</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.schemeCard}>
          <Text style={styles.kicker}>SELECTED SCHEME</Text>
          <Text style={styles.schemeName}>{fundName}</Text>
          <Text style={styles.schemeCode}>{schemeCode}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>MONTHLY SIP AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#A0AAA4"
            />
          </View>
          <Text style={[styles.helper, !isValid && styles.error]}>Minimum SIP: ₹{minSIP.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>SIP DURATION</Text>
          <View style={styles.chips}>
            {DURATIONS.map((item) => (
              <TouchableOpacity key={item.label} onPress={() => setDuration(item)} style={[styles.chip, item.label === duration.label && styles.chipActive]}>
                <Text style={[styles.chipText, item.label === duration.label && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {order.id ? (
          <View style={styles.payBox}>
            <Text style={styles.payTitle}>Pay your first installment</Text>
            <Text style={styles.payText}>Order {order.id} is created but not yet funded. NSE cancels unpaid orders at the settlement cut-off, so complete the payment now.</Text>
            <TouchableOpacity onPress={openPayment} style={styles.payButton}>
              <Text style={styles.payButtonText}>Pay ₹{numericAmount.toLocaleString('en-IN')} on NSE</Text>
            </TouchableOpacity>
            {paymentOpened ? <Text style={styles.payHint}>Finished paying on the NSE page? Continue to set up the mandate for future installments.</Text> : null}
            <TouchableOpacity disabled={cancelling} onPress={cancelOrder} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : "Cancel this order — I don't want it"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>First purchase, then SIP setup</Text>
            <Text style={styles.infoText}>Continue will first create the NSE purchase order and open its payment page. We will then register the bank mandate and continue with SIP registration.</Text>
          </View>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <View><Text style={styles.footerLabel}>Monthly SIP</Text><Text style={styles.footerAmount}>₹{numericAmount.toLocaleString('en-IN')}</Text></View>
        {order.id ? (
          <TouchableOpacity disabled={!paymentOpened} onPress={continueToMandate} style={[styles.primary, !paymentOpened && styles.primaryDisabled]}>
            <Text style={styles.primaryText}>Continue to mandate</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity disabled={!isValid || loading} onPress={createPurchaseOrder} style={[styles.primary, (!isValid || loading) && styles.primaryDisabled]}>
            {loading ? <ActivityIndicator color="#FFFDF8" /> : <Text style={styles.primaryText}>Create purchase order</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F2EA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 54, paddingHorizontal: 18, paddingBottom: 14, backgroundColor: '#FFFDF8', borderBottomWidth: 1, borderBottomColor: '#E4E6DE' },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#17352B', fontSize: 34, lineHeight: 30 },
  headerTitle: { color: '#17352B', fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 36 },
  content: { padding: 18, paddingBottom: 120, gap: 13 },
  schemeCard: { backgroundColor: '#17352B', borderRadius: 17, padding: 18 },
  kicker: { color: '#91D2B5', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  schemeName: { color: '#FFFDF8', fontSize: 18, fontWeight: '800', lineHeight: 24 },
  schemeCode: { color: '#AFC8BC', fontSize: 11, marginTop: 8 },
  card: { backgroundColor: '#FFFDF8', borderRadius: 17, padding: 18, borderWidth: 1, borderColor: '#E2E5DD' },
  label: { color: '#8C9890', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 14 },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#07805E', paddingBottom: 8 },
  rupee: { color: '#17352B', fontSize: 28, fontWeight: '800', marginRight: 7 },
  amountInput: { flex: 1, color: '#17352B', fontSize: 34, fontWeight: '800', padding: 0 },
  helper: { color: '#8C9890', fontSize: 12, marginTop: 10 },
  error: { color: '#C04B48' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#DDE2DB', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
  chipActive: { backgroundColor: '#07805E', borderColor: '#07805E' },
  chipText: { color: '#66736B', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#FFFDF8' },
  infoBox: { backgroundColor: '#E5F2E9', borderRadius: 15, padding: 16 },
  infoTitle: { color: '#176B50', fontSize: 13, fontWeight: '800', marginBottom: 5 },
  infoText: { color: '#4F7565', fontSize: 12, lineHeight: 18 },
  payBox: { backgroundColor: '#FFF4D6', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#F1D58A' },
  payTitle: { color: '#795E17', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  payText: { color: '#8A7027', fontSize: 12, lineHeight: 18 },
  payButton: { backgroundColor: '#07805E', borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 13 },
  payButtonText: { color: '#FFFDF8', fontSize: 14, fontWeight: '800' },
  payHint: { color: '#8A7027', fontSize: 12, lineHeight: 18, marginTop: 11 },
  cancelButton: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: '#C04B48', fontSize: 12, fontWeight: '700' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFFDF8', borderTopWidth: 1, borderTopColor: '#E4E6DE', padding: 16, paddingBottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLabel: { color: '#8C9890', fontSize: 10, fontWeight: '700' },
  footerAmount: { color: '#17352B', fontSize: 20, fontWeight: '800', marginTop: 2 },
  primary: { backgroundColor: '#07805E', borderRadius: 13, paddingHorizontal: 18, paddingVertical: 15, minWidth: 190, alignItems: 'center' },
  primaryDisabled: { backgroundColor: '#A0AAA4' },
  primaryText: { color: '#FFFDF8', fontSize: 14, fontWeight: '800' },
});
