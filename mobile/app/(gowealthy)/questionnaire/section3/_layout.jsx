import { Stack } from 'expo-router';

export default function Section3Layout() {
  return (
    <Stack screenOptions={{ headerShown: false , animation: 'slide_from_right'}}>
      <Stack.Screen name="screen14" />
    </Stack>
  );
}