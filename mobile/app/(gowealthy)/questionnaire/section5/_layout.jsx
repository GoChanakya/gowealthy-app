import { Stack } from 'expo-router';

export default function Section5Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="screen19" />
      <Stack.Screen name="screen20" />
      <Stack.Screen name="screen21" />
      <Stack.Screen name="screen22" />
      {/* Add more screens as you build them */}
    </Stack>
  );
}