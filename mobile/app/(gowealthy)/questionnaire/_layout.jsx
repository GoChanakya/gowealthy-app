import { Stack } from 'expo-router';
import { QuestionnaireProvider } from '../../../src/context/QuestionnaireContext';
import { FEATURES } from '../../../src/config/features';
import FeatureGate from '../../../src/features/shell/FeatureGate';

/** The original questionnaire, superseded by questionnaire-v2. */
export default function QuestionnaireLayout() {
  return (
    <FeatureGate enabled={FEATURES.questionnaireV1}>
      <QuestionnaireProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="section1" />
          <Stack.Screen name="section2" />
          <Stack.Screen name="section3" />
          <Stack.Screen name="section4" />
          <Stack.Screen name="section5" />
        </Stack>
      </QuestionnaireProvider>
    </FeatureGate>
  );
}
