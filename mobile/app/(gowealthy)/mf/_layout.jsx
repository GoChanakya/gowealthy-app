import { Stack } from 'expo-router';
import { QuestionnaireProvider } from '../../../src/context/QuestionnaireContext';
import { FEATURES } from '../../../src/config/features';
import FeatureGate from '../../../src/features/shell/FeatureGate';

export default function mfLayout() {
  return (
    <FeatureGate enabled={FEATURES.mutualFunds}>
      <QuestionnaireProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="trading" />
        </Stack>
      </QuestionnaireProvider>
    </FeatureGate>
  );
}
