import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];
const TENURES = [
  { label: '1 Year', months: 12 },
  { label: '3 Years', months: 36 },
  { label: '5 Years', months: 60 },
  { label: '10 Years', months: 120 },
  { label: 'Ongoing', months: 0 },
];

const SIPAmountScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fundName = decodeURIComponent(params.fundName || 'Selected Fund');
  const nav = parseFloat(params.nav || 0);
  const minSIP = parseInt(params.minSIP || 500);
  const schemeCode = params.schemeCode || '';

  const [amount, setAmount] = useState('1000');
  const [tenure, setTenure] = useState(TENURES[1]); // default 3Y

  const numAmount = parseInt(amount) || 0;
  const monthlyUnits = nav > 0 ? (numAmount / nav).toFixed(3) : '—';
  const totalInvested = tenure.months > 0 ? numAmount * tenure.months : numAmount * 120;
  const estimatedReturn = tenure.months > 0
    ? Math.round(numAmount * (((1 + 0.14 / 12) ** tenure.months - 1) / (0.14 / 12)) * (1 + 0.14 / 12))
    : '—';
  const estimatedGain = tenure.months > 0 ? estimatedReturn - totalInvested : '—';

  const isValid = numAmount >= minSIP;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup SIP</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 120 }}>
        {/* Fund name */}
        <View style={styles.fundRow}>
          <Text style={styles.fundRowIcon}>📊</Text>
          <Text style={styles.fundRowName} numberOfLines={2}>{fundName}</Text>
        </View>

        {/* Amount input */}
        <View style={styles.card}>
          <Text style={styles.cardLbl}>MONTHLY SIP AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={v => setAmount(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#A89F95"
            />
          </View>
          {numAmount > 0 && numAmount < minSIP && (
            <Text style={styles.minNote}>Minimum SIP amount is ₹{minSIP}</Text>
          )}
          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map(a => (
              <TouchableOpacity key={a} onPress={() => setAmount(String(a))}
                style={[styles.quickChip, parseInt(amount) === a && styles.quickChipActive]}>
                <Text style={[styles.quickTxt, parseInt(amount) === a && styles.quickTxtActive]}>
                  ₹{a >= 1000 ? `${a/1000}K` : a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.unitsNote}>
            ≈ {monthlyUnits} units per month at NAV ₹{nav}
          </Text>
        </View>

        {/* Tenure */}
        <View style={styles.card}>
          <Text style={styles.cardLbl}>SIP DURATION</Text>
          <View style={styles.tenureRow}>
            {TENURES.map(t => (
              <TouchableOpacity key={t.label} onPress={() => setTenure(t)}
                style={[styles.tenureChip, tenure.label === t.label && styles.tenureChipActive]}>
                <Text style={[styles.tenureTxt, tenure.label === t.label && styles.tenureTxtActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Projection */}
        {isValid && tenure.months > 0 && (
          <View style={styles.projCard}>
            <Text style={styles.cardLbl}>ESTIMATED RETURNS (14% CAGR)</Text>
            <View style={styles.projRow}>
              <View style={styles.projBox}>
                <Text style={styles.projLbl}>Total Invested</Text>
                <Text style={styles.projVal}>₹{(totalInvested/1000).toFixed(1)}K</Text>
              </View>
              <Text style={styles.projArrow}>→</Text>
              <View style={styles.projBox}>
                <Text style={styles.projLbl}>Est. Value</Text>
                <Text style={[styles.projVal, { color: '#ff6500' }]}>
                  ₹{(estimatedReturn/1000).toFixed(1)}K
                </Text>
              </View>
            </View>
            <View style={styles.gainRow}>
              <Text style={styles.gainLbl}>Est. Gain</Text>
              <Text style={styles.gainVal}>
                +₹{((estimatedGain)/1000).toFixed(1)}K ({Math.round((estimatedGain/totalInvested)*100)}%)
              </Text>
            </View>
            <Text style={styles.disclaimer}>* Projections are indicative. Returns not guaranteed.</Text>
          </View>
        )}

        {/* SIP dates info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📅 SIP Details</Text>
          <Text style={styles.infoLine}>Debit date: 5th of every month</Text>
          <Text style={styles.infoLine}>First SIP: Next month after mandate activation</Text>
          <Text style={styles.infoLine}>Bank: SBI (linked account)</Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <View style={styles.ctaSummary}>
          <Text style={styles.ctaAmtLbl}>Monthly SIP</Text>
          <Text style={styles.ctaAmt}>₹{numAmount || '—'}</Text>
        </View>
        <TouchableOpacity
          disabled={!isValid}
          style={[styles.ctaBtn, !isValid && styles.ctaBtnDisabled]}
          onPress={() => router.push(`/(gowealthy)/mf/trading/sip-mandate?schemeCode=${schemeCode}&fundName=${encodeURIComponent(fundName)}&amount=${amount}&tenureMonths=${tenure.months}&tenureLabel=${encodeURIComponent(tenure.label)}`)}>
          <Text style={styles.ctaBtnTxt}>Continue →</Text>
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
  fundRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFDF9', borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: '#E8E4DC' },
  fundRowIcon: { fontSize: 24 },
  fundRowName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1512', lineHeight: 22 },
  card: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 20, borderWidth: 0.5, borderColor: '#E8E4DC', gap: 14 },
  cardLbl: { fontSize: 10, fontWeight: '700', color: '#A89F95', letterSpacing: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ff6500', paddingBottom: 8 },
  rupee: { fontSize: 28, fontWeight: '700', color: '#1A1512', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800', color: '#1A1512' },
  minNote: { fontSize: 12, color: '#ef4444' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F3EF', borderWidth: 1, borderColor: '#E8E4DC' },
  quickChipActive: { backgroundColor: '#ff6500', borderColor: '#ff6500' },
  quickTxt: { fontSize: 12, color: '#4A4540', fontWeight: '600' },
  quickTxtActive: { color: '#fff' },
  unitsNote: { fontSize: 11, color: '#A89F95' },
  tenureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tenureChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F3EF', borderWidth: 1, borderColor: '#E8E4DC' },
  tenureChipActive: { backgroundColor: '#532ea6', borderColor: '#532ea6' },
  tenureTxt: { fontSize: 13, color: '#4A4540', fontWeight: '500' },
  tenureTxtActive: { color: '#fff' },
  projCard: { backgroundColor: '#1A1512', borderRadius: 20, padding: 20, gap: 14 },
  projRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  projBox: { alignItems: 'center', gap: 4 },
  projLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  projVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  projArrow: { fontSize: 20, color: 'rgba(255,255,255,0.3)' },
  gainRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12 },
  gainLbl: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  gainVal: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  disclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  infoCard: { backgroundColor: '#FFFDF9', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#E8E4DC', gap: 6 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#1A1512', marginBottom: 4 },
  infoLine: { fontSize: 12, color: '#7C766E', lineHeight: 20 },
  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 34, backgroundColor: '#FFFDF9', borderTopWidth: 0.5, borderTopColor: '#E8E4DC', gap: 14 },
  ctaSummary: { gap: 2 },
  ctaAmtLbl: { fontSize: 10, color: '#A89F95', fontWeight: '600' },
  ctaAmt: { fontSize: 20, fontWeight: '800', color: '#1A1512' },
  ctaBtn: { flex: 1, backgroundColor: '#ff6500', borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaBtnDisabled: { backgroundColor: '#E8E4DC' },
  ctaBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default SIPAmountScreen;