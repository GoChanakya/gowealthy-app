import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAMPLE_SCHEMES } from '../../../../src/data/sampleSchemes';
import { refreshUccActivation } from '../../../../src/lib/ucc';

const FILTERS = ['All schemes', 'Growth', 'IDCW', 'SIP enabled'];

const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

const matchesFilter = (scheme, filter) => {
  if (filter === 'Growth') return scheme.option === 'Growth';
  if (filter === 'IDCW') return scheme.option.toLowerCase().startsWith('idcw');
  if (filter === 'SIP enabled') return scheme.sipAllowed;
  return true;
};

const SchemeCard = ({ scheme, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    accessibilityRole="button"
    accessibilityLabel={`View ${scheme.name}, ${scheme.option}`}
  >
    <View style={styles.cardTop}>
      <View style={styles.amcMark}>
        <Text style={styles.amcMarkText}>360</Text>
      </View>
      <View style={styles.cardTitleWrap}>
        <Text style={styles.schemeName} numberOfLines={2}>{scheme.name}</Text>
        <Text style={styles.schemeMeta}>{scheme.plan} · {scheme.option}</Text>
      </View>
      <Ionicons name="arrow-up-right" size={20} color="#68756D" />
    </View>

    <View style={styles.rule} />

    <View style={styles.metricsRow}>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Minimum</Text>
        <Text style={styles.metricValue}>{formatAmount(scheme.minPurchase)}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>SIP</Text>
        <Text style={[styles.metricValue, scheme.sipAllowed ? styles.positive : styles.muted]}>
          {scheme.sipAllowed ? 'Available' : 'Not available'}
        </Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Settlement</Text>
        <Text style={styles.metricValue}>{scheme.settlement}</Text>
      </View>
    </View>

    <View style={styles.cardFooter}>
      <Text style={styles.schemeCode}>{scheme.schemeCode}</Text>
      <Text style={styles.viewText}>View scheme <Ionicons name="chevron-forward" size={13} color="#07805E" /></Text>
    </View>
  </Pressable>
);

const FundsListScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All schemes');
  const [authorizationChecked, setAuthorizationChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const verifyAuthorization = async () => {
      try {
        const rawPhone = await AsyncStorage.getItem('user_phone');
        const phone = rawPhone ? String(rawPhone).replace(/\D/g, '').slice(-10) : '';
        if (!phone) {
          router.replace('/(gowealthy)/mf/onboarding/screen1');
          return;
        }
        const status = await refreshUccActivation(phone);
        if (!active) return;
        if (!status.authorized) {
          router.replace('/(gowealthy)/mf/onboarding/screen1');
          return;
        }
        setAuthorizationChecked(true);
      } catch (error) {
        console.log('[MF][Trading][AUTH_GATE_FAILED]', { error: error.message });
        if (active) router.replace('/(gowealthy)/mf/onboarding/screen1');
      }
    };
    verifyAuthorization();
    return () => { active = false; };
  }, [router]);

  const filteredSchemes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return SAMPLE_SCHEMES.filter((scheme) => {
      const matchesSearch = !query || [scheme.name, scheme.amc, scheme.option, scheme.schemeCode]
        .some((value) => value.toLowerCase().includes(query));
      return matchesSearch && matchesFilter(scheme, activeFilter);
    });
  }, [activeFilter, search]);

  if (!authorizationChecked) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="small" color="#07805E" />
        <Text style={styles.gateText}>Checking NSE client authorization...</Text>
      </View>
    );
  }

  const openScheme = (scheme) => {
    router.push(`/(gowealthy)/mf/trading/fund-detail?schemeCode=${encodeURIComponent(scheme.schemeCode)}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.replace('/(gowealthy)')} style={styles.backButton} accessibilityLabel="Go back to home">
                <Ionicons name="arrow-back" size={21} color="#17352B" />
              </TouchableOpacity>
              <View>
                <Text style={styles.eyebrow}>INVEST</Text>
                <Text style={styles.headerTitle}>Mutual funds</Text>
              </View>
              <View style={styles.headerCount}>
                <Text style={styles.headerCountNumber}>{SAMPLE_SCHEMES.length}</Text>
                <Text style={styles.headerCountLabel}>samples</Text>
              </View>
            </View>

            <View style={styles.introRow}>
              <View style={styles.introAccent} />
              <Text style={styles.introText}>Browse the sample schemes available for your first investment.</Text>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color="#7D8981" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by fund or scheme code"
                placeholderTextColor="#9AA39D"
                style={styles.searchInput}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filter, filter === activeFilter && styles.filterActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === activeFilter }}
                >
                  <Text style={[styles.filterText, filter === activeFilter && styles.filterTextActive]}>{filter}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.resultsRow}>
              <Text style={styles.resultsText}>{filteredSchemes.length} {filteredSchemes.length === 1 ? 'scheme' : 'schemes'}</Text>
              <Text style={styles.resultsNote}>Sample catalogue</Text>
            </View>
            {filteredSchemes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={28} color="#07805E" />
            <Text style={styles.emptyTitle}>No schemes found</Text>
            <Text style={styles.emptyText}>Try another fund name, option, or scheme code.</Text>
          </View>
            ) : (
              filteredSchemes.map((scheme) => (
                <SchemeCard key={scheme.schemeCode} scheme={scheme} onPress={() => openScheme(scheme)} />
              ))
            )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F2EA' },
  gate: { flex: 1, backgroundColor: '#F4F2EA', alignItems: 'center', justifyContent: 'center', padding: 24 },
  gateText: { color: '#66736B', fontSize: 13, marginTop: 12 },
  listContent: { paddingHorizontal: 18, paddingTop: 52, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFDF8', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  eyebrow: { color: '#07805E', fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 3 },
  headerTitle: { color: '#17352B', fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  headerCount: { marginLeft: 'auto', alignItems: 'flex-end' },
  headerCountNumber: { color: '#17352B', fontSize: 24, fontWeight: '800', lineHeight: 25 },
  headerCountLabel: { color: '#7D8981', fontSize: 11, marginTop: 2 },
  introRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  introAccent: { width: 4, height: 30, borderRadius: 2, backgroundColor: '#07805E', marginRight: 10 },
  introText: { flex: 1, color: '#66736B', fontSize: 13, lineHeight: 19 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF8', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E4E6DE', marginBottom: 14 },
  searchInput: { flex: 1, color: '#17352B', fontSize: 14, paddingVertical: 14, marginLeft: 9 },
  filterContent: { gap: 8, paddingBottom: 18 },
  filter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: '#DDE2DB', backgroundColor: '#F4F2EA' },
  filterActive: { borderColor: '#17352B', backgroundColor: '#17352B' },
  filterText: { color: '#66736B', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#FFFDF8' },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultsText: { color: '#17352B', fontSize: 13, fontWeight: '800' },
  resultsNote: { color: '#9AA39D', fontSize: 11 },
  card: { backgroundColor: '#FFFDF8', borderRadius: 17, padding: 16, borderWidth: 1, borderColor: '#E2E5DD', marginBottom: 11 },
  cardPressed: { backgroundColor: '#F8FBF5', transform: [{ scale: 0.992 }] },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  amcMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#E5F2E9', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  amcMarkText: { color: '#07805E', fontSize: 12, fontWeight: '900', letterSpacing: -0.4 },
  cardTitleWrap: { flex: 1, paddingRight: 8 },
  schemeName: { color: '#17352B', fontSize: 15, fontWeight: '800', lineHeight: 20 },
  schemeMeta: { color: '#77847C', fontSize: 11, marginTop: 4, textTransform: 'capitalize' },
  rule: { height: 1, backgroundColor: '#EDF0E9', marginVertical: 14 },
  metricsRow: { flexDirection: 'row' },
  metric: { flex: 1 },
  metricLabel: { color: '#9AA39D', fontSize: 10, fontWeight: '700', marginBottom: 5 },
  metricValue: { color: '#17352B', fontSize: 12, fontWeight: '800' },
  positive: { color: '#07805E' },
  muted: { color: '#9AA39D' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  schemeCode: { color: '#A3ABA5', fontSize: 10, letterSpacing: 0.4 },
  viewText: { color: '#07805E', fontSize: 11, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 28 },
  emptyTitle: { color: '#17352B', fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptyText: { color: '#77847C', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 5 },
});

export default FundsListScreen;
