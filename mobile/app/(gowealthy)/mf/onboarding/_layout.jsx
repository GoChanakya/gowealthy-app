import { Stack } from 'expo-router';

export default function onboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false ,animation: 'slide_from_right', }}>
      <Stack.Screen name="screen1" />
      <Stack.Screen name="screen2" />
      <Stack.Screen name="screen3" />
      <Stack.Screen name="screen4" />
      <Stack.Screen name="screen5" />
      <Stack.Screen name="screen6" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="trading" />
      {/* Add more screens as you build them */}
    </Stack>
  );
}