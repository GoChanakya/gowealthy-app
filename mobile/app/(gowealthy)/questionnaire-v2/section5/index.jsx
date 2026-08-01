import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Animated, StyleSheet, Platform } from "react-native";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../src/config/firebase";
// ^ adjust to your actual firebase init path/export name

import { useQuestionnaireV2 } from "../../../../src/context/QuestionnaireV2Context";
import {
  simulateJourney, timelineStatus, fmtINR, fmtLac, fmtAgeSmart, PRI_ICON, PERSONALITIES,
} from "../../../../src/lib/goPersonaEngine";
import { C, FONT, RADIUS, Embers, ProgressBar, TopBar, PrimaryButton, GhostButton, Eyebrow, kitStyles } from "../../../../src/lib/ui-kit";

const R = 52, CIRC = Math.PI * 2 * R;

export default function Section5() {
  const router = useRouter();
  const { state, setProjection, markCompleted } = useQuestionnaireV2();
  const [step, setStep] = useState("alloc"); // alloc | ach | finish
  const [saving, setSaving] = useState(false);

  const alloc = state.allocation;
  const journey = useMemo(
    () => simulateJourney(state.monthlyInvestment, state.living, state.selectedGoals, state.age),
    [state.monthlyInvestment, state.living, state.selectedGoals, state.age]
  );
  const persona = PERSONALITIES.find(p => p.key === state.personaKey) || PERSONALITIES[0];

  const handleBack = () => {
    if (step === "ach") setStep("alloc");
    else if (step === "finish") setStep("ach");
    else router.back(); // returns to section4's horizon screen
  };

  const goFinish = async () => {
    setProjection(journey);
    setStep("finish");
    await saveSubmission();
  };

  const saveSubmission = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const phone = await AsyncStorage.getItem("user_phone");
      if (!phone) throw new Error("No user_phone in AsyncStorage — cannot save submission.");
      await setDoc(
        doc(db, "gowealthy-questionaire", phone),
        {
          persona: { code: state.personaCode, key: state.personaKey, scores: state.scores, answers: state.answers },
          age: state.age,
          monthlyInvestment: state.monthlyInvestment,
          living: state.living,
          selectedGoals: state.selectedGoals,
          allocation: alloc,
          projection: journey,
          questionnaire_completed: true,
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("✅ Questionnaire submission saved to Firebase for phone:", phone);
      markCompleted();
    } catch (e) {
      console.error("Failed to save questionnaire submission:", e);
      // Deliberately non-blocking — the user already sees their finished blueprint.
      // Consider surfacing a retry affordance here once this is wired up for real.
    } finally {
      setSaving(false);
    }
  };

  const restart = () => router.replace("/(gowealthy)/questionnaire-v2/section1");
  const goDashboard = () => router.replace("/(gowealthy)/dashboard/home");

  if (!alloc) {
    // Guards against landing here directly without section4 having run.
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: C.muted }}>No allocation found — go back and complete the previous steps.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Embers />
      <ProgressBar progress={step === "alloc" ? 0.92 : step === "ach" ? 0.97 : 1} />
      <TopBar visible label={step === "alloc" ? "Allocation" : step === "ach" ? "Future story" : "Done"} onBack={handleBack} />

      {step === "alloc" && (
        <AllocationScreen alloc={alloc} monthly={state.monthlyInvestment} journey={journey} onNext={() => setStep("ach")} />
      )}
      {step === "ach" && (
        <AchievementsScreen
          alloc={alloc}
          journey={journey}
          onFinish={goFinish}
          onEditGoals={() => router.push("/(gowealthy)/questionnaire-v2/section3")}
        />
      )}
      {step === "finish" && (
        <FinishScreen persona={persona} saving={saving} onBackToAch={() => setStep("ach")} onDashboard={goDashboard} onRestart={restart} />
      )}
    </View>
  );
}

/* ============================================================
   Allocation — donut + expandable legend + insight
   ============================================================ */
