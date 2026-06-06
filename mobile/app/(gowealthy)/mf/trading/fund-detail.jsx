import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

// ── Hardcoded Parag Parikh data ───────────────────────────────────────────────
const FUND = {
  schemeCode: 'INF879O01019',
  name: 'Parag Parikh Flexi Cap Fund',
  amc: 'PPFAS Mutual Fund',
  category: 'Flexi Cap',
  nav: 82.34,
  navDate: '03 Jun 2026',
  returns: { '1Y': 18.2, '3Y': 16.8, '5Y': 22.1 },
  minSIP: 1000,
  minLumpsum: 1000,
  aum: '₹84,000 Cr',
  expenseRatio: '0.63%',
  fundManager: 'Rajeev Thakkar',
  persona: {
    title: 'Steady Compounder',
    subtitle: 'Quality-first · long horizon',
    icon: '🏦',
    desc: 'Builds wealth by owning high-quality businesses and staying invested through every market storm. Rarely changes its mind.',
    traits: ['Patient', 'Quality Focused', 'Low Churn', 'Long-Term Thinking'],
  },
  phases: [
    { name: 'Market Corrections', stars: 5 },
    { name: 'Recovery Rallies', stars: 5 },
    { name: 'Bull Markets', stars: 4 },
    { name: 'Sideways Markets', stars: 4 },
  ],
  superpower: 'Historically protects capital better than peers during volatile and falling markets.',
  allocation: [
    { name: 'Financials', pct: 28, color: '#532ea6' },
    { name: 'Technology', pct: 18, color: '#ff6500' },
    { name: 'Consumer', pct: 14, color: '#532ea6' },
    { name: 'Industrials', pct: 12, color: '#ff6500' },
    { name: 'Pharma', pct: 8, color: '#532ea6' },
    { name: 'Others', pct: 20, color: '#A89F95' },
  ],
  holdings: ['HDFC Bank', 'ICICI Bank', 'Infosys', 'Bajaj Finance', 'Alphabet Inc'],
  managerBets: {
    buying: ['Domestic Consumption', 'Financial Services', 'Infrastructure Growth'],
    trimming: ['Export-Oriented IT'],
    outlook: "The portfolio is positioned to benefit from India's domestic growth story — businesses that win when Indians consume, invest, and build.",
  },
  confidence: {
    score: 91,
    reasons: [
      'Consistent across market cycles',
      'Experienced fund manager',
      'Strong downside protection',
      'Disciplined investment process',
    ],
    bestFor: ["Long-term wealth", "Retirement goals", "Child's education"],
    notFor: ["Emergency funds", "Short-term goals"],
  },
};

const StarRow = ({ count }) => (
  <View style={{ flexDirection: 'row', gap: 3 }}>
    {[1,2,3,4,5].map(i => (
      <Text key={i} style={{ color: i <= count ? '#ff6500' : '#E8E4DC', fontSize: 14 }}>★</Text>
    ))}
  </View>
);

const FundDetailScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backTxt}>←</Text>
          </TouchableOpacity>
          <Text style={styles.fundName}>{FUND.name}</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.amcRow}>
          <Text style={styles.amcName}>{FUND.amc}</Text>
          <View style={styles.trustBadge}>
            <Text style={styles.trustTxt}>🛡️ Trusted by long-term investors</Text>
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={styles.qStat}>
            <Text style={styles.qStatLbl}>NAV</Text>
            <Text style={styles.qStatVal}>₹{FUND.nav}</Text>
          </View>
          <View style={styles.qDivider} />
          <View style={styles.qStat}>
            <Text style={styles.qStatLbl}>1Y Return</Text>
            <Text style={[styles.qStatVal, { color: '#10b981' }]}>+{FUND.returns['1Y']}%</Text>
          </View>
          <View style={styles.qDivider} />
          <View style={styles.qStat}>
            <Text style={styles.qStatLbl}>3Y Return</Text>
            <Text style={[styles.qStatVal, { color: '#10b981' }]}>+{FUND.returns['3Y']}%</Text>
          </View>
          <View style={styles.qDivider} />
          <View style={styles.qStat}>
            <Text style={styles.qStatLbl}>AUM</Text>
            <Text style={styles.qStatVal}>{FUND.aum}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>

        {/* ── Fund Persona ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FUND PERSONA</Text>
          <View style={styles.personaBadge}>
            <View style={styles.personaIcon}>
              <Text style={{ fontSize: 26 }}>{FUND.persona.icon}</Text>
            </View>
            <View>
              <Text style={styles.personaTitle}>{FUND.persona.title}</Text>
              <Text style={styles.personaSub}>{FUND.persona.subtitle}</Text>
            </View>
          </View>
          <Text style={styles.personaDesc}>{FUND.persona.desc}</Text>
          <View style={styles.traits}>
            {FUND.persona.traits.map(t => (
              <View key={t} style={styles.traitChip}>
                <Text style={styles.traitTxt}>✓ {t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── How It Performs ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>HOW THIS FUND PERFORMS</Text>
          <Text style={styles.phaseSub}>Different funds shine in different market conditions.</Text>
          {FUND.phases.map(p => (
            <View key={p.name} style={styles.phaseRow}>
              <Text style={styles.phaseName}>{p.name}</Text>
              <StarRow count={p.stars} />
            </View>
          ))}
          <View style={styles.superpowerBox}>
            <Text style={styles.superpowerLbl}>⚡ SUPERPOWER</Text>
            <Text style={styles.superpowerTxt}>{FUND.superpower}</Text>
          </View>
        </View>

        {/* ── Allocation ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>WHAT YOUR MONEY OWNS</Text>
          <View style={styles.allocGrid}>
            {FUND.allocation.map(a => (
              <View key={a.name} style={styles.allocItem}>
                <View style={[styles.allocBar, { width: `${a.pct / 0.3}%`, backgroundColor: a.color }]} />
                <Text style={styles.allocPct}>{a.pct}%</Text>
                <Text style={styles.allocName}>{a.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.holdingsSection}>
            <Text style={styles.holdingsLbl}>TOP HOLDINGS</Text>
            <View style={styles.holdingsList}>
              {FUND.holdings.map((h, i) => (
                <View key={h} style={styles.holdingChip}>
                  <View style={[styles.holdingDot, { backgroundColor: i % 2 === 0 ? '#532ea6' : '#ff6500' }]} />
                  <Text style={styles.holdingTxt}>{h}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Manager Bets ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>WHAT THE MANAGER IS BETTING ON</Text>
          <Text style={styles.betSectionLbl}>↑ Buying into</Text>
          {FUND.managerBets.buying.map(b => (
            <View key={b} style={styles.betRow}>
              <Text style={styles.betTxt}>{b}</Text>
              <Text style={{ color: '#10b981', fontWeight: '700' }}>↑</Text>
            </View>
          ))}
          <Text style={[styles.betSectionLbl, { marginTop: 14, color: '#ef4444' }]}>↓ Trimming</Text>
          {FUND.managerBets.trimming.map(t => (
            <View key={t} style={styles.betRow}>
              <Text style={styles.betTxt}>{t}</Text>
              <Text style={{ color: '#ef4444', fontWeight: '700' }}>↓</Text>
            </View>
          ))}
          <View style={styles.outlookBox}>
            <Text style={styles.outlookTxt}>{FUND.managerBets.outlook}</Text>
          </View>
        </View>

        {/* ── Confidence ───────────────────────────────────────────── */}
        <View style={[styles.card, styles.confidenceCard]}>
          <Text style={[styles.cardLabel, { color: 'rgba(255,255,255,0.5)' }]}>OUR CONFIDENCE</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNum}>{FUND.confidence.score}</Text>
              <Text style={styles.scoreOf}>/100</Text>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              {FUND.confidence.reasons.map(r => (
                <Text key={r} style={styles.reasonTxt}>✓ {r}</Text>
              ))}
            </View>
          </View>
          <View style={styles.fitGrid}>
            <View style={styles.fitGood}>
              <Text style={styles.fitGoodLbl}>BEST FOR</Text>
              {FUND.confidence.bestFor.map(b => (
                <Text key={b} style={styles.fitItem}>{b}</Text>
              ))}
            </View>
            <View style={styles.fitBad}>
              <Text style={styles.fitBadLbl}>NOT IDEAL FOR</Text>
              {FUND.confidence.notFor.map(b => (
                <Text key={b} style={styles.fitItem}>{b}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Fund details row */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FUND DETAILS</Text>
          {[
            ['Expense Ratio', FUND.expenseRatio],
            ['Fund Manager', FUND.fundManager],
            ['Category', FUND.category],
            ['Min SIP Amount', `₹${FUND.minSIP}/month`],
            ['Min Lumpsum', `₹${FUND.minLumpsum}`],
          ].map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLbl}>{label}</Text>
              <Text style={styles.detailVal}>{value}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={styles.ctaPrimary}
          onPress={() => router.push(`/(gowealthy)/mf/trading/sip-amount?schemeCode=${FUND.schemeCode}&fundName=${encodeURIComponent(FUND.name)}&nav=${FUND.nav}&minSIP=${FUND.minSIP}`)}>
          <Text style={styles.ctaPrimaryTxt}>Start SIP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaSecondary}>
          <Text style={styles.ctaSecondaryTxt}>Lumpsum</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const S = StyleSheet;
const styles = S.create({
  container: { flex: 1, backgroundColor: '#F5F3EF' },
  header: { backgroundColor: '#FFFDF9', borderBottomWidth: 0.5, borderBottomColor: '#E8E4DC', paddingBottom: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 6 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#532ea6', fontSize: 22, fontWeight: '600' },
  fundName: { fontSize: 17, fontWeight: '700', color: '#1A1512', textAlign: 'center', flex: 1 },
  amcRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  amcName: { fontSize: 12, color: '#7C766E', fontWeight: '500' },
  trustBadge: { backgroundColor: '#532ea610', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  trustTxt: { fontSize: 10, color: '#532ea6', fontWeight: '600' },
  quickStats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 0 },
  qStat: { flex: 1, alignItems: 'center' },
  qStatLbl: { fontSize: 10, color: '#A89F95', fontWeight: '600', marginBottom: 2 },
  qStatVal: { fontSize: 13, fontWeight: '700', color: '#1A1512' },
  qDivider: { width: 0.5, height: 28, backgroundColor: '#E8E4DC' },
  scroll: { flex: 1 },
  card: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 20, borderWidth: 0.5, borderColor: '#E8E4DC' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: '#A89F95', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  personaBadge: { backgroundColor: '#1A1512', borderRadius: 16, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderLeftWidth: 4, borderLeftColor: '#ff6500' },
  personaIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,101,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  personaTitle: { fontSize: 17, fontWeight: '700', color: '#FFFDF9', marginBottom: 2 },
  personaSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  personaDesc: { fontSize: 13, color: '#4A4540', lineHeight: 22, marginBottom: 14 },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  traitChip: { backgroundColor: '#F0EDE6', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20 },
  traitTxt: { fontSize: 11, color: '#4A4540', fontWeight: '500' },
  phaseSub: { fontSize: 12, color: '#7C766E', marginBottom: 14, lineHeight: 18 },
  phaseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
  phaseName: { fontSize: 13, color: '#2C2C2A', fontWeight: '500' },
  superpowerBox: { backgroundColor: '#532ea60f', borderLeftWidth: 3, borderLeftColor: '#532ea6', borderRadius: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12, padding: 12, marginTop: 14 },
  superpowerLbl: { fontSize: 10, fontWeight: '700', color: '#532ea6', marginBottom: 4 },
  superpowerTxt: { fontSize: 12, color: '#3C3489', lineHeight: 18 },
  allocGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  allocItem: { width: '47%', backgroundColor: '#F5F3EF', borderRadius: 12, padding: 12, overflow: 'hidden' },
  allocBar: { position: 'absolute', bottom: 0, left: 0, height: 3 },
  allocPct: { fontSize: 22, fontWeight: '700', color: '#1A1512', lineHeight: 26, marginBottom: 2 },
  allocName: { fontSize: 11, color: '#7C766E', fontWeight: '500' },
  holdingsSection: { borderTopWidth: 0.5, borderTopColor: '#F0EDE6', paddingTop: 14 },
  holdingsLbl: { fontSize: 10, fontWeight: '700', color: '#A89F95', marginBottom: 10 },
  holdingsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  holdingChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F3EF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  holdingDot: { width: 7, height: 7, borderRadius: 4 },
  holdingTxt: { fontSize: 12, color: '#2C2C2A', fontWeight: '500' },
  betSectionLbl: { fontSize: 12, fontWeight: '700', color: '#10b981', marginBottom: 8 },
  betRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
  betTxt: { fontSize: 13, color: '#2C2C2A', fontWeight: '500' },
  outlookBox: { backgroundColor: '#F5F3EF', borderRadius: 12, padding: 14, marginTop: 14 },
  outlookTxt: { fontSize: 12, color: '#4A4540', lineHeight: 20 },
  confidenceCard: { backgroundColor: '#1A1512' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#ff6500', alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 26, fontWeight: '800', color: '#fff' },
  scoreOf: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  reasonTxt: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  fitGrid: { flexDirection: 'row', gap: 8 },
  fitGood: { flex: 1, backgroundColor: 'rgba(83,46,166,0.2)', borderRadius: 14, padding: 14 },
  fitBad: { flex: 1, backgroundColor: 'rgba(255,101,0,0.12)', borderRadius: 14, padding: 14 },
  fitGoodLbl: { fontSize: 10, fontWeight: '700', color: '#AFA9EC', marginBottom: 8 },
  fitBadLbl: { fontSize: 10, fontWeight: '700', color: '#F0997B', marginBottom: 8 },
  fitItem: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4, lineHeight: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F0EDE6' },
  detailLbl: { fontSize: 13, color: '#7C766E' },
  detailVal: { fontSize: 13, fontWeight: '600', color: '#1A1512' },
  ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 34, backgroundColor: '#FFFDF9', borderTopWidth: 0.5, borderTopColor: '#E8E4DC' },
  ctaPrimary: { flex: 1, backgroundColor: '#ff6500', borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ctaSecondary: { backgroundColor: '#532ea615', borderRadius: 14, padding: 16, paddingHorizontal: 20 },
  ctaSecondaryTxt: { color: '#532ea6', fontSize: 14, fontWeight: '700' },
});

export default FundDetailScreen;