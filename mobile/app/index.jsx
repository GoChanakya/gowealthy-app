import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export default function RootIndex() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const checkAuth = async () => {
      try {
        const results = await AsyncStorage.multiGet([
          'auth_token', 'user_phone', 'auth_timestamp',
        ]);
        const token = results[0][1];
        const phone = results[1][1];
        const ts = parseInt(results[2][1] || '0', 10);
        const isValid = token === 'verified' && !!phone;
        const isExpired = TOKEN_TTL_MS > 0 && (Date.now() - ts > TOKEN_TTL_MS);
        if (isValid && !isExpired) {
          router.replace('/(gowealthy)');
        } else {
          await AsyncStorage.multiRemove(['auth_token', 'user_phone', 'auth_timestamp']);
          router.replace('/(auth)/landing');
        }
      } catch (e) {
        router.replace('/(auth)/landing');
      }
    };
    checkAuth();
  }, [ready]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#FF8500" />
    </View>
  );
}