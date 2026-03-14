// import { Stack } from 'expo-router';

// export default function DashboardLayout() {
//   return (
//     <Stack screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="home" />
//       <Stack.Screen name="investments" />
//     </Stack>
//   );
// }

import React from "react";
import { Tabs } from "expo-router";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Text,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ChartCandlestick, Home } from "lucide-react-native";

const logo = require("../../../assets/logo_nobg.png");

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const ORANGE = "#FF6300";
const PURPLE = "#6C50C4";

// ─── Tab config ───────────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { name: "home",        label: "Home",        Icon: Home },
  { name: "investments", label: "Investments", Icon: ChartCandlestick },
];

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <BlurView intensity={55} tint="dark" style={styles.bar}>
        {/* Left glow accent */}
        <View style={styles.glowLeft} pointerEvents="none" />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { Icon, label } = TAB_ITEMS[index];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabItem}
            >
              {isFocused ? (
                <LinearGradient
                  colors={[ORANGE, PURPLE]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activepill}
                >
                  <Icon size={20} color="#fff" strokeWidth={2.2} />
                  <Text style={styles.activeLabel}>{label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactivePill}>
                  <Icon size={20} color="rgba(255,255,255,0.5)" strokeWidth={1.8} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Logo in the middle (decorative, non-tappable) */}
        <View style={styles.centerLogo} pointerEvents="none">
          <Image source={logo} style={styles.logoImg} resizeMode="contain" />
        </View>
      </BlurView>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"        options={{ title: "Home" }} />
      <Tabs.Screen name="investments" options={{ title: "Investments" }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 20,
    left: "5%",
    right: "5%",
  },

  bar: {
    flexDirection: "row",
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    ...Platform.select({
      android: { backgroundColor: "rgba(20,10,40,0.92)" },
    }),
  },

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabItem: {
    flex: 1,
    alignItems: "center",
  },

  activepill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },

  activeLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  inactivePill: {
    width: 48,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Center logo (decorative) ───────────────────────────────────────────────
  centerLogo: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -14 }],
    opacity: 0.18,
  },

  logoImg: {
    width: 28,
    height: 28,
  },

  // ── Glow ──────────────────────────────────────────────────────────────────
  glowLeft: {
    position: "absolute",
    top: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ORANGE,
    opacity: 0.12,
  },
});