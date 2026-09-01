import { Stack } from 'expo-router';
import { FEATURES } from '../../../src/config/features';
import FeatureGate from '../../../src/features/shell/FeatureGate';

export default function GoSharesLayout() {
  return (
    <FeatureGate enabled={FEATURES.goShares}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
      </Stack>
    </FeatureGate>
  );
}
