import { Stack } from 'expo-router';
import { QuestionnaireProvider } from '../../../src/context/QuestionnaireContext';

export default function mfLayout() {
  return (
    <QuestionnaireProvider>
      <Stack screenOptions={{ headerShown: false,animation: 'slide_from_right', }}>
        <Stack.Screen name="onboarding" />
      </Stack>
    </QuestionnaireProvider>
  );
}