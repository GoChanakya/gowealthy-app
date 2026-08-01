import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, Pressable, Animated, Easing, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * kit.jsx — shared "ember forge" chrome for the whole v2 questionnaire flow.
 * Ported from the HTML's :root CSS vars + top-chrome/embers/button markup.
 * Every sectionN/index.jsx imports from here instead of redefining these —
 * keeps all 5 sections visually identical and avoids drift.
 */

/* ============================================================
   THEME — ported 1:1 from the HTML's :root block
   ============================================================ */
export const C = {
  bg: "#08060a", bg2: "#0e0a10", bg3: "#151019",
  surface: "#181219", surface2: "#1f1722",
  line: "rgba(255,180,120,0.09)", line2: "rgba(255,180,120,0.16)",
  ink: "#fbf5ef", muted: "#a99ba6", faint: "#332a36",
  o: "#ff6a1a", o2: "#ff8f3c", oDeep: "#d4470a",
  gold: "#f7c85a", gold2: "#ffe0a3",
  gd: "#4fd39a", rd: "#ff6b6b",
  glass: "rgba(30,22,34,0.72)",
};
export const RADIUS = { lg: 22, md: 15, sm: 11 };

export const FONT = {
  display: "SpaceGrotesk_700Bold",
  displaySemi: "SpaceGrotesk_600SemiBold",
  body: "Inter_400Regular",
  bodyMed: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
};

/** Font family name constants — actual font loading happens once in
 *  questionnaire-v2/_layout.jsx via useFonts(), not per-screen. */

/* ============================================================
   Ambient embers — rising particles, ported from .ember/@keyframes rise
   ============================================================ */
export function Embers() {
  const particles = useMemo(() => (
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      duration: 7000 + Math.random() * 8000,
      delay: Math.random() * 4000,
    }))
  ), []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map(p => <Ember key={p.id} {...p} />)}
    </View>
  );
}
function Ember({ left, size, duration, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let mounted = true;
    const loop = () => {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true })
        .start(({ finished }) => { if (finished && mounted) loop(); });
    };
    loop();
    return () => { mounted = false; };
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -700] });
  const opacity = anim.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.7, 0.5, 0] });
  return (
    <Animated.View
      style={{
        position: "absolute", bottom: -10, left: `${left}%`, width: size, height: size,
        borderRadius: size, backgroundColor: C.o2, opacity, transform: [{ translateY }],
      }}
    />
  );
}

/* ============================================================
   Top chrome — progress bar + back button + step tag
   ============================================================ */
