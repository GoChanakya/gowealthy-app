import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { QuestionnaireV2Provider } from "../../../src/context/QuestionnaireV2Context";
// ^ adjust relative path to match where you place QuestionnaireV2Context.jsx —
//   this assumes app/(gowealthy)/questionnaire-v2/_layout.jsx -> src/context/*

export default function QuestionnaireV2Layout() {
  // Fonts load ONCE here for the whole flow — every section screen just uses
  // FONT.* from src/lib/ui-kit.jsx without re-triggering its own load/flicker.
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: "#08060a" }} />;

  return (
    <QuestionnaireV2Provider>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="section1" />
        <Stack.Screen name="section2" />
        <Stack.Screen name="section3" />
        <Stack.Screen name="section4" />
        <Stack.Screen name="section5" />
      </Stack>
    </QuestionnaireV2Provider>
  );
}