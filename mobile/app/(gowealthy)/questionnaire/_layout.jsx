import { Stack } from 'expo-router';

export default function QuestionnaireLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="section1" />
      <Stack.Screen name="section2" />
      <Stack.Screen name="section3" />
      <Stack.Screen name="section4" />
      <Stack.Screen name="section5" />
    </Stack>
  );
}