export function ProgressBar({ progress }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={kitStyles.progWrap}>
      <Animated.View style={{ height: "100%", width }}>
        <LinearGradient colors={[C.oDeep, C.o, C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}
export function TopBar({ visible, label, onBack }) {
  if (!visible) return null;
  return (
    <View style={kitStyles.topbar}>
      <Pressable onPress={onBack} style={kitStyles.backBtn} hitSlop={10}>
        <Text style={{ color: C.muted, fontSize: 17 }}>←</Text>
      </Pressable>
      <View style={kitStyles.stepTag}>
        <Text style={{ color: C.muted, fontSize: 10.5, fontFamily: FONT.bodySemi, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {label}
        </Text>
      </View>
      <View style={{ width: 38 }} />
    </View>
  );
}

/* ============================================================
   Shared small components
   ============================================================ */
export function FadeInUp({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export function PrimaryButton({ label, onPress, disabled, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.timing(scale, { toValue: 0.985, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }], width: "100%", maxWidth: 420 }, style]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
        <LinearGradient
          colors={disabled ? [C.faint, C.faint] : [C.o2, C.o]}
          style={[kitStyles.btn, disabled && { opacity: 0.5 }]}
        >
          <Text style={kitStyles.btnText}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/** Ghost/secondary button — outline only, used where the HTML has .btn-ghost. */
export function GhostButton({ label, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.timing(scale, { toValue: 0.985, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }], width: "100%", maxWidth: 420 }, style]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={kitStyles.btnGhost}>
        <Text style={kitStyles.btnGhostText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   Shared layout primitives (stage container, eyebrow, headings)
   ============================================================ */
export function Eyebrow({ children, withLines = true }) {
  if (!withLines) {
    return <View style={{ marginBottom: 14, alignItems: "center" }}><Text style={kitStyles.eyebrowText}>{children}</Text></View>;
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <View style={kitStyles.eyebrowLine} />
      <Text style={kitStyles.eyebrowText}>{children}</Text>
      <View style={kitStyles.eyebrowLine} />
    </View>
  );
}

/** Generic selectable row: icon + label, optionally + a description line beneath
 *  (matches the HTML's .choice / .ch-body pattern — label and description get a
 *  real gap between them, not crammed on one line). Used for the Living screen
 *  and any future simple single-select list. */
export function ChoiceRow({ icon, title, sub, selected, onPress, delay = 0 }) {
  return (
    <FadeInUp delay={delay}>
      <Pressable
        onPress={onPress}
        style={[kitStyles.choiceCard, selected && kitStyles.choiceCardSelected]}
      >
        <Text style={kitStyles.chIcon}>{icon}</Text>
        {sub ? (
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={kitStyles.chText}>{title}</Text>
            <Text style={kitStyles.chSub}>{sub}</Text>
          </View>
        ) : (
          <Text style={[kitStyles.chText, { flex: 1 }]}>{title}</Text>
        )}
      </Pressable>
    </FadeInUp>
  );
}

export const kitStyles = StyleSheet.create({
  progWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.05)", zIndex: 60 },
  topbar: {
    position: "absolute", top: Platform.OS === "ios" ? 52 : 28, left: 18, right: 18, zIndex: 55,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.glass,
    borderWidth: 1, borderColor: C.line2, alignItems: "center", justifyContent: "center",
  },
  stepTag: {
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: 13, paddingVertical: 6, borderRadius: 30,
  },
  eyebrowLine: { width: 20, height: 1, backgroundColor: C.o2 },
  eyebrowText: { color: C.o2, fontSize: 11, fontFamily: FONT.bodySemi, letterSpacing: 2, textTransform: "uppercase" },

  btn: {
    borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 26,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.o, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  btnText: { color: "#1a0d04", fontSize: 15.5, fontFamily: FONT.bodySemi },
  btnGhost: {
    borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 26, alignItems: "center", justifyContent: "center",
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.line2,
  },
  btnGhostText: { color: C.muted, fontSize: 15.5, fontFamily: FONT.bodySemi },

  // shared stage/typography primitives so every section's layout matches exactly
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, paddingTop: 90, paddingBottom: 40 },
  stageTopContent: { alignItems: "center", paddingHorizontal: 22, paddingTop: 90, paddingBottom: 60 },
  h1: { fontFamily: FONT.display, color: C.ink, fontSize: 36, lineHeight: 40, letterSpacing: -1, textAlign: "center" },
  h2: { fontFamily: FONT.display, color: C.ink, fontSize: 26, lineHeight: 31, letterSpacing: -0.8, textAlign: "center", marginBottom: 12 },
  gradText: { color: C.gold }, // true gradient text needs MaskedView; solid gold is the RN fallback
  sub: { color: C.muted, fontSize: 14.5, textAlign: "center", lineHeight: 22, maxWidth: 420 },

  choiceCard: {
    flexDirection: "row", alignItems: "center", gap: 14, width: "100%", maxWidth: 440,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line,
    borderRadius: RADIUS.md, paddingVertical: 15, paddingHorizontal: 17, marginBottom: 11,
  },
  choiceCardSelected: {
    borderColor: C.o, backgroundColor: "rgba(255,106,26,0.14)",
    shadowColor: C.o, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4,
  },
  chIcon: { fontSize: 22, width: 26, textAlign: "center" },
  chText: { color: C.ink, fontSize: 14.5, fontFamily: FONT.bodyMed, lineHeight: 20 },
  chSub: { color: C.muted, fontSize: 12, lineHeight: 17 },
});