// import { Redirect } from 'expo-router';

// export default function Index() {
//   // For now, directly go to screen1 for testing
//   return <Redirect href="/(gowealthy)/questionnaire/section1/screen1" />;
// }

// import { Redirect } from 'expo-router';

// export default function Index() {
//   return <Redirect href="/(gowealthy)" />;
// }

// import { useEffect } from 'react';
// import { View, ActivityIndicator } from 'react-native';
// import { useRouter } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// /**
//  * Root entry point — checks the same AsyncStorage keys that screen19 writes:
//  *   'user_phone'       → set after successful OTP verification
//  *   'auth_token'       → 'verified' flag set by otp.jsx
//  *   'auth_timestamp'   → written at verification time
//  *
//  * If valid → user goes directly to /(gowealthy) (skips login entirely)
//  * If missing/expired → user goes to /(auth)/login
//  *
//  * Session TTL: 30 days (set to 0 to disable expiry)
//  */
// const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// export default function RootIndex() {
//   const router = useRouter();

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     try {
//       const [token, phone, timestamp] = await AsyncStorage.multiGet([
//         'auth_token',
//         'user_phone',
//         'auth_timestamp',
//       ]);

//       const hasToken = token[1] === 'verified';
//       const hasPhone = !!phone[1];
//       const ts = parseInt(timestamp[1] || '0', 10);
//       const isExpired = TOKEN_TTL_MS > 0 && (Date.now() - ts > TOKEN_TTL_MS);

//       if (hasToken && hasPhone && !isExpired) {
//         // Already logged in → go straight to app
//         router.replace('/(gowealthy)');
//       } else {
//         // Clear any stale data
//         await AsyncStorage.multiRemove(['auth_token', 'user_phone', 'auth_timestamp']);
//         router.replace('/(auth)/login');
//       }
//     } catch (_) {
//       router.replace('/(auth)/login');
//     }
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
//       <ActivityIndicator size="large" color="#FF8500" />
//     </View>
//   );
// }

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