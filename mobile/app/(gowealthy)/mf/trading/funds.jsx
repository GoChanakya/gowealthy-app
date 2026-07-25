import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SCHEMES_URL } from '../../../../src/config/services';

// Categories map to NSE scheme_type values (uppercase in the data).
const CATEGORIES = ['All', 'EQUITY', 'DEBT', 'HYBRID', 'ELSS', 'LIQUID'];
const catLabel = (c) =>
  c === 'All' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase();

const FundsListScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(SCHEMES_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setFunds(Array.isArray(data.funds) ? data.funds : []);
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load funds');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return funds.filter(f => {
      const matchCat = activeCategory === 'All' || f.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (f.name || '').toLowerCase().includes(q) ||
             (f.amc || '').toLowerCase().includes(q);
    });
  }, [funds, search, activeCategory]);

  const renderCard = ({ item: fund }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(gowealthy)/mf/trading/fund-detail?schemeCode=${encodeURIComponent(fund.schemeCode)}`)}
    >
      {/* Card header */}
      <View style={styles.cardHead}>
        <View style={styles.fundIconBox}>
          <Text style={styles.fundIcon}>📊</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fundName} numberOfLines={2}>{fund.name}</Text>
          <Text style={styles.fundAmc}>{fund.amc}</Text>
        </View>
        <View style={styles.tagBadge}>
          <Text style={styles.tagTxt}>{catLabel(fund.category || '')}</Text>
        </View>
      </View>

      {/* Stats row — only real fields */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLbl}>NAV</Text>
          <Text style={styles.statVal}>{fund.nav != null ? `₹${fund.nav}` : '—'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLbl}>Min SIP</Text>
          <Text style={styles.statVal}>{fund.minSIP != null ? `₹${fund.minSIP}` : '—'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLbl}>As of</Text>
          <Text style={styles.statValSm}>{fund.navDate || '—'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={[styles.catTxt, activeCategory === c && styles.catTxtActive]}>{catLabel(c)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#532ea6" />
          <Text style={styles.centerTxt}>Loading funds…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.centerTxt}>Couldn't load funds ({error})</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.schemeCode}
          renderItem={renderCard}
          style={styles.list}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={10}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.countTxt}>{filtered.length} funds</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTxt}>No funds found</Text>
            </View>
          }
        />
      )}
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
  catScroll: { marginBottom: 4, flexGrow: 0 },
  catChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#FFFDF9', borderWidth: 0.5, borderColor: '#E8E4DC' },
  catChipActive: { backgroundColor: '#532ea6', borderColor: '#532ea6' },
  catTxt: { fontSize: 13, color: '#7C766E', fontWeight: '500' },
  catTxtActive: { color: '#fff' },
  list: { flex: 1 },
  countTxt: { fontSize: 12, color: '#A89F95', fontWeight: '600', marginBottom: 8 },
  card: { backgroundColor: '#FFFDF9', borderRadius: 20, padding: 18, borderWidth: 0.5, borderColor: '#E8E4DC' },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  fundIconBox: { width: 44, height: 44, backgroundColor: '#532ea610', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fundIcon: { fontSize: 22 },
  fundName: { fontSize: 15, fontWeight: '700', color: '#1A1512', marginBottom: 2, lineHeight: 20 },
  fundAmc: { fontSize: 11, color: '#A89F95' },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, backgroundColor: '#532ea622', borderColor: '#532ea644' },
  tagTxt: { fontSize: 10, fontWeight: '700', color: '#532ea6' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 0.5, borderColor: '#F0EDE6' },
  statBox: { alignItems: 'center', flex: 1 },
  statLbl: { fontSize: 10, color: '#A89F95', marginBottom: 3, fontWeight: '600' },
  statVal: { fontSize: 14, fontWeight: '700', color: '#1A1512' },
  statValSm: { fontSize: 12, fontWeight: '600', color: '#1A1512' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  centerTxt: { fontSize: 14, color: '#7C766E', fontWeight: '500', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTxt: { fontSize: 16, color: '#7C766E', fontWeight: '600' },
});

export default FundsListScreen;
