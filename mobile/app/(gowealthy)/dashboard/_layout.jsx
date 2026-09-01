import { Stack } from 'expo-router';
import { FEATURES } from '../../../src/config/features';

/**
 * `index` is the app shell (dashboard + GoWiser + profile behind one tab bar).
 * `home` is the raw dashboard surface — still its own route so it can be opened
 * directly in a full build; the shell renders the same component inline.
 */
export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="investments" redirect={!FEATURES.investments} />
    </Stack>
  );
}
