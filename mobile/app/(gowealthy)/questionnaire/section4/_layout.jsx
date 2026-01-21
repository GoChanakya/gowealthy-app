import { Stack } from 'expo-router';

export default function Section1Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="screen15" />
      <Stack.Screen name="screen16" />
      <Stack.Screen name="screen17" />
      <Stack.Screen name="screen18" />
    </Stack>
  );
}