function AllocationScreen({ alloc, monthly, journey, onNext }) {
  const [openIdx, setOpenIdx] = useState(null);
  const animatedLens = useRef(alloc.allBuckets.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let acc = 0;
    let delay = 250;
    alloc.allBuckets.forEach((b, i) => {
      const len = (b.pct / 100) * CIRC;
      setTimeout(() => {
        Animated.timing(animatedLens[i], { toValue: len, duration: 700, useNativeDriver: false }).start();
      }, delay);
      delay += 260;
      acc += len;
    });
  }, []);

  let accOffset = 0;
  const secYrs = journey.security.years;
  const secWhen = secYrs < 1 ? `${Math.round(secYrs * 12)} months` : `${Math.round(secYrs * 10) / 10} years`;
  const top = alloc.goals[0];

  return (
    <ScrollView contentContainerStyle={kitStyles.stageTopContent} showsVerticalScrollIndicator={false}>
      <Eyebrow>Life Allocation</Eyebrow>
      <Text style={kitStyles.h2}>
        Your money{"\n"}<Text style={kitStyles.gradText}>found its purpose.</Text>
      </Text>
      <Text style={[kitStyles.sub, { marginBottom: 8 }]}>
        Not asset classes — life buckets, weighted by what you ranked first. Tap any slice.
      </Text>

      <View style={styles.donutWrap}>
        <Svg width={230} height={230} viewBox="0 0 120 120">
          <Circle cx={60} cy={60} r={R} fill="none" stroke={C.faint} strokeWidth={11} />
          {alloc.allBuckets.map((b, i) => {
            const offset = accOffset;
            accOffset += (b.pct / 100) * CIRC;
            return (
              <AnimatedCircle
                key={b.key}
                cx={60} cy={60} r={R}
                fill="none" stroke={b.color} strokeWidth={openIdx === i ? 16 : 11} strokeLinecap="butt"
                strokeDasharray={animatedLens[i].interpolate ? undefined : undefined}
                animatedLength={animatedLens[i]}
                totalCirc={CIRC}
                rotationOffset={offset}
              />
            );
          })}
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutLbl}>Every month</Text>
          <Text style={styles.donutVal}>{fmtINR(monthly)}</Text>
          <Text style={styles.donutSub}>across {alloc.goals.length} goal{alloc.goals.length !== 1 ? "s" : ""} + safety</Text>
        </View>
      </View>

      <View style={{ width: "100%", maxWidth: 460, gap: 9 }}>
        {alloc.allBuckets.map((b, i) => {
          const pri = b.key === "security" ? "🛡️ First" : b.key === "buffer" ? "Flex" : `${PRI_ICON[b.rank]} P${b.rank + 1}`;
          const open = openIdx === i;
          return (
            <View key={b.key}>
              <Pressable
                style={[styles.alRow, open && { borderColor: b.color, backgroundColor: b.color + "1a" }]}
                onPress={() => setOpenIdx(open ? null : i)}
              >
                <Text style={[styles.alPri, { color: b.color, backgroundColor: b.color + "22" }]}>{pri}</Text>
                <Text style={styles.alName}>{b.icon} {b.name}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.alPct, { color: b.color }]}>{b.pct}%</Text>
                  <Text style={styles.alAmt}>{fmtINR(b.amount)}/mo</Text>
                </View>
              </Pressable>
              {open && (
                <View style={styles.alDetail}>
                  {b.target ? (
                    <Text style={styles.alDetailP}>
                      <Text style={{ fontFamily: FONT.bodyBold }}>Target</Text> {fmtLac(b.target)} ·{" "}
                      <Text style={{ fontFamily: FONT.bodyBold }}>by</Text> {b.years} yr
                      {b.baseTarget && b.target > b.baseTarget && (
                        <Text style={{ color: C.muted }}> ({fmtLac(b.baseTarget)} today, grown at {Math.round(b.infl * 100)}% inflation)</Text>
                      )}
                    </Text>
                  ) : null}
                  <Text style={styles.alDetailWhy}>{bucketWhy(b)}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.insightBox}>
        <Text style={styles.insightH}>What just happened here?</Text>
        <Text style={styles.insightP}>
          Your <Text style={styles.b}>Safety Net</Text> builds to <Text style={styles.b}>{fmtLac(alloc.security.target)}</Text> — six
          months of essentials — in about <Text style={styles.b}>{secWhen}</Text>. The moment it's full, its entire share flows
          straight into your goals.
        </Text>
        <Text style={styles.insightP}>
          <Text style={styles.b}>Buffer in Bank</Text> keeps a flat 5% in cash, so a surprise never forces you to break an investment.
        </Text>
        <Text style={styles.insightP}>
          Everything else goes to your goals — and not split evenly. It's <Text style={styles.b}>weighted by what you ranked first</Text>.
          {top ? ` Your #1, ` : ""}
          {top ? <Text style={styles.b}>{top.name}</Text> : null}
          {top ? ", gets the biggest push, so it lands soonest. " : ""}
          Sooner + higher-priority goals both pull a bigger share, automatically.
        </Text>
        <Text style={styles.insightP}>
          Targets are <Text style={styles.b}>inflation-adjusted</Text> — what costs {fmtLac(100000)} today costs more by the time you
          get there, so we fund the future price. Each year your contribution grows ~10%, and as one goal completes its share moves to
          the next. <Text style={styles.b}>Your plan accelerates as you go.</Text>
        </Text>
      </View>

      <PrimaryButton label="Show me my future story →" onPress={onNext} style={{ marginTop: 22 }} />
    </ScrollView>
  );
}

function bucketWhy(b) {
  if (b.key === "security") return "Six months of essentials, built first — then this whole share moves over to your goals.";
  if (b.key === "buffer") return "A flat 5%, kept in the bank. Not a growth bucket — just breathing room you can reach in a day.";
  return `As your Priority ${b.rank + 1}, this gets a bigger share now, and picks up freed-up money as earlier goals finish.`;
}

/** react-native-svg's Circle doesn't take an Animated.Value directly for strokeDasharray
 *  the way DOM SVG can via CSS — so this wraps it with an AnimatedProps-driven approach:
 *  strokeDasharray is `[animatedLength, totalCirc]`, strokeDashoffset is the negative
 *  cumulative offset (so segments appear in bucket order), matching the HTML's approach. */
const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);
function AnimatedCircle({ animatedLength, totalCirc, rotationOffset, ...rest }) {
  const strokeDasharray = Animated.multiply(animatedLength, 1); // passthrough, kept explicit for clarity
  return (
    <AnimatedSvgCircle
      {...rest}
      strokeDashoffset={-rotationOffset}
      strokeDasharray={[strokeDasharray, totalCirc]}
      rotation={-90}
      originX={60}
      originY={60}
    />
  );
}

