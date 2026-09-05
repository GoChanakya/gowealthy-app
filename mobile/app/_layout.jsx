import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useFonts, Syne_700Bold, Syne_600SemiBold } from '@expo-google-fonts/syne';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, ScrollView, Alert } from 'react-native';
import XPCelebrationHost from '../src/components/XPCelebration';

class ErrorBoundary extends React.Component {
  state = { error: null };
  componentDidCatch(error) {
    const msg = error?.message + '\n\n' + error?.stack;
    this.setState({ error: msg });
    Alert.alert('Component Error!', msg.substring(0, 400), [{ text: 'OK' }]);
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#000', padding: 40 }}>
          <Text style={{ color: 'red', fontSize: 14, marginTop: 60 }}>
            {this.state.error}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [fontTimeout, setFontTimeout] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    Syne_600SemiBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    // Ember-forge typography — loaded once here so every flow (questionnaire-v2,
    // dashboard, gowiser) can use FONT.* from src/lib/ui-kit without its own gate.
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFontTimeout(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || fontTimeout) {
      // ready
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  if (!fontsLoaded && !fontError && !fontTimeout) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08060a' }}>
        <ActivityIndicator color="#ff6a1a" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#08060a' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#08060a' }
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(gowealthy)" />
        </Stack>
        <Toast />
        <XPCelebrationHost />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}