import { Stack } from 'expo-router';

export default function Section2Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="screen7" />
      <Stack.Screen name="screen8" />
      <Stack.Screen name="screen9" />
      <Stack.Screen name="screen10" />
      <Stack.Screen name="screen11" />
      <Stack.Screen name="screen12" />
      <Stack.Screen name="screen13" />
    </Stack>
  );
}