import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readLocalCompletion, verifyCompletionRemotely } from '../src/features/onboarding/completion';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const ROUTES = {
  landing: '/(auth)/landing',
  questionnaire: '/(gowealthy)/questionnaire-v2/section1',
  app: '/(gowealthy)/dashboard',
};

/**
 * Boot gate. Three outcomes:
 *
 *   no / expired session   -> auth landing
 *   session, no blueprint  -> questionnaire-v2
 *   session + blueprint    -> the app shell (dashboard + GoWiser)
 *
 * The completion flag is read from AsyncStorage so this stays instant and works
 * offline. Only when it says "not completed" do we pay for a Firestore check —
 * that's the reinstall case, where the local flag is missing but the user has
 * in fact already finished.
 */
export default function RootIndex() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const route = async () => {
      try {
        const [[, token], [, phone], [, rawTs]] = await AsyncStorage.multiGet([
          'auth_token',
          'user_phone',
          'auth_timestamp',
        ]);

        const signedIn = token === 'verified' && !!phone;
        const expired = TOKEN_TTL_MS > 0 && Date.now() - parseInt(rawTs || '0', 10) > TOKEN_TTL_MS;

        if (!signedIn || expired) {
          await AsyncStorage.multiRemove(['auth_token', 'user_phone', 'auth_timestamp']);
          router.replace(ROUTES.landing);
          return;
        }

        if (await readLocalCompletion()) {
          router.replace(ROUTES.app);
          return;
        }

        // No local flag — could be a genuine new user, or a reinstall. Ask Firestore.
        // A null answer means we couldn't reach it; send them to the questionnaire
        // rather than stranding them on the splash.
        const completed = await verifyCompletionRemotely(phone);
        router.replace(completed === true ? ROUTES.app : ROUTES.questionnaire);
      } catch (e) {
        console.error('[boot] routing failed:', e);
        router.replace(ROUTES.landing);
      }
    };

    route();
  }, [ready]);

  return (
    <View style={{ flex: 1, backgroundColor: '#08060a', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#ff6a1a" />
    </View>
  );
}
