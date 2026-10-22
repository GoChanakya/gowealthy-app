import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../src/config/firebase";
import { awardBadge } from "../../../../src/lib/xpBadges";
// ^ adjust to your actual firebase init path/export name

import { useQuestionnaireV2 } from "../../../../src/context/QuestionnaireV2Context";
import { markQuestionnaireCompleted } from "../../../../src/features/onboarding/completion";
import {
  simulateJourney, timelineStatus, fmtINR, fmtLac, fmtAgeSmart, PRI_ICON, PERSONALITIES,
} from "../../../../src/lib/goPersonaEngine";
import { C, FONT, RADIUS, ICON, Embers, ProgressBar, TopBar, PrimaryButton, GhostButton, Eyebrow, kitStyles } from "../../../../src/lib/ui-kit";
import { Ico } from "../../../../src/lib/icons";
import { Check } from "lucide-react-native";
import { hapticError, hapticSmall, hapticSuccess } from "../../../../src/lib/haptics";

const R = 52, CIRC = Math.PI * 2 * R;

export default function Section5() {
  const router = useRouter();
  const { state, setProjection, markCompleted } = useQuestionnaireV2();
  const [step, setStep] = useState("alloc"); // alloc | ach | finish
  const [saving, setSaving] = useState(false);
  const [xpVerification, setXpVerification] = useState({ status: "idle" });

  // -- name-capture modal, shown right before we actually navigate to the dashboard --
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

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
    hapticSuccess();
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
      setXpVerification({ status: "verifying" });
      const xpResult = await awardBadge(phone, 'persona_done');
      setXpVerification(xpResult);
      console.log("[onboarding-xp] verification result", {
        status: xpResult.status,
        verified: xpResult.verified,
        awarded: xpResult.awarded,
        balanceAfter: xpResult.balanceAfter,
      });
      if (xpResult.status === "awarded" && xpResult.verified) {
        hapticSuccess();
        Toast.show({
          type: "success",
          text1: "+50 XP credited",
          text2: `Verified balance: ${xpResult.balanceAfter}`,
          visibilityTime: 5000,
        });
      } else if (xpResult.status === "already_awarded" && xpResult.verified) {
        Toast.show({
          type: "info",
          text1: "Onboarding XP already credited",
          text2: `Current balance: ${xpResult.balanceAfter}`,
          visibilityTime: 5000,
        });
      } else {
        hapticError();
        Toast.show({
          type: "error",
          text1: "XP verification failed",
          text2: xpResult.error?.message || "Check the Metro console for details.",
          visibilityTime: 6000,
        });
      }
      markCompleted();
      // Mirror completion locally so the boot gate can route straight to the
      // dashboard without a Firestore round-trip on every cold start.
      await markQuestionnaireCompleted();
    } catch (e) {
      hapticError();
      console.error("Failed to save questionnaire submission:", e);
      setXpVerification({ status: "failed", verified: false });
      // Deliberately non-blocking — the user already sees their finished blueprint.
      // Consider surfacing a retry affordance here once this is wired up for real.
    } finally {
      setSaving(false);
    }
  };

  const restart = () => router.replace("/(gowealthy)/questionnaire-v2/section1");

  /** "Go to my dashboard" no longer navigates directly — it opens the
   *  name modal first. Navigation only happens once a name is saved. */
  const openNameModal = () => {
    setNameError("");
    setNameModalOpen(true);
  };

  const submitName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      hapticError();
      setNameError("Go on, tell us what to call you.");
      return;
    }
    if (savingName) return;
    setSavingName(true);
    try {
      const phone = await AsyncStorage.getItem("user_phone");
      await AsyncStorage.setItem("user_name", trimmed);
      if (phone) {
        await setDoc(doc(db, "gowealthy-questionaire", phone), { name: trimmed }, { merge: true });
      }
      setNameModalOpen(false);
      hapticSuccess();
      router.replace("/(gowealthy)/dashboard");
    } catch (e) {
      hapticError();
      console.error("Failed to save name:", e);
      setNameError("Couldn't save that — check your connection and try again.");
    } finally {
      setSavingName(false);
    }
  };

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
        <AllocationScreen alloc={alloc} monthly={state.monthlyInvestment} journey={journey} onNext={() => { hapticSuccess(); setStep("ach"); }} />
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
        <FinishScreen persona={persona} saving={saving} xpVerification={xpVerification} onBackToAch={() => setStep("ach")} onDashboard={openNameModal} onRestart={restart} />
      )}

      <NameCaptureModal
        visible={nameModalOpen}
        value={nameDraft}
        onChangeText={(t) => { setNameDraft(t); if (nameError) setNameError(""); }}
        onSubmit={submitName}
        saving={savingName}
        error={nameError}
        onRequestClose={() => setNameModalOpen(false)}
      />
    </View>
  );
}

