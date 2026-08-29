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
import { refreshUccActivation } from '../../../../src/lib/ucc';
import { fetchSchemes, fetchFeaturedSchemes, prettySchemeName, amcInitials, FEATURED_AMCS } from '../../../../src/lib/schemes';

const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

const SchemeCard = ({ scheme, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    accessibilityRole="button"
    accessibilityLabel={`View ${scheme.scheme_name}`}
  >
    <View style={styles.cardTop}>
      <View style={styles.amcMark}>
        <Text style={styles.amcMarkText}>{amcInitials(scheme.amc_code)}</Text>
      </View>
      <View style={styles.cardTitleWrap}>
        <Text style={styles.schemeName} numberOfLines={2}>{prettySchemeName(scheme.scheme_name)}</Text>
        <Text style={styles.schemeMeta}>{scheme.scheme_type} · {scheme.plan_type}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#68756D" />
    </View>

    <View style={styles.rule} />

    <View style={styles.metricsRow}>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Minimum</Text>
        <Text style={styles.metricValue}>{formatAmount(scheme.min_purchase)}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>SIP</Text>
        <Text style={[styles.metricValue, scheme.sip_allowed ? styles.positive : styles.muted]}>
          {scheme.sip_allowed ? 'Available' : 'Not available'}
        </Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Cut-off</Text>
        <Text style={styles.metricValue}>{(scheme.purchase_cutoff_time || '').slice(0, 5)}</Text>
      </View>
    </View>

    <View style={styles.cardFooter}>
      <Text style={styles.schemeCode}>{scheme.scheme_code}</Text>
      <Text style={styles.viewText}>View scheme <Ionicons name="chevron-forward" size={13} color="#07805E" /></Text>
    </View>
  </Pressable>
);

const FundsListScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [authorizationChecked, setAuthorizationChecked] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [schemeError, setSchemeError] = useState('');
  const [totalTradeable, setTotalTradeable] = useState(0);

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

  // Search runs against NSE's full master (~500 tradeable schemes), so it's
  // debounced rather than filtering a local array.
  useEffect(() => {
    if (!authorizationChecked) return undefined;
    let active = true;
    const query = search.trim();

    const timer = setTimeout(async () => {
      setLoadingSchemes(true);
      setSchemeError('');
      try {
        if (!query) {
          const featured = await fetchFeaturedSchemes();
          if (!active) return;
          setSchemes(featured);
          setTotalTradeable(featured.length);
        } else {
          const { schemes: found, total_tradeable } = await fetchSchemes({ search: query, limit: 40 });
          if (!active) return;
          setSchemes(found);
          setTotalTradeable(total_tradeable);
        }
      } catch (error) {
        if (active) setSchemeError(error.message || 'Could not load schemes.');
      } finally {
        if (active) setLoadingSchemes(false);
      }
    }, query ? 350 : 0);

    return () => { active = false; clearTimeout(timer); };
  }, [search, authorizationChecked]);

  if (!authorizationChecked) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="small" color="#07805E" />
        <Text style={styles.gateText}>Checking NSE client authorization...</Text>
      </View>
    );
  }

  // The scheme's own values travel with it. Nothing downstream re-derives the
  // AMC code or minimum from a local table — that mismatch is what produced
  // "AMC DOES NOT EXISTS" on every SIP registration.
  const openScheme = (scheme) => {
    const params = new URLSearchParams({
      schemeCode: scheme.scheme_code,
      amcCode: scheme.amc_code,
      fundName: prettySchemeName(scheme.scheme_name),
      minPurchase: String(scheme.min_purchase),
      sipAllowed: scheme.sip_allowed ? '1' : '0',
      schemeType: scheme.scheme_type || '',
      cutoff: scheme.purchase_cutoff_time || '',
      isin: scheme.isin || '',
    });
    router.push(`/(gowealthy)/mf/trading/fund-detail?${params.toString()}`);
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
                <Text style={styles.headerCountNumber}>{totalTradeable || '—'}</Text>
                <Text style={styles.headerCountLabel}>live</Text>
              </View>
            </View>

            <View style={styles.introRow}>
              <View style={styles.introAccent} />
              <Text style={styles.introText}>
                Live NSE schemes you can invest in today. Search any fund house to see more.
              </Text>
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
              {FEATURED_AMCS.map((amc) => (
                <TouchableOpacity
                  key={amc}
                  onPress={() => setSearch(search === amc ? '' : amc)}
                  style={[styles.filter, search === amc && styles.filterActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: search === amc }}
                >
                  <Text style={[styles.filterText, search === amc && styles.filterTextActive]}>{amc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.resultsRow}>
              <Text style={styles.resultsText}>
                {schemes.length} {schemes.length === 1 ? 'scheme' : 'schemes'}
              </Text>
              <Text style={styles.resultsNote}>{search ? `Matching "${search}"` : 'Featured fund houses'}</Text>
            </View>

            {loadingSchemes ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#07805E" />
                <Text style={styles.emptyText}>Loading live schemes from NSE...</Text>
              </View>
            ) : schemeError ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={28} color="#B3261E" />
                <Text style={styles.emptyTitle}>Couldn&apos;t load schemes</Text>
                <Text style={styles.emptyText}>{schemeError}</Text>
              </View>
            ) : schemes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={28} color="#07805E" />
                <Text style={styles.emptyTitle}>No schemes found</Text>
                <Text style={styles.emptyText}>Try another fund house or scheme code.</Text>
              </View>
            ) : (
              schemes.map((scheme) => (
                <SchemeCard key={scheme.scheme_code} scheme={scheme} onPress={() => openScheme(scheme)} />
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
