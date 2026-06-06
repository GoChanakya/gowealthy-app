import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../../../src/config/firebase"; 
import { ALL_STOCKS, getStockBySymbol } from "../utils/_stockData";

export default function WatchlistScreen({ navigation, refreshTrigger }) {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTag, setFilterTag] = useState("All");
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [addStockModalVisible, setAddStockModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tagInput, setTagInput] = useState("");

  // Add stock search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Reload watchlist when screen comes into focus
  useEffect(() => { loadWatchlist(); }, [refreshTrigger]);

  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const watchlistRef = collection(
        db,
        "products",
        "goshares",
        "users",
        userId,
        "userStocks",
      );
      const snapshot = await getDocs(watchlistRef);

      const stocks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setWatchlist(stocks);
    } catch (error) {
      console.error("Error loading watchlist:", error);
      Alert.alert("Error", "Failed to load watchlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStockToWatchlist = async (stock) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "Please login again");
        return;
      }

      // Check if already in watchlist
      const exists = watchlist.find((s) => s.symbol === stock.symbol);
      if (exists) {
        Alert.alert("Already Added", "This stock is already in your watchlist");
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
      await setDoc(watchlistRef, {
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        addedAt: new Date().toISOString(),
        tag: "",
      });

      // Reload watchlist
      await loadWatchlist();

      setAddStockModalVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      Alert.alert("Success", "Stock added to watchlist");
    } catch (error) {
      console.error("Error adding stock:", error);
      Alert.alert("Error", "Failed to add stock");
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);

    if (text.length >= 2) {
      const lowerQuery = text.toLowerCase();
      const results = ALL_STOCKS.filter(
        (stock) =>
          stock.name.toLowerCase().includes(lowerQuery) ||
          stock.symbol.toLowerCase().includes(lowerQuery),
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) {
      Alert.alert("Error", "Please enter a tag");
      return;
    }

    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const stockRef = doc(
        db,
        "products",
        "goshares",
        "users",
        userId,
        "userStocks",
        selectedStock.id,
      );
      await updateDoc(stockRef, {
        tag: tagInput.trim(),
      });

      setWatchlist((prev) =>
        prev.map((stock) =>
          stock.id === selectedStock.id
            ? { ...stock, tag: tagInput.trim() }
            : stock,
        ),
      );

      setTagModalVisible(false);
      setTagInput("");
      Alert.alert("Success", "Tag added successfully");
    } catch (error) {
      console.error("Error adding tag:", error);
      Alert.alert("Error", "Failed to add tag");
    }
  };

  const handleRemoveTag = async (stock) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const stockRef = doc(
        db,
        "products",
        "goshares",
        "users",
        userId,
        "userStocks",
        stock.id,
      );
      await updateDoc(stockRef, {
        tag: "",
      });

      setWatchlist((prev) =>
        prev.map((s) => (s.id === stock.id ? { ...s, tag: "" } : s)),
      );

      Alert.alert("Success", "Tag removed");
    } catch (error) {
      console.error("Error removing tag:", error);
      Alert.alert("Error", "Failed to remove tag");
    }
  };

  const handleRemoveFromWatchlist = async (stock) => {
    Alert.alert(
      "Remove from Watchlist",
      `Remove ${stock.name} from your watchlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem("userId");
              if (!userId) return;

              const stockRef = doc(
                db,
                "products",
                "goshares",
                "users",
                userId,
                "userStocks",
                stock.id,
              );
              await deleteDoc(stockRef);

              setWatchlist((prev) => prev.filter((s) => s.id !== stock.id));
              Alert.alert("Success", "Removed from watchlist");
            } catch (error) {
              console.error("Error removing from watchlist:", error);
              Alert.alert("Error", "Failed to remove from watchlist");
            }
          },
        },
      ],
    );
  };

  const openTagModal = (stock) => {
    setSelectedStock(stock);
    setTagInput(stock.tag || "");
    setTagModalVisible(true);
  };

  const handleStockPress = (item) => {
    const stockData = getStockBySymbol(item.symbol);

    if (stockData) {
      navigation.navigate("StockDetail", { stock: stockData });
    } else {
      Alert.alert("Error", "Could not load stock details");
    }
  };

  // Get unique tags
  const uniqueTags = [
    "All",
    ...new Set(watchlist.filter((s) => s.tag).map((s) => s.tag)),
  ];

  // Filter watchlist
  const filteredWatchlist =
    filterTag === "All"
      ? watchlist
      : watchlist.filter((s) => s.tag === filterTag);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8500" />
      </View>
    );
  }

  if (watchlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={64} color="#666" />
        <Text style={styles.emptyTitle}>Your Watchlist is Empty</Text>
        <Text style={styles.emptyText}>
          Add stocks to your watchlist to track them easily
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setAddStockModalVisible(true)}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.emptyButtonText}>Add Stock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tags */}
      {uniqueTags.length > 1 && (
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={uniqueTags}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterTag === item && styles.filterPillActive,
                ]}
                onPress={() => setFilterTag(item)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterTag === item && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filterContent}
          />
        </View>
      )}

      {/* Watchlist */}
      <FlatList
        data={filteredWatchlist}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const stockData = getStockBySymbol(item.symbol);
          return (
            <View style={styles.stockCard}>
              <TouchableOpacity
                style={styles.stockContent}
                onPress={() => handleStockPress(item)}
              >
                {/* Top Row: Name | Date | Price & Delete */}
                <View style={styles.topRow}>
                  <View style={styles.stockNameContainer}>
                    <Text style={styles.stockName}>{item.name}</Text>
                  </View>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {new Date(item.addedAt)
                        .toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })
                        .replace(/ /g, " ")}
                    </Text>
                  </View>
                  <View style={styles.priceDeleteContainer}>
                    <Text style={styles.stockPrice}>
                      ₹{stockData?.price.toLocaleString() || "N/A"}
                    </Text>
                    {/* <TouchableOpacity 
                      onPress={() => handleRemoveFromWatchlist(item)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity> */}
                  </View>
                </View>

                {/* Bottom Row: Tag | Return */}
                <View style={styles.bottomRow}>
                  <View style={styles.tagSection}>
                    {item.tag ? (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.tag}</Text>
                        <TouchableOpacity onPress={() => handleRemoveTag(item)}>
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color="#532EA6"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addTagBtn}
                        onPress={() => openTagModal(item)}
                      >
                        <Text style={styles.addTagText}>Add Tag</Text>
                        <Ionicons name="add-circle" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.returnSection}>
                    <Text style={styles.returnText}>
                      {stockData?.change >= 0 ? "+" : ""}
                      {stockData?.change || 0}% Return
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemoveFromWatchlist(item)}
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => setAddStockModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Stock Modal */}
      <Modal
        visible={addStockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddStockModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setAddStockModalVisible(false);
            setSearchQuery("");
            setSearchResults([]);
          }}
        >
          <View
            style={styles.addStockModal}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.addStockTitle}>Add Stock to Watchlist</Text>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#999"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stocks by name or symbol..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {searchQuery.length < 2 && (
              <Text style={styles.instructionText}>
                Type at least 2 characters to search
              </Text>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <Text style={styles.noResults}>No stocks found</Text>
            )}

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const inWatchlist = watchlist.find(
                  (s) => s.symbol === item.symbol,
                );
                return (
                  <TouchableOpacity
                    style={[
                      styles.searchResultItem,
                      inWatchlist && styles.searchResultItemDisabled,
                    ]}
                    onPress={() =>
                      !inWatchlist && handleAddStockToWatchlist(item)
                    }
                    disabled={!!inWatchlist}
                  >
                    <View style={styles.resultLeft}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultSymbol}>{item.symbol}</Text>
                    </View>
                    <View style={styles.resultRight}>
                      <Text style={styles.resultPrice}>
                        ₹{item.price.toLocaleString()}
                      </Text>
                      {inWatchlist ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#10b981"
                        />
                      ) : (
                        <Ionicons name="add-circle" size={24} color="#FF8500" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              style={styles.resultsList}
              contentContainerStyle={styles.resultsContent}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tag Modal */}
      <Modal
        visible={tagModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTagModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTagModalVisible(false)}
        >
          <View
            style={styles.modalContainer}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>
              Add Tag for {selectedStock?.name}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="e.g., Ankur, Long-term, etc."
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTagModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddTag}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: "#FF8500",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  addButton: {
    backgroundColor: "#FF8500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterPill: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  filterPillActive: {
    backgroundColor: "#FF8500",
    borderColor: "#FF8500",
  },
  filterText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  stockCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
    position: "relative",
  },
  stockContent: {
    gap: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockNameContainer: {
    flex: 2,
  },
  stockName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  dateContainer: {
    flex: 1.5,
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#999",
  },
  priceDeleteContainer: {
    flex: 2,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  stockPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF8500",
  },
  // deleteBtn: {
  //   padding: 4,
  // },
  deleteBtn: {
    position: "absolute", // ADD THIS
    top: 12, // ADD THIS
    right: 12, // ADD THIS
    padding: 4,
    zIndex: 10, // ADD THIS
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagSection: {
    flex: 1,
  },
  returnSection: {
    alignItems: "flex-end",
  },
  returnText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCD2FC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 8,
  },
  tagText: {
    color: "#532EA6",
    fontSize: 12,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  addTagBtn: {
    backgroundColor: "#FF8500",
    paddingVertical: 6, // Changed from 10
    paddingHorizontal: 12, // Changed from 16
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4, // Changed from 6
    width: "40%",
  },
  addTagText: {
    color: "#fff",
    fontSize: 11, // Changed from 13
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    borderWidth: 1,
    borderColor: "#333",
  },
  addStockModal: {
    backgroundColor: "#1a1a1a",
    padding: 24,
    borderRadius: 16,
    width: "90%",
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "#333",
  },
  addStockTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  instructionText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  noResults: {
    color: "#999",
    textAlign: "center",
    padding: 24,
    fontSize: 14,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 20,
  },
  searchResultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#0a0a0a",
  },
  searchResultItemDisabled: {
    opacity: 0.5,
  },
  resultLeft: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  resultSymbol: {
    fontSize: 12,
    color: "#999",
  },
  resultRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF8500",
  },
  modalInput: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: "#FF8500",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  floatingAddButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF8500",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#FF8500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
