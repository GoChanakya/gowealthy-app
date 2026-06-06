import { Stack } from 'expo-router';

export default function TradingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="funds" />
      <Stack.Screen name="fund-detail" />
      <Stack.Screen name="sip-amount" />
      <Stack.Screen name="sip-mandate" />
      <Stack.Screen name="sip-confirm" />
    </Stack>
  );
}