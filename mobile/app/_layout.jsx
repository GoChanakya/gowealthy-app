import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(gowealthy)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="dashboard" />
        </Stack>
        <Toast />
      </GestureHandlerRootView>
    </>
  );
}