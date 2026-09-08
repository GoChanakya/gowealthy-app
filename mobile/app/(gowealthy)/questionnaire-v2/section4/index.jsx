import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, Animated, Easing, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { useQuestionnaireV2 } from "../../../../src/context/QuestionnaireV2Context";
import {
  GOALS, HORIZON_PRESETS, PRI_ICON, fmtYears, buildAllocation,
} from "../../../../src/lib/goPersonaEngine";
import { C, FONT, RADIUS, ICON, Embers, ProgressBar, TopBar, PrimaryButton, Eyebrow, kitStyles } from "../../../../src/lib/ui-kit";
import { Shield, Target, TrendingUp, Map, Check } from "lucide-react-native";
import { Ico } from "../../../../src/lib/icons";

const B2_MSG = ['Sizing your emergency fund', 'Weighting by priority', 'Running the numbers', 'Splitting your monthly amount', 'Done'];
const B2_ICON = [Shield, Target, TrendingUp, Map, Check];

export default function Section4() {
  const router = useRouter();
  const { state, setGoalYears, setAllocation } = useQuestionnaireV2();
  const [step, setStep] = useState("horizon"); // horizon | build2

  const goNext = () => {
    // Section5 doesn't exist yet — wire this once it's built.
    router.push("/(gowealthy)/questionnaire-v2/section5");
  };

  const startBuild2 = () => setStep("build2");

  // Matches section1's BuildLoading: the back button is hidden entirely during the
  // build/loading step rather than shown-but-inert — interrupting a computation
  // mid-flight isn't meaningful, so there's nothing useful for back to do here.
  const handleBack = () => router.back(); // returns to section3's goal ranking

  return (
    <View style={styles.root}>
      <Embers count={step === "build" ? 8 : 0} />
      <ProgressBar progress={step === "horizon" ? 0.75 : 0.9} />
      <TopBar visible={step !== "build2"} label="Timeframes" onBack={handleBack} />

      {step === "horizon" && (
        <HorizonScreen
          selectedGoals={state.selectedGoals}
          setGoalYears={setGoalYears}
          onNext={startBuild2}
        />
      )}
      {step === "build2" && (
        <Build2Loading
          onDone={() => {
            const allocation = buildAllocation(state.monthlyInvestment, state.living, state.selectedGoals);
            setAllocation(allocation);
            goNext();
          }}
        />
      )}
    </View>
  );
}

/* ============================================================
   Horizon — set each goal's target timeframe
   ============================================================ */
function HorizonScreen({ selectedGoals, setGoalYears, onNext }) {
  return (
    <ScrollView contentContainerStyle={kitStyles.stageTopContent} showsVerticalScrollIndicator={false}>
      <Eyebrow>Your timeframes</Eyebrow>
      <Text style={kitStyles.h2}>
        When do you want{"\n"}<Text style={kitStyles.gradText}>each one done?</Text>
      </Text>
      <Text style={[kitStyles.sub, { marginBottom: 20 }]}>
        Sooner goals get a bigger share of your monthly amount.
      </Text>

      <View style={{ width: "100%", maxWidth: 460, gap: 11 }}>
        {selectedGoals.map((sg, idx) => (
          <HorizonRow key={sg.key} sg={sg} idx={idx} setGoalYears={setGoalYears} />
        ))}
      </View>

      <PrimaryButton label="Build my plan" onPress={onNext} style={{ marginTop: 26 }} />
    </ScrollView>
  );
}

