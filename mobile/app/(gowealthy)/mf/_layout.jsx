import { Stack } from 'expo-router';
import { FEATURES } from '../../../src/config/features';
import FeatureGate from '../../../src/features/shell/FeatureGate';

/**
 * Mutual funds. Each screen keeps its own state in AsyncStorage and Firestore
 * (mf_onboarding/{phone}), so there's no provider here — the old questionnaire
 * context used to wrap this flow but nothing ever read it.
 */
export default function MutualFundsLayout() {
  return (
    <FeatureGate enabled={FEATURES.mutualFunds}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="trading" />
      </Stack>
    </FeatureGate>
  );
}