/* ============================================================
   Achievements — positive future story
   ============================================================ */
function AchievementsScreen({ alloc, journey, onFinish, onEditGoals }) {
  const statuses = alloc.goals.map(g => timelineStatus(journey[g.key]));
  const onTrack = statuses.filter(s => s.kind === "good").length;
  const manageable = statuses.filter(s => s.kind === "range").length;
  const n = alloc.goals.length;
  const top = alloc.goals[0];

  let big;
  if (onTrack === n) big = "Every goal is on track 🎯";
  else if (onTrack + manageable === n) big = `All ${n} goals are on track or comfortably manageable ✨`;
  else if (onTrack + manageable > 0) big = `${onTrack + manageable} of your ${n} goals ${onTrack + manageable === 1 ? "is" : "are"} on track or manageable`;
  else big = "Your biggest priority is already moving 🚀";
  const sub = `${top ? `Your #1, ${top.name}, leads the way — ` : ""}and as each goal completes, its money flows into the next. Push your monthly up, or give a goal more time, and these dates pull in fast.`;

  return (
    <ScrollView contentContainerStyle={kitStyles.stageTopContent} showsVerticalScrollIndicator={false}>
      <Eyebrow>Your future story</Eyebrow>
      <Text style={kitStyles.h2}>
        Here's when it{"\n"}<Text style={kitStyles.gradText}>all comes together.</Text>
      </Text>
      <Text style={[kitStyles.sub, { marginBottom: 16 }]}>
        Assuming <Text style={{ fontFamily: FONT.bodyBold }}>12% growth</Text> in your investments and a{" "}
        <Text style={{ fontFamily: FONT.bodyBold }}>10% increase in your monthly contribution</Text> each year, you will achieve your
        goals as below. Targets are inflation-adjusted to their future cost.
      </Text>

      <View style={styles.achSummary}>
        <Text style={styles.achSummaryBig}>{big}</Text>
        <Text style={styles.achSummarySub}>{sub}</Text>
      </View>

      <View style={{ width: "100%", maxWidth: 460, gap: 13 }}>
        {alloc.goals.map((g, idx) => {
          const a = journey[g.key], st = timelineStatus(a);
          const pace = a.capped ? 18 : Math.max(8, Math.min(100, Math.round((a.desiredMonths / a.months) * 100)));
          const ageLabel = a.capped ? "The long game" : `Age ${fmtAgeSmart(a.achieveAge, a.months)}`;
          const showInfl = g.target > g.baseTarget;
          return (
            <View key={g.key} style={[styles.achCard, { borderLeftColor: g.color }]}>
              <Text style={[styles.achPri, { color: g.color }]}>{PRI_ICON[idx]} PRIORITY {idx + 1}</Text>
              <View style={styles.achTop}>
                <Text style={styles.achIcon}>{g.icon}</Text>
                <Text style={styles.achName}>{g.name}</Text>
                <View style={[styles.achBadge, badgeStyle(st.cls)]}>
                  <Text style={[styles.achBadgeText, badgeTextStyle(st.cls)]}>{st.label}</Text>
                </View>
              </View>
              <View style={styles.achAgeRow}>
                <Text style={[styles.achAge, { color: g.color }]}>{ageLabel}</Text>
                <Text style={styles.achAgeL}>you wanted age {fmtAgeSmart(a.desiredAge, g.years * 12)}</Text>
              </View>
              <View style={styles.achBar}><View style={[styles.achFill, { width: `${pace}%`, backgroundColor: g.color }]} /></View>
              <Text style={styles.achDetail}>
                {fmtINR(g.amount)}/mo now, growing ~10% a year — plus whatever frees up as earlier goals finish.{"\n"}
                {showInfl ? (
                  <>{fmtLac(g.baseTarget)} today → <Text style={{ fontFamily: FONT.bodyBold }}>{fmtLac(g.target)}</Text> at your target date ({Math.round(g.infl * 100)}% inflation).</>
                ) : (
                  <><Text style={{ fontFamily: FONT.bodyBold }}>{fmtLac(g.target)}</Text> target.</>
                )}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ width: "100%", maxWidth: 420, marginTop: 22, gap: 11 }}>
        <PrimaryButton label="My blueprint is ready ✦" onPress={onFinish} />
        <GhostButton label="✏️ Re-rank my goals" onPress={onEditGoals} />
      </View>
    </ScrollView>
  );
}
function badgeStyle(cls) {
  if (cls === "good") return { backgroundColor: "rgba(79,211,154,0.16)" };
  if (cls === "range") return { backgroundColor: "rgba(247,200,90,0.16)" };
  return { backgroundColor: "rgba(255,106,26,0.14)" };
}
function badgeTextStyle(cls) {
  if (cls === "good") return { color: C.gd };
  if (cls === "range") return { color: C.gold };
  return { color: C.o2 };
}

/* ============================================================
   Finish
   ============================================================ */
function FinishScreen({ persona, saving, onBackToAch, onDashboard, onRestart }) {
  return (
    <View style={kitStyles.stage}>
      <Text style={styles.finishIcon}>✦</Text>
      <Eyebrow>Blueprint saved</Eyebrow>
      <Text style={kitStyles.h1}>
        You're not guessing{"\n"}<Text style={kitStyles.gradText}>{persona.name}</Text> anymore.
      </Text>
      <Text style={[kitStyles.sub, { marginTop: 12, marginBottom: 26 }]}>
        As a {persona.name}, your plan works with your instincts, not against them. Come back whenever your priorities shift — it
        rebuilds instantly.{saving ? " Saving your blueprint…" : ""}
      </Text>
      <View style={{ width: "100%", maxWidth: 420, gap: 11 }}>
        <PrimaryButton label="Go to my dashboard →" onPress={onDashboard} />
        <GhostButton label="← Back to my future story" onPress={onBackToAch} />
        <GhostButton label="Start over" onPress={onRestart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  donutWrap: { width: 230, height: 230, alignSelf: "center", marginVertical: 10, alignItems: "center", justifyContent: "center" },
  donutCenter: { position: "absolute", alignItems: "center" },
  donutLbl: { color: C.muted, fontSize: 10, fontFamily: FONT.bodySemi, letterSpacing: 1.5, textTransform: "uppercase" },
  donutVal: { color: C.ink, fontFamily: FONT.display, fontSize: 30, marginTop: 2 },
  donutSub: { color: C.muted, fontSize: 11 },

  alRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 13,
    borderRadius: RADIUS.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  alPri: { fontSize: 9, fontFamily: FONT.bodyBold, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 20, letterSpacing: 0.4 },
  alName: { flex: 1, color: C.ink, fontSize: 13.5, fontFamily: FONT.bodySemi },
  alPct: { fontFamily: FONT.display, fontSize: 16 },
  alAmt: { color: C.muted, fontSize: 11 },
  alDetail: { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.line, borderRadius: RADIUS.md, padding: 14, marginTop: -3 },
  alDetailP: { color: C.muted, fontSize: 12.5, lineHeight: 19, marginBottom: 7 },
  alDetailWhy: { color: C.muted, fontSize: 11.5, fontStyle: "italic", lineHeight: 18 },

  insightBox: {
    width: "100%", maxWidth: 460, backgroundColor: "rgba(255,106,26,0.06)", borderWidth: 1, borderColor: C.line2,
    borderRadius: RADIUS.lg, padding: 20, marginTop: 22,
  },
  insightH: { color: C.gold2, fontFamily: FONT.display, fontSize: 15, marginBottom: 11 },
  insightP: { color: C.muted, fontSize: 13, lineHeight: 22, marginBottom: 9 },
  b: { fontFamily: FONT.bodyBold, color: C.ink },

  achSummary: {
    width: "100%", maxWidth: 460, backgroundColor: "rgba(247,200,90,0.1)", borderWidth: 1, borderColor: "rgba(247,200,90,0.22)",
    borderRadius: RADIUS.lg, padding: 18, marginBottom: 18, alignItems: "center",
  },
  achSummaryBig: { color: C.gold2, fontFamily: FONT.display, fontSize: 17, textAlign: "center", marginBottom: 6 },
  achSummarySub: { color: C.muted, fontSize: 12.5, textAlign: "center", lineHeight: 19 },

  achCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderLeftWidth: 3, borderRadius: RADIUS.md, padding: 17 },
  achPri: { fontSize: 9, fontFamily: FONT.bodyBold, letterSpacing: 1, marginBottom: 9 },
  achTop: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 12 },
  achIcon: { fontSize: 24 },
  achName: { flex: 1, color: C.ink, fontFamily: FONT.display, fontSize: 15.5 },
  achBadge: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20 },
  achBadgeText: { fontSize: 10, fontFamily: FONT.bodyBold },
  achAgeRow: { flexDirection: "row", alignItems: "baseline", gap: 9, marginBottom: 4 },
  achAge: { fontFamily: FONT.display, fontSize: 25 },
  achAgeL: { color: C.muted, fontSize: 12 },
  achBar: { height: 7, backgroundColor: C.faint, borderRadius: 6, overflow: "hidden", marginVertical: 10 },
  achFill: { height: "100%", borderRadius: 6 },
  achDetail: { color: C.muted, fontSize: 12, lineHeight: 18 },

  finishIcon: { fontSize: 60, color: C.gold2, textAlign: "center", marginBottom: 14 },
});