import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

const FUNDS_DATA = [
  { id: 1, name: 'Axis Bluechip Fund', category: 'Large Cap', amc: 'Axis MF', nav: 47.82, returns1Y: 15.2, returns3Y: 12.8, rating: 4 },
  { id: 2, name: 'HDFC Top 100 Fund', category: 'Large Cap', amc: 'HDFC MF', nav: 752.34, returns1Y: 14.8, returns3Y: 11.9, rating: 5 },
  { id: 3, name: 'SBI Small Cap Fund', category: 'Small Cap', amc: 'SBI MF', nav: 135.67, returns1Y: 22.1, returns3Y: 18.5, rating: 4 },
  { id: 4, name: 'ICICI Pru Bluechip Fund', category: 'Large Cap', amc: 'ICICI Pru MF', nav: 89.45, returns1Y: 13.9, returns3Y: 10.7, rating: 3 },
  { id: 5, name: 'Kotak Emerging Equity', category: 'Mid Cap', amc: 'Kotak MF', nav: 72.18, returns1Y: 18.5, returns3Y: 15.2, rating: 5 },
];

const PreviewScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Large Cap', 'Mid Cap', 'Small Cap'];

  const filteredFunds = FUNDS_DATA.filter(fund => {
    const matchesSearch = fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fund.amc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || fund.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const StarRating = ({ rating }) => (
    <View style={styles.starContainer}>
      {[...Array(5)].map((_, i) => (
        <Text key={i} style={[styles.star, i < rating && styles.starFilled]}>★</Text>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mutual Funds</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search funds..."
          placeholderTextColor="#666"
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setActiveCategory(category)}
            style={[styles.categoryChip, activeCategory === category && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.fundsList} showsVerticalScrollIndicator={false}>
        {filteredFunds.map((fund) => (
          <TouchableOpacity
            key={fund.id}
            style={styles.fundCard}
            onPress={() => router.push('/(gowealthy)/mf/onboarding/trading')}
          >
            <View style={styles.fundHeader}>
              <View style={styles.fundIconBox}>
                <Text style={styles.fundIcon}>📊</Text>
              </View>
              <View style={styles.fundInfo}>
                <Text style={styles.fundName}>{fund.name}</Text>
                <Text style={styles.fundAMC}>{fund.amc}</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{fund.category}</Text>
              </View>
            </View>

            <View style={styles.fundStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>NAV</Text>
                <Text style={styles.statValue}>₹{fund.nav}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>1Y Return</Text>
                <Text style={[styles.statValue, styles.returnPositive]}>+{fund.returns1Y}%</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>3Y Return</Text>
                <Text style={[styles.statValue, styles.returnPositive]}>+{fund.returns3Y}%</Text>
              </View>
            </View>

            <View style={styles.fundFooter}>
              <StarRating rating={fund.rating} />
              <TouchableOpacity style={styles.investBtn}>
                <Text style={styles.investBtnText}>Invest Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {filteredFunds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No funds found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  backButton: { padding: 8 },
  backButtonText: { color: '#fff', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingHorizontal: 16 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 14 },
  categoryScroll: { marginBottom: 16, paddingLeft: 20 },
  categoryChip: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 10 },
  categoryChipActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4' },
  categoryText: { fontSize: 14, color: '#999', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  fundsList: { flex: 1, paddingHorizontal: 20 },
  fundCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 16, marginBottom: 16 },
  fundHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  fundIconBox: { width: 48, height: 48, backgroundColor: 'rgba(107, 80, 196, 0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fundIcon: { fontSize: 24 },
  fundInfo: { flex: 1 },
  fundName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  fundAMC: { fontSize: 12, color: '#999' },
  categoryBadge: { backgroundColor: 'rgba(107, 80, 196, 0.2)', borderWidth: 1, borderColor: 'rgba(107, 80, 196, 0.3)', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  categoryBadgeText: { fontSize: 10, color: '#a855f7', fontWeight: '600' },
  fundStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#fff' },
  returnPositive: { color: '#10b981' },
  fundFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  starContainer: { flexDirection: 'row', gap: 2 },
  star: { fontSize: 14, color: '#444' },
  starFilled: { color: '#f59e0b' },
  investBtn: { backgroundColor: '#6b50c4', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  investBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#999' },
});

export default PreviewScreen;