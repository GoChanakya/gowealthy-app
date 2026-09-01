import { Stack } from 'expo-router';

export default function GoWealthyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* The signed-in app. `dashboard/index` is the shell. */}
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="questionnaire-v2" />

      {/* Parked in the shipped build — each group's _layout carries a FeatureGate. */}
      <Stack.Screen name="index" />
      <Stack.Screen name="goshares" />
      <Stack.Screen name="mf" />
      <Stack.Screen name="questionnaire" />
    </Stack>
  );
}
