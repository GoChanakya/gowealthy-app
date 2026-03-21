// import { Ionicons } from '@expo/vector-icons';
// import { useState } from 'react';
// import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import HomeScreen from './screens/HomeScreen';
// import StockDetailScreen from './screens/StockDetailScreen';
// import WatchlistScreen from './screens/WatchlistScreen';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useEffect } from 'react';

// const GoSharesShell = () => {
//   const [innerTab, setInnerTab] = useState('stocks');
//   const [currentScreen, setCurrentScreen] = useState(null);
//   const [watchlistRefresh, setWatchlistRefresh] = useState(0);

//   useEffect(() => {
//   const syncUserId = async () => {
//     const existing = await AsyncStorage.getItem('userId');
//     if (!existing) {
//       const phone = await AsyncStorage.getItem('user_phone');
//       if (phone) {
//         const userId = phone.replace(/\D/g, '').slice(-10);
//         await AsyncStorage.setItem('userId', userId);
//       }
//     }
//   };
//   syncUserId();
// }, []);

//   const navigation = {
//     navigate: (name, params) => setCurrentScreen({ name, params }),
//     goBack: () => {
//       setCurrentScreen(null);
//       setWatchlistRefresh(prev => prev + 1);
//     },
//     replace: () => {},
//     reset: () => {},
//   };

//   if (currentScreen?.name === 'StockDetail') {
//     return (
//       <View style={{ flex: 1, backgroundColor: '#000' }}>
//         <View style={s.backBar}>
//           <TouchableOpacity onPress={navigation.goBack} style={s.backBtn}>
//             <Ionicons name="chevron-back" size={24} color="#fff" />
//             <Text style={s.backText}>Back</Text>
//           </TouchableOpacity>
//         </View>
//         <StockDetailScreen
//           route={{ params: currentScreen.params }}
//           navigation={navigation}
//         />
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1, backgroundColor: '#000' }}>
//       <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 58 : 42 }}>
//         {innerTab === 'stocks' && <HomeScreen navigation={navigation} />}
//         {innerTab === 'watchlist' && (
//           <WatchlistScreen navigation={navigation} refreshTrigger={watchlistRefresh} />
//         )}
//       </View>

//       <View style={s.tabBar}>
//         {[
//           { key: 'stocks', label: 'Stocks', icon: 'trending-up' },
//           { key: 'watchlist', label: 'Watchlist', icon: 'star' },
//         ].map(tab => {
//           const active = innerTab === tab.key;
//           return (
//             <TouchableOpacity
//               key={tab.key}
//               style={s.tab}
//               onPress={() => setInnerTab(tab.key)}
//               activeOpacity={0.7}
//             >
//               <Ionicons
//                 name={active ? tab.icon : `${tab.icon}-outline`}
//                 size={22}
//                 color={active ? '#FF8500' : '#666'}
//               />
//               <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
//               {active && <View style={s.dot} />}
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     </View>
//   );
// };

// const s = StyleSheet.create({
//   backBar: {
//     paddingTop: Platform.OS === 'ios' ? 58 : 42,
//     paddingBottom: 8,
//     backgroundColor: '#000',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255,255,255,0.08)',
//   },
//   backBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     gap: 4,
//   },
//   backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   tabBar: {
//     flexDirection: 'row',
//     height: 72,
//     backgroundColor: '#0d1117',
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255,255,255,0.08)',
//   },
//   tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
//   tabLabel: { fontSize: 11, color: '#666', fontWeight: '500', marginTop: 4 },
//   tabLabelActive: { color: '#FF8500', fontWeight: '700' },
//   dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF8500', marginTop: 4 },
// });

// export default GoSharesShell;

import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './screens/HomeScreen';
import StockDetailScreen from './screens/StockDetailScreen';
import WatchlistScreen from './screens/WatchlistScreen';

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
    navigate: (name, params) => setCurrentScreen({ name, params }),
    goBack: () => {
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