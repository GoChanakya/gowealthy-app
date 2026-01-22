import { Stack } from 'expo-router';

export default function Section1Layout() {
  return (
    <Stack screenOptions={{ headerShown: false,animation: 'slide_from_right', }}>
      <Stack.Screen name="screen1" />
      <Stack.Screen name="screen2" />
      <Stack.Screen name="screen3" />
      <Stack.Screen name="screen4" />
      <Stack.Screen name="screen5" />
      <Stack.Screen name="screen6" />
    </Stack>
  );
}