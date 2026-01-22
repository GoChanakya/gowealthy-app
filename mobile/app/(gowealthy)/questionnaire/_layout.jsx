import { Stack } from 'expo-router';
import { QuestionnaireProvider } from '../../../src/context/QuestionnaireContext';

export default function QuestionnaireLayout() {
  return (
    <QuestionnaireProvider>
      <Stack screenOptions={{ headerShown: false,animation: 'slide_from_right', }}>
        <Stack.Screen name="section1" />
        <Stack.Screen name="section2" />
        <Stack.Screen name="section3" />
        <Stack.Screen name="section4" />
        <Stack.Screen name="section5" />
      </Stack>
    </QuestionnaireProvider>
  );
}