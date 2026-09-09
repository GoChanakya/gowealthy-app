import { Stack } from 'expo-router';

export default function GoWealthyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* The signed-in app. `dashboard/index` is the shell. */}
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="questionnaire-v2" />
      <Stack.Screen name="gowiser" />

      {/* Gated in the shipped build — see each group's _layout. */}
      <Stack.Screen name="mf" />
      <Stack.Screen name="goshares" />
    </Stack>
  );
}
