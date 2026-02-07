import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const TradingScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [activePeriod, setActivePeriod] = useState('1Y');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [investmentType, setInvestmentType] = useState('sip');
  const [amount, setAmount] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);

  const fundData = {
    name: 'Axis Bluechip Fund',
    code: 'AXISBLUECHIP',
    category: 'Large Cap Equity',
    nav: 47.82,
    change: 1.24,
    changePercent: 2.67,
    rating: 4,
    returns1Y: 15.2,
    aum: '45,820 Cr',
    risk: 'Moderate',
    minSIP: 500,
  };

  const chartData = {
    '1M': [45.2, 45.8, 45.4, 46.1, 46.8, 47.2, 47.8],
    '3M': [42.5, 43.2, 44.1, 43.8, 45.2, 46.5, 47.8],
    '6M': [40.2, 41.5, 42.8, 44.2, 45.1, 46.4, 47.8],
    '1Y': [38.5, 40.2, 41.8, 43.5, 44.8, 46.2, 47.8],
    '3Y': [28.2, 32.5, 35.8, 38.4, 41.2, 44.5, 47.8],
    '5Y': [20.5, 25.8, 30.2, 35.4, 40.1, 44.8, 47.8],
  };

  const holdings = [
    { name: 'Reliance Industries', allocation: 8.5, change: 2.3 },
    { name: 'HDFC Bank', allocation: 7.2, change: 1.8 },
    { name: 'Infosys', allocation: 6.8, change: -0.5 },
    { name: 'ICICI Bank', allocation: 6.1, change: 1.2 },
    { name: 'TCS', allocation: 5.9, change: 0.8 },
    { name: 'Bharti Airtel', allocation: 4.7, change: 3.1 },
    { name: 'Kotak Mahindra Bank', allocation: 4.3, change: 1.5 },
    { name: 'HUL', allocation: 3.9, change: -0.2 },
  ];

  const sectors = [
    { name: 'Financial Services', allocation: 28.5, color: '#6b50c4' },
    { name: 'IT', allocation: 18.2, color: '#3b82f6' },
    { name: 'Consumer Goods', allocation: 15.8, color: '#10b981' },
    { name: 'Energy', allocation: 12.4, color: '#f59e0b' },
    { name: 'Healthcare', allocation: 9.6, color: '#ef4444' },
    { name: 'Auto', allocation: 7.3, color: '#8b5cf6' },
    { name: 'Telecom', allocation: 5.2, color: '#ec4899' },
    { name: 'Others', allocation: 3.0, color: '#6b7280' },
  ];

  const StarRating = ({ rating }) => (
    <View style={styles.starContainer}>
      {[...Array(5)].map((_, i) => (
        <Text key={i} style={[styles.star, i < rating && styles.starFilled]}>★</Text>
      ))}
    </View>
  );

  const calculateUnits = () => {
    if (!amount) return 0;
    return (parseFloat(amount) / fundData.nav).toFixed(4);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.watchlistBtn}>
          <Text style={styles.watchlistIcon}>♡</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fund Header Card */}
        <View style={styles.fundHeaderCard}>
          <View style={styles.fundTitleRow}>
            <View style={styles.fundIconBox}>
              <Text style={styles.fundIcon}>📊</Text>
            </View>
            <View style={styles.fundTitleInfo}>
              <Text style={styles.fundName}>{fundData.name}</Text>
              <Text style={styles.fundCode}>{fundData.code} • {fundData.category}</Text>
            </View>
          </View>

          <View style={styles.navRow}>
            <View>
              <Text style={styles.navLabel}>NAV</Text>
              <Text style={styles.navValue}>₹{fundData.nav}</Text>
            </View>
            <View style={styles.changeBox}>
              <Text style={styles.changeValue}>+₹{fundData.change}</Text>
              <Text style={styles.changePercent}>+{fundData.changePercent}%</Text>
            </View>
          </View>

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <StarRating rating={fundData.rating} />
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>1Y Return</Text>
              <Text style={styles.quickStatValue}>+{fundData.returns1Y}%</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>Min SIP</Text>
              <Text style={styles.quickStatValue}>₹{fundData.minSIP}</Text>
            </View>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.periodSelector}>
            {['1M', '3M', '6M', '1Y', '3Y', '5Y'].map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setActivePeriod(period)}
                style={[styles.periodBtn, activePeriod === period && styles.periodBtnActive]}
              >
                <Text style={[styles.periodText, activePeriod === period && styles.periodTextActive]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <LineChart
            data={{
              labels: [],
              datasets: [{ data: chartData[activePeriod] }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#000',
              backgroundGradientFrom: '#000',
              backgroundGradientTo: '#000',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(107, 80, 196, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#6b50c4',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {['overview', 'holdings', 'performance'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Fund Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>AUM</Text>
                  <Text style={styles.infoValue}>{fundData.aum}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Risk</Text>
                  <Text style={styles.infoValue}>{fundData.risk}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Exit Load</Text>
                  <Text style={styles.infoValue}>1% (1yr)</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Expense Ratio</Text>
                  <Text style={styles.infoValue}>0.65%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'holdings' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Top Holdings</Text>
            {holdings.map((holding, idx) => (
              <View key={idx} style={styles.holdingCard}>
                <View style={styles.holdingInfo}>
                  <Text style={styles.holdingName}>{holding.name}</Text>
                  <View style={styles.holdingBar}>
                    <View style={[styles.holdingBarFill, { width: `${holding.allocation * 10}%` }]} />
                  </View>
                </View>
                <View style={styles.holdingStats}>
                  <Text style={styles.holdingAllocation}>{holding.allocation}%</Text>
                  <Text style={[styles.holdingChange, holding.change >= 0 ? styles.positive : styles.negative]}>
                    {holding.change >= 0 ? '+' : ''}{holding.change}%
                  </Text>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Sector Allocation</Text>
            {sectors.map((sector, idx) => (
              <View key={idx} style={styles.sectorCard}>
                <View style={styles.sectorInfo}>
                  <View style={[styles.sectorDot, { backgroundColor: sector.color }]} />
                  <Text style={styles.sectorName}>{sector.name}</Text>
                </View>
                <View style={styles.sectorRight}>
                  <View style={styles.sectorBar}>
                    <View style={[styles.sectorBarFill, { width: `${sector.allocation * 3}%`, backgroundColor: sector.color }]} />
                  </View>
                  <Text style={styles.sectorAllocation}>{sector.allocation}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'performance' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Returns Comparison</Text>
            <View style={styles.returnsGrid}>
              <View style={styles.returnCard}>
                <Text style={styles.returnPeriod}>1 Year</Text>
                <Text style={styles.returnValue}>+15.2%</Text>
              </View>
              <View style={styles.returnCard}>
                <Text style={styles.returnPeriod}>3 Years</Text>
                <Text style={styles.returnValue}>+12.8%</Text>
              </View>
              <View style={styles.returnCard}>
                <Text style={styles.returnPeriod}>5 Years</Text>
                <Text style={styles.returnValue}>+14.5%</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowBuyModal(true)}>
          <Text style={styles.actionButtonText}>💰 Invest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
          <Text style={styles.actionButtonTextSecondary}>📊 Calculator</Text>
        </TouchableOpacity>
      </View>

      {/* Chatbot Button */}
      <TouchableOpacity 
        style={styles.chatbotBtn}
        onPress={() => setShowChatbot(!showChatbot)}
      >
        <Text style={styles.chatbotIcon}>💬</Text>
      </TouchableOpacity>

      {/* Buy Modal */}
      <Modal
        visible={showBuyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBuyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invest in {fundData.name}</Text>
              <TouchableOpacity onPress={() => setShowBuyModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.investTypeToggle}>
              <TouchableOpacity
                onPress={() => setInvestmentType('sip')}
                style={[styles.toggleBtn, investmentType === 'sip' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, investmentType === 'sip' && styles.toggleTextActive]}>SIP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setInvestmentType('lumpsum')}
                style={[styles.toggleBtn, investmentType === 'lumpsum' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, investmentType === 'lumpsum' && styles.toggleTextActive]}>Lumpsum</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountInput}>
              <Text style={styles.inputLabel}>Enter Amount</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="5000"
                  placeholderTextColor="#666"
                  style={styles.input}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.quickAmounts}>
              {['1000', '5000', '10000', '25000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setAmount(amt)}
                  style={styles.quickAmountBtn}
                >
                  <Text style={styles.quickAmountText}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {amount && (
              <View style={styles.investmentPreview}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Units</Text>
                  <Text style={styles.previewValue}>{calculateUnits()}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>NAV</Text>
                  <Text style={styles.previewValue}>₹{fundData.nav}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.investButton}>
              <Text style={styles.investButtonText}>Continue to Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chatbot Modal */}
      {showChatbot && (
        <View style={styles.chatbotModal}>
          <View style={styles.chatbotHeader}>
            <Text style={styles.chatbotTitle}>Fund Assistant</Text>
            <TouchableOpacity onPress={() => setShowChatbot(false)}>
              <Text style={styles.chatbotClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.chatbotMessages}>
            <View style={styles.chatMessage}>
              <Text style={styles.chatMessageText}>Hi! How can I help you with this fund?</Text>
            </View>
          </ScrollView>
          <View style={styles.chatbotSuggestions}>
            <TouchableOpacity style={styles.suggestionChip}>
              <Text style={styles.suggestionText}>Tax benefits?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.suggestionChip}>
              <Text style={styles.suggestionText}>How to invest?</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { padding: 8 },
  backButtonText: { color: '#fff', fontSize: 16 },
  watchlistBtn: { padding: 8 },
  watchlistIcon: { fontSize: 24, color: '#fff' },
  content: { flex: 1 },
  fundHeaderCard: { margin: 20, padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16 },
  fundTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  fundIconBox: { width: 48, height: 48, backgroundColor: 'rgba(107, 80, 196, 0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fundIcon: { fontSize: 24 },
  fundTitleInfo: { flex: 1 },
  fundName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  fundCode: { fontSize: 12, color: '#999' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  navLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  navValue: { fontSize: 28, fontWeight: '700', color: '#fff' },
  changeBox: { alignItems: 'flex-end' },
  changeValue: { fontSize: 16, fontWeight: '600', color: '#10b981', marginBottom: 2 },
  changePercent: { fontSize: 12, color: '#10b981' },
  quickStats: { flexDirection: 'row', justifyContent: 'space-between' },
  quickStat: { alignItems: 'center' },
  quickStatLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
  quickStatValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  starContainer: { flexDirection: 'row', gap: 2 },
  star: { fontSize: 14, color: '#444' },
  starFilled: { color: '#f59e0b' },
  chartSection: { marginHorizontal: 20, marginBottom: 20 },
  periodSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  periodBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  periodBtnActive: { backgroundColor: '#6b50c4' },
  periodText: { fontSize: 12, color: '#999', fontWeight: '500' },
  periodTextActive: { color: '#fff' },
  chart: { borderRadius: 16, marginVertical: 8 },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#6b50c4' },
  tabText: { fontSize: 14, color: '#999', fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  tabContent: { marginHorizontal: 20, marginBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 16 },
  infoSection: { marginBottom: 24 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { width: '48%', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  holdingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12 },
  holdingInfo: { flex: 1, marginRight: 12 },
  holdingName: { fontSize: 14, color: '#fff', marginBottom: 8, fontWeight: '500' },
  holdingBar: { height: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' },
  holdingBarFill: { height: '100%', backgroundColor: '#6b50c4' },
  holdingStats: { alignItems: 'flex-end' },
  holdingAllocation: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  holdingChange: { fontSize: 12, fontWeight: '500' },
  positive: { color: '#10b981' },
  negative: { color: '#ef4444' },
  sectorCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12 },
  sectorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  sectorName: { fontSize: 14, color: '#fff', fontWeight: '500' },
  sectorRight: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  sectorBar: { height: 6, width: 60, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, marginRight: 12, overflow: 'hidden' },
  sectorBarFill: { height: '100%' },
  sectorAllocation: { fontSize: 14, fontWeight: '700', color: '#fff', width: 50, textAlign: 'right' },
  returnsGrid: { flexDirection: 'row', gap: 12 },
  returnCard: { flex: 1, backgroundColor: 'rgba(107, 80, 196, 0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(107, 80, 196, 0.3)', alignItems: 'center' },
  returnPeriod: { fontSize: 12, color: '#999', marginBottom: 8 },
  returnValue: { fontSize: 20, fontWeight: '700', color: '#10b981' },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, padding: 20, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  actionButton: { flex: 1, backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  actionButtonSecondary: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  actionButtonTextSecondary: { fontSize: 16, fontWeight: '600', color: '#fff' },
  chatbotBtn: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, backgroundColor: '#6b50c4', borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#6b50c4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  chatbotIcon: { fontSize: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 24, color: '#999' },
  investTypeToggle: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#6b50c4' },
  toggleText: { fontSize: 14, color: '#999', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  amountInput: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#999', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingHorizontal: 16 },
  currencySymbol: { fontSize: 18, color: '#999', marginRight: 8 },
  input: { flex: 1, color: '#fff', fontSize: 18, paddingVertical: 16 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  quickAmountBtn: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  quickAmountText: { fontSize: 13, color: '#6b50c4', fontWeight: '600' },
  investmentPreview: { backgroundColor: 'rgba(107, 80, 196, 0.1)', borderWidth: 1, borderColor: 'rgba(107, 80, 196, 0.3)', borderRadius: 12, padding: 16, marginBottom: 24 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontSize: 14, color: '#999' },
  previewValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  investButton: { backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  investButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  chatbotModal: { position: 'absolute', bottom: 100, right: 20, width: screenWidth - 40, backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  chatbotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  chatbotTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  chatbotClose: { fontSize: 20, color: '#999' },
  chatbotMessages: { maxHeight: 200, padding: 16 },
  chatMessage: { backgroundColor: 'rgba(107, 80, 196, 0.1)', padding: 12, borderRadius: 12, marginBottom: 12 },
  chatMessageText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  chatbotSuggestions: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 0 },
  suggestionChip: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  suggestionText: { fontSize: 12, color: '#6b50c4', fontWeight: '500' },
});

export default TradingScreen;