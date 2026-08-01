import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";

import { useQuestionnaireV2 } from "../../../../src/context/QuestionnaireV2Context";
import { PERSONALITIES, LIVING, personaDelayCost } from "../../../../src/lib/goPersonaEngine";
import {
  C, FONT, RADIUS, Embers, ProgressBar, TopBar, PrimaryButton, Eyebrow, ChoiceRow, kitStyles,
} from "../../../../src/lib/ui-kit";

const SUB_STEPS = ["bridge", "age", "monthly", "living"];
const STEP_LABEL = { bridge: "Momentum", age: "Setup", monthly: "Setup", living: "Setup" };
const MONTHLY_CHIPS = [2000, 5000, 6000, 10000, 20000];

export default function Section2() {
  const router = useRouter();
  const { state, setAge, setMonthlyInvestment, setLiving } = useQuestionnaireV2();

  const [sub, setSub] = useState("bridge"); // bridge | age | monthly | living
  const subIdx = SUB_STEPS.indexOf(sub);
  const progress = (subIdx + 1) / SUB_STEPS.length;

  const persona = PERSONALITIES.find(p => p.key === state.personaKey) || PERSONALITIES[0];

  // ORDER-based back, same granularity as the HTML: each of these 4 screens is
  // its own stage, so back steps exactly one stage — not one field at a time.
  const handleBack = () => {
    if (sub === "bridge") router.back(); // returns to section1's reveal screen
    else setSub(SUB_STEPS[subIdx - 1]);
  };

  const goNext = () => {
    const nextIdx = subIdx + 1;
    if (nextIdx >= SUB_STEPS.length) {
      // Section3 doesn't exist yet — wire this once it's built.
      router.push("/(gowealthy)/questionnaire-v2/section3");
    } else {
      setSub(SUB_STEPS[nextIdx]);
    }
  };

  return (
    <View style={styles.root}>
      <Embers />
      <ProgressBar progress={progress} />
      <TopBar visible label={STEP_LABEL[sub]} onBack={handleBack} />

      {sub === "bridge" && <Bridge persona={persona} onNext={goNext} />}
      {sub === "age" && <AgeScreen age={state.age} setAge={setAge} onNext={goNext} />}
      {sub === "monthly" && (
        <MonthlyScreen monthly={state.monthlyInvestment} setMonthly={setMonthlyInvestment} onNext={goNext} />
      )}
      {sub === "living" && (
        <LivingScreen living={state.living} setLiving={setLiving} onNext={goNext} />
      )}
    </View>
  );
}

/* ============================================================
   Bridge — "two versions of you" cost-of-delay screen
   ============================================================ */
function Bridge({ persona, onNext }) {
  const delayCost = personaDelayCost(persona);
  const bridgeSub = `For a ${persona.name}, the gap between these two isn't willpower — it's just when you begin.`;

  return (
    <View style={kitStyles.stage}>
      <Eyebrow>Two versions of you</Eyebrow>
      <Text style={kitStyles.h1}>
        Same income.{"\n"}<Text style={kitStyles.gradText}>Different story.</Text>
      </Text>
      <Text style={[kitStyles.sub, { marginTop: 12, marginBottom: 24 }]}>{bridgeSub}</Text>

      <View style={styles.compareRow}>
        <View style={styles.compareCard}>
          <Text style={styles.compareLabel}>Wait for two years</Text>
          <Text style={[styles.compareValue, { color: C.muted }]}>Age 60</Text>
          <Text style={styles.compareSub}>Financially free</Text>
        </View>
        <View style={[styles.compareCard, styles.compareCardWin]}>
          <Text style={[styles.compareLabel, { color: C.gold }]}>✦ Start today</Text>
          <Text style={[styles.compareValue, { color: C.gold2 }]}>Age 50</Text>
          <Text style={styles.compareSub}>Financially free</Text>
        </View>
      </View>

      <View style={styles.spark}>
        <Text style={styles.sparkLabel}>The cost of delay is high</Text>
        <Text style={styles.sparkVal}>{delayCost}</Text>
        <Text style={styles.sparkSub}>{persona.sparkSub}</Text>
      </View>

      <PrimaryButton label="Build my blueprint →" onPress={onNext} style={{ marginTop: 26 }} />
    </View>
  );
}

/* ============================================================
   Age
   ============================================================ */
function AgeScreen({ age, setAge, onNext }) {
  return (
    <View style={kitStyles.stage}>
      <Eyebrow withLines={false}>Quick setup · 1 of 3</Eyebrow>
      <Text style={kitStyles.h2}>How old are you?</Text>
      <Text style={kitStyles.sub}>This sets when every milestone lands on your timeline.</Text>

      <View style={styles.sliderWrap}>
        <View style={styles.sliderValRow}>
          <Text style={styles.sliderVal}>{age >= 35 ? "35+" : age}</Text>
          <Text style={styles.sliderValUnit}> yrs</Text>
        </View>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={18}
          maximumValue={35}
          step={1}
          value={age}
          onValueChange={setAge}
          minimumTrackTintColor={C.o}
          maximumTrackTintColor={C.faint}
          thumbTintColor={C.gold}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>18</Text>
          <Text style={styles.sliderLabelText}>35+</Text>
        </View>
      </View>

      <PrimaryButton label="That's me →" onPress={onNext} style={{ marginTop: 26 }} />
    </View>
  );
}