function HorizonRow({ sg, idx, setGoalYears }) {
  const g = GOALS.find(x => x.key === sg.key);
  const presets = HORIZON_PRESETS.filter(p => p.years >= g.minYears && p.years <= g.maxYears);

  return (
    <View style={styles.horizonRow}>
      <View style={styles.horizonTop}>
        <View style={styles.horizonNameRow}>
          <Ico name={g.icon} size={ICON.sm} color={g.color} />
          <Text style={styles.horizonName}>{g.name}</Text>
          <Text style={[styles.horizonPri, { color: g.color, backgroundColor: g.color + "22" }]}> {PRI_ICON[idx]} </Text>
        </View>
        <Text style={[styles.horizonVal, { color: g.color }]}>{fmtYears(sg.years)}</Text>
      </View>
      <View style={styles.hchipsRow}>
        {presets.map(p => {
          const active = p.years === sg.years;
          return (
            <Pressable
              key={p.label}
              onPress={() => setGoalYears(sg.key, p.years)}
              style={[styles.hchip, active && { borderColor: C.o, backgroundColor: "rgba(255,106,26,0.12)" }]}
            >
              <Text style={[styles.hchipText, active && { color: C.o2, fontFamily: FONT.bodySemi }]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ============================================================
   Build2 loading — computes buildAllocation() on completion
   ============================================================ */
function Build2Loading({ onDone }) {
  const [pct, setPct] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })
    ).start();

    intervalRef.current = setInterval(() => {
      setPct(prev => {
        const next = Math.min(prev + 2.4, 100);
        const i = Math.min(B2_MSG.length - 1, Math.floor((next / 100) * B2_MSG.length));
        setMsgIdx(i);
        if (next >= 100) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTimeout(onDone, 450);
        }
        return next;
      });
    }, 26);

    // Safety-net cleanup if this screen ever unmounts mid-animation for reasons
    // other than completing normally (e.g. the app backgrounds and the nav stack
    // gets torn down) — prevents a dangling interval from outliving the screen.
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={kitStyles.stage}>
      <View style={styles.buildOrbWrap}>
        <Animated.View style={[styles.buildOrbRing, { transform: [{ rotate }] }]}>
          <LinearGradient colors={["transparent", "rgba(255,106,26,0.55)", "rgba(247,200,90,0.35)", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        </Animated.View>
        <View style={styles.buildOrbCenter}>
          {React.createElement(B2_ICON[msgIdx], { size: 34, color: C.o2, strokeWidth: 1.6 })}
        </View>
      </View>
      <Text style={[kitStyles.h2, { marginTop: 8 }]}>
        {pct >= 100 ? "Your plan is ready" : "Building your plan"}
      </Text>
      <View style={styles.buildTrack}>
        <View style={[styles.buildFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.buildMsg}>{B2_MSG[msgIdx]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  horizonRow: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: RADIUS.md, padding: 14 },
  horizonTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11, flexWrap: "wrap", gap: 6 },
  horizonNameRow: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1 },
  horizonName: { color: C.ink, fontSize: 13.5, fontFamily: FONT.bodySemi },
  horizonPri: { fontSize: 9.5, fontFamily: FONT.bodyBold, borderRadius: 20, letterSpacing: 0.5 },
  horizonVal: { fontFamily: FONT.display, fontSize: 13 },
  hchipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  hchip: {
    borderWidth: 1, borderColor: C.line2, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12,
    backgroundColor: C.bg3,
  },
  hchipText: { color: C.muted, fontSize: 11.5 },

  buildOrbWrap: { width: 104, height: 104, marginBottom: 26, alignItems: "center", justifyContent: "center" },
  buildOrbRing: { position: "absolute", width: 104, height: 104, borderRadius: 52, overflow: "hidden" },
  buildOrbCenter: { width: 95, height: 95, borderRadius: 48, backgroundColor: C.bg2, alignItems: "center", justifyContent: "center" },
  buildTrack: { width: "100%", maxWidth: 300, height: 6, backgroundColor: C.faint, borderRadius: 6, overflow: "hidden", marginTop: 6 },
  buildFill: { height: "100%", backgroundColor: C.o, borderRadius: 6 },
  buildMsg: { color: C.muted, fontSize: 13.5, marginTop: 16, textAlign: "center", fontFamily: FONT.bodyMed },
});