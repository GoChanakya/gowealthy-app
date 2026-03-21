import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ALL_STOCKS, searchStocks } from '../utils/stockData';

export default function HomeScreen({ navigation }) {
  const [stocks, setStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadStocks();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchStocks(searchQuery);
      setSearchResults(results);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const loadStocks = async () => {
    try {
      // TODO: Replace with actual Firestore fetch from commonStocks collection
      // const stocksRef = collection(db, 'products', 'goshares', 'commonStocks');
      // const snapshot = await getDocs(stocksRef);
      // const stocksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setStocks(ALL_STOCKS);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

 
const handleStockPress = (stock) => {
  setShowDropdown(false);  // Close dropdown immediately
  setSearchQuery('');
  Keyboard.dismiss();
  navigation.navigate('StockDetail', { stock });
};

  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay to allow dropdown item click to register
    setTimeout(() => {
      setShowDropdown(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search stocks..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            // onBlur={handleSearchBlur}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown Search Results */}
{showDropdown && searchResults.length > 0 && (
  <View style={styles.dropdown}>
    <FlatList
      data={searchResults}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.dropdownItem}
          onPressIn={() => handleStockPress(item)}  // Changed from onPress
        >
          <View style={styles.dropdownLeft}>
            <Text style={styles.dropdownName}>{item.name}</Text>
            <Text style={styles.dropdownSymbol}>{item.symbol}</Text>
          </View>
          <Text style={styles.dropdownPrice}>₹{item.price.toLocaleString()}</Text>
        </TouchableOpacity>
      )}
      style={styles.dropdownList}
      nestedScrollEnabled
    />
  </View>
)}

        {/* No Results */}
        {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && (
          <View style={styles.dropdown}>
            <Text style={styles.noResults}>No stocks found</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        {/* <View style={styles.header}>
          <Text style={styles.headerTitle}>Top 10 Stocks</Text>
          <Text style={styles.headerSubtitle}>Based on Fund Manager Activity</Text>
        </View> */}
        <View style={styles.header}>
  <View style={styles.headerRow}>
    <Text style={styles.headerTitle}>Top 10 Stocks</Text>
    <TouchableOpacity
      style={styles.watchlistBtn}
      onPress={() => navigation.navigate('Watchlist')}
    >
      <Ionicons name="star" size={16} color="#FF8500" />
      <Text style={styles.watchlistBtnText}>Watchlist</Text>
    </TouchableOpacity>
  </View>
  <Text style={styles.headerSubtitle}>Based on Fund Manager Activity</Text>
</View>

        {/* Stock Cards */}
        <View style={styles.stocksContainer}>
          {stocks.map((stock) => (
            <TouchableOpacity
              key={stock.id}
              style={styles.stockCard}
              onPress={() => handleStockPress(stock)}
            >
              <View style={styles.stockHeader}>
                <View style={styles.stockLeft}>
                  <Text style={styles.stockName}>{stock.name}</Text>
                  <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                </View>
                <View style={styles.stockRight}>
                  <Text style={styles.stockPrice}>₹{stock.price.toLocaleString()}</Text>
                  <Text style={[
                    styles.stockChange, 
                    stock.change >= 0 ? styles.positive : styles.negative
                  ]}>
                    {stock.change >= 0 ? '+' : ''}{stock.change}%
                  </Text>
                </View>
              </View>

              <View style={styles.stockStats}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Funds Buying</Text>
                  <Text style={styles.statValue}>{stock.fundsBuying}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Confidence</Text>
                  <Text style={styles.statValue}>{stock.confidence}%</Text>
                </View>
              </View>

              <View style={styles.confidenceBar}>
                <View style={[styles.confidenceFill, { width: `${stock.confidence}%` }]} />
              </View>

              <View style={styles.stockFooter}>
                <Text style={styles.sector}>{stock.sector}</Text>
                <Text style={styles.marketCap}>MCap: {stock.marketCap}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 300,
    zIndex: 1001,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0a0a0a',
  },
  dropdownLeft: {
    flex: 1,
  },
  dropdownName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  dropdownSymbol: {
    fontSize: 12,
    color: '#999',
  },
  dropdownPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8500',
  },
  noResults: {
    color: '#999',
    textAlign: 'center',
    padding: 24,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  stocksContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  stockCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stockLeft: {
    flex: 1,
  },
  stockName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  stockSymbol: {
    fontSize: 12,
    color: '#999',
  },
  stockRight: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8500',
    marginBottom: 4,
  },
  stockChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  positive: {
    color: '#10b981',
  },
  negative: {
    color: '#ef4444',
  },
  stockStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C50C4',
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#6C50C4',
  },
  stockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sector: {
    fontSize: 12,
    color: '#999',
  },
  marketCap: {
    fontSize: 12,
    color: '#999',
  },
  headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 4,
},
watchlistBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: 'rgba(255,133,0,0.12)',
  borderWidth: 1,
  borderColor: 'rgba(255,133,0,0.30)',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 20,
},
watchlistBtnText: {
  color: '#FF8500',
  fontSize: 13,
  fontWeight: '700',
},
});