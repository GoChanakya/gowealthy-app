// import { Stack } from 'expo-router';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import Toast from 'react-native-toast-message';
// import { useFonts, Syne_700Bold, Syne_600SemiBold } from '@expo-google-fonts/syne';
// import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
// import * as SplashScreen from 'expo-splash-screen';
// import { useEffect } from 'react';
// import { View, ActivityIndicator } from 'react-native';

// export default function RootLayout() {
//   const [fontsLoaded] = useFonts({
//     Syne_700Bold,
//     Syne_600SemiBold,
//     SpaceGrotesk_400Regular,
//     SpaceGrotesk_500Medium,
//   });

//   useEffect(() => {
//     if (fontsLoaded) {
//       SplashScreen.hideAsync().catch(() => {});
//     }
//   }, [fontsLoaded]);

//   if (!fontsLoaded) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="(gowealthy)" />
//         <Stack.Screen name="index" />
//       </Stack>
//       <Toast />
//     </GestureHandlerRootView>
//   );
// }

import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useFonts, Syne_700Bold, Syne_600SemiBold } from '@expo-google-fonts/syne';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  state = { error: null };
  componentDidCatch(error) {
    this.setState({ error: error?.message + '\n\n' + error?.stack });
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_600SemiBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(gowealthy)" />
          <Stack.Screen name="index" />
        </Stack>
        <Toast />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}