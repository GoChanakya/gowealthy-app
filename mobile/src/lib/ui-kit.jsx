import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, Pressable, Animated, Easing, StyleSheet, Platform, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { Ico } from "./icons";

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

/**
 * Top clearance for stage content.
 *
 * TopBar is absolutely positioned, so content underneath needs to start below
 * it. Android reports its own status-bar height; iOS notches are covered by the
 * fixed inset. Previously this was a flat 90, which clipped headings on taller
 * Android status bars.
 */
export const TOP_INSET = Platform.OS === "ios" ? 56 : (StatusBar.currentHeight || 24) + 14;
export const STAGE_TOP = TOP_INSET + 58;

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
   Ambient embers

   Deliberately sparse. Constant drifting particles behind every screen read as
   decoration; a few, on the screens that are actually moments (landing, the
   finished plan), read as atmosphere. Working screens pass count={0} or simply
   don't render this at all.
   ============================================================ */
export function Embers({ count = 4 }) {
  const particles = useMemo(() => (
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1 + Math.random() * 1.6,
      duration: 9000 + Math.random() * 9000,
      delay: Math.random() * 6000,
    }))
  ), [count]);
  if (!count) return null;
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
  const opacity = anim.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.2, 0.13, 0] });
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
        <ChevronLeft size={19} color={C.muted} strokeWidth={1.9} />
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
   Icons

   All iconography comes from lucide-react-native at one of these three sizes
   and a 1.75 stroke. Emoji were used as placeholders originally; they can't be
   tinted, they render differently on every Android skin, and they read as
   unfinished. Anything decorative gets no icon at all.
   ============================================================ */
export const ICON = { sm: 15, md: 18, lg: 22, stroke: 1.75 };

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
        <View style={kitStyles.chIcon}><Ico name={icon} size={ICON.lg} /></View>
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
    position: "absolute", top: TOP_INSET, left: 18, right: 18, zIndex: 55,
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

  // The primary CTA is the only element in the kit that glows. Everything else
  // earns attention through contrast and spacing instead, so this stays the
  // single brightest thing on any screen.
  btn: {
    borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 26,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.o, shadowOpacity: 0.13, shadowRadius: 9, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  btnText: { color: "#1a0d04", fontSize: 15.5, fontFamily: FONT.bodySemi },
  btnGhost: {
    borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 26, alignItems: "center", justifyContent: "center",
    backgroundColor: C.glass, borderWidth: 1, borderColor: C.line2,
  },
  btnGhostText: { color: C.muted, fontSize: 15.5, fontFamily: FONT.bodySemi },

  // shared stage/typography primitives so every section's layout matches exactly
  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, paddingTop: STAGE_TOP, paddingBottom: 44 },
  stageTopContent: { alignItems: "center", paddingHorizontal: 22, paddingTop: STAGE_TOP, paddingBottom: 72 },
  h1: { fontFamily: FONT.display, color: C.ink, fontSize: 36, lineHeight: 40, letterSpacing: -1, textAlign: "center" },
  h2: { fontFamily: FONT.display, color: C.ink, fontSize: 26, lineHeight: 31, letterSpacing: -0.8, textAlign: "center", marginBottom: 12 },
  gradText: { color: C.gold }, // true gradient text needs MaskedView; solid gold is the RN fallback
  sub: { color: C.muted, fontSize: 14.5, textAlign: "center", lineHeight: 22, maxWidth: 420 },

  choiceCard: {
    flexDirection: "row", alignItems: "center", gap: 14, width: "100%", maxWidth: 440,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line,
    borderRadius: RADIUS.md, paddingVertical: 15, paddingHorizontal: 17, marginBottom: 11,
  },
  // Selection reads from the border and a faint tint. No glow — when every
  // selected row glows, the primary action stops being the brightest thing.
  choiceCardSelected: {
    borderColor: "rgba(255,106,26,0.55)", backgroundColor: "rgba(255,106,26,0.055)",
  },
  chIcon: { width: 26, alignItems: "center", justifyContent: "center" },
  chText: { color: C.ink, fontSize: 14.5, fontFamily: FONT.bodyMed, lineHeight: 20 },
  chSub: { color: C.muted, fontSize: 12, lineHeight: 17 },
});