/* ============================================================
   Name capture — "Before your plan — what do we call you?"
   Mirrors sName's copy/feel from the HTML prototype, shown here as
   a modal right before the dashboard so it doesn't disrupt the
   finished-blueprint moment.
   ============================================================ */
function NameCaptureModal({ visible, value, onChangeText, onSubmit, saving, error, onRequestClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalEyebrow}>One quick thing</Text>
          <Text style={styles.modalTitle}>
            Before your dashboard —{"\n"}
            <Text style={kitStyles.gradText}>what do we call you?</Text>
          </Text>
          <Text style={styles.modalSub}>Your blueprint should feel like yours. First name is perfect.</Text>

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="e.g. Hannah"
            placeholderTextColor={C.muted}
            autoComplete="name"
            autoCapitalize="words"
            autoFocus
            style={styles.modalInput}
            onSubmitEditing={onSubmit}
            returnKeyType="done"
          />
          {!!error && <Text style={styles.modalError}>{error}</Text>}

          <PrimaryButton
            label={saving ? "Saving" : "Continue"}
            onPress={onSubmit}
            disabled={saving || !value.trim()}
            style={{ marginTop: 16, width: "100%" }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
          const pri = b.key === "security" ? "First" : b.key === "buffer" ? "Flex" : `Priority ${b.rank + 1}`;
          const open = openIdx === i;
          return (
            <View key={b.key}>
              <Pressable
                style={[styles.alRow, open && { borderColor: b.color, backgroundColor: b.color + "1a" }]}
                onPress={() => { hapticSmall(); setOpenIdx(open ? null : i); }}
              >
                <Text style={[styles.alPri, { color: b.color, backgroundColor: b.color + "22" }]}>{pri}</Text>
                <View style={styles.alNameRow}><Ico name={b.icon} size={ICON.sm} color={b.color} /><Text style={styles.alName}>{b.name}</Text></View>
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
        <Text style={styles.insightH}>How this works</Text>
        <InsightRow icon="Shield" text={`Safety net fills to ${fmtLac(alloc.security.target)} in about ${secWhen}. Then its share moves to your goals.`} />
        <InsightRow icon="Wallet" text="5% stays in the bank, so a surprise never breaks an investment." />
        <InsightRow icon="Target" text={top ? `Goals you ranked higher get more. ${top.name} lands soonest.` : "Goals you ranked higher get a bigger share."} />
        <InsightRow icon="TrendingUp" text="Targets are inflation-adjusted, and your contribution grows ~10% a year." />
      </View>

      <PrimaryButton label="See my timeline" onPress={onNext} style={{ marginTop: 22 }} />
    </ScrollView>
  );
}

function InsightRow({ icon, text }) {
  return (
    <View style={styles.insightRow}>
      <Ico name={icon} size={ICON.sm} color={C.o2} />
      <Text style={styles.insightP}>{text}</Text>
    </View>
  );
}

function bucketWhy(b) {
  if (b.key === "security") return "Six months of essentials. Funded first.";
  if (b.key === "buffer") return "A flat 5% in the bank. Reachable in a day.";
  return `Priority ${b.rank + 1}, so it gets a bigger share and picks up money as earlier goals finish.`;
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
  if (onTrack === n) big = "Every goal is on track";
  else if (onTrack + manageable === n) big = `All ${n} goals are on track or within reach`;
  else if (onTrack + manageable > 0) big = `${onTrack + manageable} of your ${n} goals ${onTrack + manageable === 1 ? "is" : "are"} on track or manageable`;
  else big = "Your top priority is already moving";
  const sub = top
    ? `${top.name} first. As each goal finishes, its money moves to the next.`
    : "As each goal finishes, its money moves to the next.";

  return (
    <ScrollView contentContainerStyle={kitStyles.stageTopContent} showsVerticalScrollIndicator={false}>
      <Eyebrow>Your timeline</Eyebrow>
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
              <Text style={[styles.achPri, { color: g.color }]}>PRIORITY {idx + 1}</Text>
              <View style={styles.achTop}>
                <View style={styles.achIcon}><Ico name={g.icon} size={ICON.lg} color={g.color} /></View>
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

      <Text style={styles.achNote}>
        Assumes 12% annual returns and a 10% yearly step-up. Targets are inflation-adjusted.
      </Text>

      <View style={{ width: "100%", maxWidth: 420, marginTop: 18, gap: 11 }}>
        <PrimaryButton label="Looks good" onPress={onFinish} />
        <GhostButton label="Re-rank my goals" onPress={onEditGoals} />
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
function FinishScreen({ persona, saving, xpVerification, onBackToAch, onDashboard, onRestart }) {
  const xpMessage = xpVerification.status === "verifying"
    ? "Verifying your onboarding XP…"
    : xpVerification.status === "awarded"
      ? `+50 XP verified${Number.isFinite(xpVerification.balanceAfter) ? ` • Balance ${xpVerification.balanceAfter}` : ""}`
      : xpVerification.status === "already_awarded"
        ? "Onboarding XP was already credited"
        : xpVerification.status === "failed"
          ? "XP could not be verified — check the console log"
          : "";
  return (
    <View style={kitStyles.stage}>
      <View style={styles.finishIcon}>
        <Check size={26} color={C.o2} strokeWidth={2} />
      </View>
      <Eyebrow>Saved</Eyebrow>
      <Text style={kitStyles.h1}>
        Your plan is{"\n"}<Text style={kitStyles.gradText}>ready.</Text>
      </Text>
      <Text style={[kitStyles.sub, { marginTop: 12, marginBottom: 26 }]}>
        Built around how you handle money. Change your goals any time.{saving ? " Saving…" : ""}
      </Text>
      {xpMessage ? (
        <Text style={[styles.xpVerification, xpVerification.verified ? styles.xpVerified : styles.xpPending]}>
          {xpMessage}
        </Text>
      ) : null}
      <View style={{ width: "100%", maxWidth: 420, gap: 11 }}>
        <PrimaryButton label="Go to dashboard" onPress={onDashboard} disabled={saving || xpVerification.status === "verifying"} />
        <GhostButton label="Back" onPress={onBackToAch} />
        <GhostButton label="Start over" onPress={onRestart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  xpVerification: { fontFamily: FONT.bodySemi, fontSize: 13, textAlign: "center", marginBottom: 18 },
  xpVerified: { color: C.gd },
  xpPending: { color: C.gold },

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
  insightH: { color: C.gold2, fontFamily: FONT.display, fontSize: 15, marginBottom: 13 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 11 },
  insightP: { flex: 1, color: C.muted, fontSize: 12.5, lineHeight: 19 },
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
  achIcon: { width: 26, alignItems: "center", justifyContent: "center" },
  alNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  achName: { flex: 1, color: C.ink, fontFamily: FONT.display, fontSize: 15.5 },
  achBadge: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20 },
  achBadgeText: { fontSize: 10, fontFamily: FONT.bodyBold },
  achAgeRow: { flexDirection: "row", alignItems: "baseline", gap: 9, marginBottom: 4 },
  achAge: { fontFamily: FONT.display, fontSize: 25 },
  achAgeL: { color: C.muted, fontSize: 12 },
  achBar: { height: 7, backgroundColor: C.faint, borderRadius: 6, overflow: "hidden", marginVertical: 10 },
  achFill: { height: "100%", borderRadius: 6 },
  achDetail: { color: C.muted, fontSize: 12, lineHeight: 18 },
  achStats: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 10 },
  achStat: { color: C.muted, fontSize: 12.5, fontFamily: FONT.bodySemi },
  achStatUnit: { fontFamily: FONT.body, fontSize: 11 },
  achStatDot: { color: C.faint, fontSize: 12.5 },
  achNote: { color: C.faint, fontSize: 10.5, lineHeight: 16, textAlign: "center", marginTop: 18, maxWidth: 420 },

  finishIcon: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 1.5, borderColor: C.line2, backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 18,
  },

  /* name-capture modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,6,10,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: "center",
  },
  modalEyebrow: { fontSize: 9.5, letterSpacing: 3, textTransform: "uppercase", color: "#8a7c86", fontWeight: "700", marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: C.ink, textAlign: "center", lineHeight: 28, marginBottom: 8, fontFamily: FONT.display },
  modalSub: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 19, marginBottom: 18 },
  modalInput: {
    width: "100%",
    backgroundColor: C.bg2,
    borderWidth: 1.5,
    borderColor: C.line2,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    color: C.ink,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  modalError: { color: C.rd || "#ff6b6b", fontSize: 12, marginTop: 8, textAlign: "center" },
});
