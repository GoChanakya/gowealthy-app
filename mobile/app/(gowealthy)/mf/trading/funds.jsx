import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

const DUMMY_FUNDS = [
  {
    id: 1,
    schemeCode: 'INF879O01019',
    name: 'Parag Parikh Flexi Cap Fund',
    amc: 'PPFAS Mutual Fund',
    category: 'Flexi Cap',
    nav: 82.34,
    returns1Y: 18.2,
    returns3Y: 16.8,
    returns5Y: 22.1,
    rating: 5,
    minSIP: 1000,
    tag: 'Top Pick',
    tagColor: '#532ea6',
    riskLevel: 'Moderate',
  },
  {
    id: 2,
    schemeCode: 'INF769K01010',
    name: 'Mirae Asset Large Cap Fund',
    amc: 'Mirae Asset MF',
    category: 'Large Cap',
    nav: 104.56,
    returns1Y: 14.5,
    returns3Y: 12.1,
    returns5Y: 16.3,
    rating: 4,
    minSIP: 1000,
    tag: 'Stable',
    tagColor: '#10b981',
    riskLevel: 'Low-Moderate',
  },
  {
    id: 3,
    schemeCode: 'INF174K01LS2',
    name: 'SBI Small Cap Fund',
    amc: 'SBI Mutual Fund',
    category: 'Small Cap',
    nav: 148.22,
    returns1Y: 24.8,
    returns3Y: 21.3,
    returns5Y: 28.5,
    rating: 4,
    minSIP: 500,
    tag: 'High Growth',
    tagColor: '#ff6500',
    riskLevel: 'High',
  },
  {
    id: 4,
    schemeCode: 'INF204K01U27',
    name: 'Nippon India Balanced Advantage',
    amc: 'Nippon India MF',
    category: 'Balanced Advantage',
    nav: 24.67,
    returns1Y: 12.1,
    returns3Y: 10.4,
    returns5Y: 13.8,
    rating: 3,
    minSIP: 100,
    tag: 'Conservative',
    tagColor: '#7C766E',
    riskLevel: 'Low',
  },
  {
    id: 5,
    schemeCode: 'INF090I01EL4',
    name: 'HDFC Mid-Cap Opportunities',
    amc: 'HDFC Mutual Fund',
    category: 'Mid Cap',
    nav: 186.43,
    returns1Y: 21.4,
    returns3Y: 18.7,
    returns5Y: 23.6,
    rating: 5,
    minSIP: 100,
    tag: 'Popular',
    tagColor: '#3b82f6',
    riskLevel: 'High',
  },
];

const CATEGORIES = ['All', 'Flexi Cap', 'Large Cap', 'Mid Cap', 'Small Cap', 'Balanced Advantage'];

const FundsListScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = DUMMY_FUNDS.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.amc.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || f.category === activeCategory;
    return matchSearch && matchCat;
  });

  const StarRow = ({ rating }) => (
    <View style={styles.stars}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={i <= rating ? styles.starOn : styles.starOff}>★</Text>
      ))}
    </View>
  );

  const riskColor = (r) => {
    if (r === 'High') return '#ef4444';
    if (r === 'Moderate' || r === 'Low-Moderate') return '#f59e0b';
    return '#10b981';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mutual Funds</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search funds, AMC..."
          placeholderTextColor="#A89F95"
          style={styles.searchInput}
        />
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} onPress={() => setActiveCategory(c)}
            style={[styles.catChip, activeCategory === c && styles.catChipActive]}>
            <Text style={[styles.catTxt, activeCategory === c && styles.catTxtActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fund cards */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12 }}>
        {filtered.map(fund => (
          <TouchableOpacity key={fund.id} style={styles.card}
            onPress={() => router.push(`/(gowealthy)/mf/trading/fund-detail?schemeCode=${fund.schemeCode}&fundId=${fund.id}`)}>

            {/* Card header */}
            <View style={styles.cardHead}>
              <View style={styles.fundIconBox}>
                <Text style={styles.fundIcon}>📊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fundName}>{fund.name}</Text>
                <Text style={styles.fundAmc}>{fund.amc}</Text>
              </View>
              <View style={[styles.tagBadge, { backgroundColor: fund.tagColor + '22', borderColor: fund.tagColor + '44' }]}>
                <Text style={[styles.tagTxt, { color: fund.tagColor }]}>{fund.tag}</Text>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLbl}>NAV</Text>
                <Text style={styles.statVal}>₹{fund.nav}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLbl}>1Y</Text>
                <Text style={[styles.statVal, { color: '#10b981' }]}>+{fund.returns1Y}%</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLbl}>3Y</Text>
                <Text style={[styles.statVal, { color: '#10b981' }]}>+{fund.returns3Y}%</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLbl}>5Y</Text>
                <Text style={[styles.statVal, { color: '#10b981' }]}>+{fund.returns5Y}%</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFoot}>
              <StarRow rating={fund.rating} />
              <View style={styles.footRight}>
                <View style={[styles.riskBadge, { backgroundColor: riskColor(fund.riskLevel) + '22' }]}>
                  <Text style={[styles.riskTxt, { color: riskColor(fund.riskLevel) }]}>{fund.riskLevel}</Text>
                </View>
                <Text style={styles.minSip}>Min ₹{fund.minSIP}/mo</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTxt}>No funds found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3EF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#FFFDF9', borderBottomWidth: 0.5, borderBottomColor: '#E8E4DC' },
  backBtn: { padding: 4 },
  backTxt: { color: '#532ea6', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1512' },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#FFFDF9', borderRadius: 14, borderWidth: 0.5, borderColor: '#E8E4DC', paddingHorizontal: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#1A1512', fontSize: 14, paddingVertical: 13 },
  catScroll: { marginBottom: 4 },
  catChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#FFFDF9', borderWidth: 0.5, borderColor: '#E8E4DC' },
  catChipActive: { backgroundColor: '#532ea6', borderColor: '#532ea6' },
  catTxt: { fontSize: 13, color: '#7C766E', fontWeight: '500' },
  catTxtActive: { color: '#fff' },
  list: { flex: 1 },
  card: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 18, borderWidth: 0.5, borderColor: '#E8E4DC' },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  fundIconBox: { width: 44, height: 44, backgroundColor: '#532ea610', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fundIcon: { fontSize: 22 },
  fundName: { fontSize: 15, fontWeight: '700', color: '#1A1512', marginBottom: 2, lineHeight: 20 },
  fundAmc: { fontSize: 11, color: '#A89F95' },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tagTxt: { fontSize: 10, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#F0EDE6', marginBottom: 12 },
  statBox: { alignItems: 'center' },
  statLbl: { fontSize: 10, color: '#A89F95', marginBottom: 3, fontWeight: '600' },
  statVal: { fontSize: 14, fontWeight: '700', color: '#1A1512' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stars: { flexDirection: 'row', gap: 2 },
  starOn: { color: '#ff6500', fontSize: 14 },
  starOff: { color: '#E8E4DC', fontSize: 14 },
  footRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  riskTxt: { fontSize: 10, fontWeight: '600' },
  minSip: { fontSize: 11, color: '#A89F95' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTxt: { fontSize: 16, color: '#7C766E', fontWeight: '600' },
});

export default FundsListScreen;