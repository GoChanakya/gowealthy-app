import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './screens/HomeScreen';
import StockDetailScreen from './screens/StockDetailScreen';
import WatchlistScreen from './screens/WatchlistScreen';
import { hapticSmall } from '../../../src/lib/haptics';

const GoSharesShell = () => {
  const [currentScreen, setCurrentScreen] = useState(null);
  const [watchlistRefresh, setWatchlistRefresh] = useState(0);

  useEffect(() => {
    const syncUserId = async () => {
      const existing = await AsyncStorage.getItem('userId');
      if (!existing) {
        const phone = await AsyncStorage.getItem('user_phone');
        if (phone) {
          const userId = phone.replace(/\D/g, '').slice(-10);
          await AsyncStorage.setItem('userId', userId);
        }
      }
    };
    syncUserId();
  }, []);

  const navigation = {
    navigate: (name, params) => {
      hapticSmall();
      setCurrentScreen({ name, params });
    },
    goBack: () => {
      hapticSmall();
      setCurrentScreen(null);
      setWatchlistRefresh(prev => prev + 1);
    },
    replace: () => {},
    reset: () => {},
  };

  if (currentScreen?.name === 'StockDetail') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={s.backBar}>
          <TouchableOpacity onPress={navigation.goBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <StockDetailScreen
          route={{ params: currentScreen.params }}
          navigation={navigation}
        />
      </View>
    );
  }

  if (currentScreen?.name === 'Watchlist') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={s.backBar}>
          <TouchableOpacity onPress={navigation.goBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={s.screenTitle}>My Watchlist</Text>
        </View>
        <WatchlistScreen navigation={navigation} refreshTrigger={watchlistRefresh} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: Platform.OS === 'ios' ? 58 : 42 }}>
      <HomeScreen navigation={navigation} />
    </View>
  );
};

const s = StyleSheet.create({
  backBar: {
    paddingTop: Platform.OS === 'ios' ? 58 : 42,
    paddingBottom: 8,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  screenTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default GoSharesShell;
