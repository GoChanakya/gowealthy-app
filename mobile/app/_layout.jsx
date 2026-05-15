// import React from 'react';
// import { Stack } from 'expo-router';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import Toast from 'react-native-toast-message';
// import { useFonts, Syne_700Bold, Syne_600SemiBold } from '@expo-google-fonts/syne';
// import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
// import * as SplashScreen from 'expo-splash-screen';
// import { useEffect } from 'react';
// import { View, ActivityIndicator, Text, ScrollView, Alert } from 'react-native';

// class ErrorBoundary extends React.Component {
//   state = { error: null };
//   componentDidCatch(error) {
//     const msg = error?.message + '\n\n' + error?.stack;
//     this.setState({ error: msg });
//     Alert.alert('Component Error!', msg.substring(0, 400), [{ text: 'OK' }]);
//   }
//   render() {
//     if (this.state.error) {
//       return (
//         <ScrollView style={{ flex: 1, backgroundColor: '#000', padding: 40 }}>
//           <Text style={{ color: 'red', fontSize: 14, marginTop: 60 }}>
//             {this.state.error}
//           </Text>
//         </ScrollView>
//       );
//     }
//     return this.props.children;
//   }
// }

// export default function RootLayout() {
//   Alert.alert('4. RootLayout rendering');
//   const [fontsLoaded, fontError] = useFonts({
//     Syne_700Bold,
//     Syne_600SemiBold,
//     SpaceGrotesk_400Regular,
//     SpaceGrotesk_500Medium,
//   });

//   useEffect(() => {
//     if (fontsLoaded) {
//       Alert.alert('Fonts Loaded!', 'proceeding to app');
//       SplashScreen.hideAsync().catch(() => {});
//     }
//     if (fontError) {
//       Alert.alert('Font Error!', fontError?.message || 'unknown font error');
//       SplashScreen.hideAsync().catch(() => {});
//     }
//   }, [fontsLoaded, fontError]);

//   if (!fontsLoaded && !fontError) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
//         <ActivityIndicator color="#FF8500" />
//       </View>
//     );
//   }

//   return (
//     <ErrorBoundary>
//       <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
//         <Stack
//           screenOptions={{
//             headerShown: false,
//             contentStyle: { backgroundColor: '#000' }
//           }}
//         />
//         <Toast />
//       </GestureHandlerRootView>
//     </ErrorBoundary>
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
import { View, ActivityIndicator, Text, ScrollView, Alert } from 'react-native';

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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    Syne_600SemiBold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      Alert.alert('Fonts loaded!');
      SplashScreen.hideAsync().catch(() => {});
    }
    if (fontError) {
      Alert.alert('Font Error!', fontError?.message || 'unknown');
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#FF8500" />
      </View>
    );
  }

  return (
  <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' }
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(gowealthy)" />
      </Stack>
      <Toast />
    </GestureHandlerRootView>
  </ErrorBoundary>
);
}