import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../../../src/config/firebase"; 

export default function StockDetailScreen({ route, navigation }) {
  const { stock } = route.params;
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkWatchlistStatus();
  }, []);

  const checkWatchlistStatus = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const watchlistRef = doc(
        db,
        "products",
        "goshares",
        "users",
        userId,
        "userStocks",
        stock.symbol,
      );
      const watchlistDoc = await getDoc(watchlistRef);
      setIsInWatchlist(watchlistDoc.exists());
    } catch (error) {
      console.error("Error checking watchlist:", error);
    }
  };

  const toggleWatchlist = async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const watchlistRef = doc(
        db,
        "products",
        "goshares",
        "users",
        userId,
        "userStocks",
        stock.symbol,
      );

      if (isInWatchlist) {
        // Remove from watchlist
        await deleteDoc(watchlistRef);
        setIsInWatchlist(false);
        Alert.alert("Success", "Removed from watchlist");
      } else {
        // Add to watchlist
        await setDoc(watchlistRef, {
          stockId: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          addedAt: new Date().toISOString(),
          tag: "", // User can add tag later
        });
        setIsInWatchlist(true);
        Alert.alert("Success", "Added to watchlist");
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      Alert.alert("Error", "Failed to update watchlist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.stockName}>{stock.name}</Text>
            <Text style={styles.stockSymbol}>{stock.symbol}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{stock.price.toLocaleString()}</Text>
            <Text
              style={[
                styles.change,
                stock.change >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {stock.change >= 0 ? "+" : ""}
              {stock.change}%
            </Text>
          </View>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Market Cap</Text>
            <Text style={styles.metricValue}>{stock.marketCap}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Sector</Text>
            <Text style={styles.metricValue}>{stock.sector}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Funds Buying</Text>
            <Text style={styles.metricValue}>{stock.fundsBuying}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Confidence</Text>
            <Text style={styles.metricValue}>{stock.confidence}%</Text>
          </View>
        </View>
      </View>

      {/* Confidence Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confidence Analysis</Text>

        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceBar}>
            <View
              style={[styles.confidenceFill, { width: `${stock.confidence}%` }]}
            />
          </View>
          <Text style={styles.confidenceText}>
            {stock.confidence}% of fund managers are bullish on this stock
          </Text>
        </View>
      </View>

      {/* Fund Manager Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fund Manager Activity</Text>

        <View style={styles.activityCard}>
          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>Buying</Text>
            <Text style={[styles.activityValue, styles.positive]}>
              {stock.fundsBuying} Funds
            </Text>
          </View>

          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>Holding</Text>
            <Text style={styles.activityValue}>234 Funds</Text>
          </View>

          <View style={styles.activityRow}>
            <Text style={styles.activityLabel}>Selling</Text>
            <Text style={[styles.activityValue, styles.negative]}>
              45 Funds
            </Text>
          </View>
        </View>
      </View>

      {/* Top Fund Managers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Fund Managers Holding</Text>

        <View style={styles.fundsList}>
          {[
            "HDFC AMC",
            "SBI Funds",
            "ICICI Prudential",
            "Aditya Birla",
            "Axis Mutual Fund",
          ].map((fund, index) => (
            <View key={index} style={styles.fundCard}>
              <Text style={styles.fundName}>{fund}</Text>
              <Text style={styles.fundStatus}>Buying</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About {stock.name}</Text>
        <Text style={styles.aboutText}>
          {stock.name} operates in the {stock.sector} sector with a market
          capitalization of {stock.marketCap}. The stock has been seeing strong
          interest from fund managers with {stock.fundsBuying} funds actively
          buying.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.primaryBtn, isInWatchlist && styles.removeBtn]}
          onPress={toggleWatchlist}
          disabled={isLoading}
        >
          <Ionicons
            name={isInWatchlist ? "star" : "star-outline"}
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryBtnText}>
            {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>View Full Analysis</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    padding: 20,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stockName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  stockSymbol: {
    fontSize: 14,
    color: "#999",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FF8500",
    marginBottom: 4,
  },
  change: {
    fontSize: 16,
    fontWeight: "600",
  },
  positive: {
    color: "#10b981",
  },
  negative: {
    color: "#ef4444",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  metricLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  confidenceContainer: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  confidenceBar: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: "#6C50C4",
  },
  confidenceText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
  },
  activityCard: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  activityLabel: {
    fontSize: 16,
    color: "#999",
  },
  activityValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  fundsList: {
    gap: 12,
  },
  fundCard: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fundName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  fundStatus: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
  },
  aboutText: {
    fontSize: 14,
    color: "#999",
    lineHeight: 22,
  },
  actionContainer: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  primaryBtn: {
    backgroundColor: "#FF8500",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  removeBtn: {
    backgroundColor: "#ef4444",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "#6C50C4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
