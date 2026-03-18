import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 30 days session — set to 0 to never expire
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const results = await AsyncStorage.multiGet([
        'auth_token',
        'user_phone',
        'auth_timestamp',
      ]);

      const token = results[0][1];
      const phone = results[1][1];
      const ts    = parseInt(results[2][1] || '0', 10);

      const isValid   = token === 'verified' && !!phone;
      const isExpired = TOKEN_TTL_MS > 0 && (Date.now() - ts > TOKEN_TTL_MS);

      if (isValid && !isExpired) {
        // Already logged in → skip auth entirely
        router.replace('/(gowealthy)');
      } else {
        await AsyncStorage.multiRemove(['auth_token', 'user_phone', 'auth_timestamp']);
        // Show landing page first
        router.replace('/(auth)/landing');
      }
    } catch (_) {
      router.replace('/(auth)/landing');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#FF8500" />
    </View>
  );
}