/* ============================================================
   Monthly investment
   ============================================================ */
function MonthlyScreen({ monthly, setMonthly, onNext }) {
  // slider fires continuous onValueChange; snap to the nearest ₹1,000 step
  // (matches the HTML's step="1000" range input).
  const handleSlide = (v) => setMonthly(Math.round(v / 1000) * 1000);

  return (
    <View style={kitStyles.stage}>
      <Eyebrow withLines={false}>Quick setup · 2 of 3</Eyebrow>
      <Text style={kitStyles.h2}>
        What can you invest{"\n"}<Text style={kitStyles.gradText}>every month, stress-free?</Text>
      </Text>
      <Text style={kitStyles.sub}>"Stress-free" is the whole trick. Starting honest beats starting ambitious.</Text>

      <View style={styles.sliderWrap}>
        <View style={styles.sliderValRow}>
          <Text style={styles.sliderValUnit}>₹</Text>
          <Text style={styles.sliderVal}>{monthly.toLocaleString("en-IN")}</Text>
        </View>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={1000}
          maximumValue={50000}
          step={1000}
          value={monthly}
          onValueChange={handleSlide}
          minimumTrackTintColor={C.o}
          maximumTrackTintColor={C.faint}
          thumbTintColor={C.gold}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>₹1,000</Text>
          <Text style={styles.sliderLabelText}>₹50K</Text>
        </View>

        <View style={styles.chipsRow}>
          {MONTHLY_CHIPS.map(v => {
            const active = v === monthly;
            return (
              <Pressable key={v} onPress={() => setMonthly(v)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>₹{v / 1000}K</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <PrimaryButton label="That works →" onPress={onNext} style={{ marginTop: 26 }} />
    </View>
  );
}

/* ============================================================
   Living situation
   ============================================================ */
function LivingScreen({ living, setLiving, onNext }) {
  return (
    <View style={kitStyles.stage}>
      <Eyebrow withLines={false}>Quick setup · 3 of 3</Eyebrow>
      <Text style={kitStyles.h2}>
        Where do you live{"\n"}<Text style={kitStyles.gradText}>right now?</Text>
      </Text>
      <Text style={[kitStyles.sub, { marginBottom: 20 }]}>
        This sets the baseline for your safety net — funded before anything else.
      </Text>

      <View style={{ width: "100%", maxWidth: 440 }}>
        {LIVING.map((l, i) => (
          <ChoiceRow
            key={l.label}
            icon={l.icon}
            title={l.label}
            sub={l.sub}
            selected={living?.index === i}
            onPress={() => setLiving({ index: i, label: l.label, monthlyExpense: l.expense })}
            delay={i * 60}
          />
        ))}
      </View>

      {living !== null && living !== undefined && (
        <PrimaryButton label="Got it →" onPress={onNext} style={{ marginTop: 12 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  compareRow: { flexDirection: "row", gap: 12, width: "100%", maxWidth: 420 },
  compareCard: {
    flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderRadius: RADIUS.md, paddingVertical: 18, paddingHorizontal: 14, alignItems: "center",
  },
  compareCardWin: {
    borderColor: C.gold,
    shadowColor: C.gold, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5,
  },
  compareLabel: { color: C.muted, fontSize: 10, fontFamily: FONT.bodySemi, letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 },
  compareValue: { fontFamily: FONT.display, fontSize: 28 },
  compareSub: { color: C.muted, fontSize: 11, marginTop: 5 },

  spark: {
    marginTop: 18, width: "100%", maxWidth: 420, alignItems: "center",
    backgroundColor: "rgba(247,200,90,0.08)", borderWidth: 1, borderColor: "rgba(247,200,90,0.24)",
    borderRadius: RADIUS.md, padding: 16,
  },
  sparkLabel: { color: C.gold, fontSize: 10, fontFamily: FONT.bodySemi, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  sparkVal: { fontFamily: FONT.display, color: C.gold2, fontSize: 24 },
  sparkSub: { color: C.muted, fontSize: 11.5, marginTop: 3, textAlign: "center" },

  sliderWrap: { width: "100%", maxWidth: 420, marginTop: 22 },
  sliderValRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginBottom: 6 },
  sliderVal: { fontFamily: FONT.display, color: C.gold2, fontSize: 42, letterSpacing: -1 },
  sliderValUnit: { color: C.muted, fontSize: 16 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  sliderLabelText: { color: C.muted, fontSize: 11 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 },
  chip: {
    borderWidth: 1, borderColor: C.line2, borderRadius: 30, paddingVertical: 8, paddingHorizontal: 15,
    backgroundColor: C.surface,
  },
  chipActive: { borderColor: C.o, backgroundColor: "rgba(255,106,26,0.12)" },
  chipText: { color: C.muted, fontSize: 12.5, fontFamily: FONT.bodySemi },
  chipTextActive: { color: C.o2 },
});