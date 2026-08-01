import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, Pressable, ScrollView, Animated, Easing,
  StyleSheet, Dimensions, PanResponder, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFonts, SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";

import { useQuestionnaireV2 } from "../../../../src/context/QuestionnaireV2Context";
// ^ adjust relative depth if you place files differently:
//   app/(gowealthy)/questionnaire-v2/section1/index.jsx -> src/context/*

import {
  QUIZ, getPersonality, bandLabel, dimCode, personaDelayCost,
  B1_MSG, B1_EMO,
} from "../../../../src/lib/goPersonaEngine";

/* ============================================================
   THEME — "ember forge", ported 1:1 from the HTML :root block
   ============================================================ */
const C = {
  bg: "#08060a", bg2: "#0e0a10", bg3: "#151019",
  surface: "#181219", surface2: "#1f1722",
  line: "rgba(255,180,120,0.09)", line2: "rgba(255,180,120,0.16)",
  ink: "#fbf5ef", muted: "#a99ba6", faint: "#332a36",
  o: "#ff6a1a", o2: "#ff8f3c", oDeep: "#d4470a",
  gold: "#f7c85a", gold2: "#ffe0a3",
  gd: "#4fd39a", rd: "#ff6b6b",
  glass: "rgba(30,22,34,0.72)", // slightly more opaque than web glass — RN has no real backdrop-blur on Android
};
const RADIUS = { lg: 22, md: 15, sm: 11 };
const { width: SCREEN_W } = Dimensions.get("window");

const FONT = {
  display: "SpaceGrotesk_700Bold",
  displaySemi: "SpaceGrotesk_600SemiBold",
  body: "Inter_400Regular",
  bodyMed: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
};

const STEP_LABEL = { landing: "Start", quiz: "Personality read", loading: "Reading", reveal: "Your persona" };

export default function Section1() {
  const router = useRouter();
  const {
    state, recordAnswer, setQuizIdx, setPersonaResult, markStarted,
  } = useQuestionnaireV2();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  const [step, setStep] = useState("landing"); // landing | quiz | loading | reveal
  const [tripleSel, setTripleSel] = useState({}); // { [rowIndex]: optionIndex } for the q3 triple question

  

  /* ---------------- quiz handlers ---------------- */

  const currentQuestion = QUIZ[state.quizIdx];

  const goToNextQuestion = useCallback(() => {
    const nextIdx = state.quizIdx + 1;
    if (nextIdx >= QUIZ.length) {
      setStep("loading");
    } else {
      setQuizIdx(nextIdx);
    }
  }, [state.quizIdx, setQuizIdx]);

  const handleSingleAnswer = (q, option) => {
    recordAnswer(q.tag.split(" · ")[0], option.text, option);
    setTimeout(goToNextQuestion, 160); // mirrors the HTML's 160ms select-flash delay
  };

  const handleTriplePick = (rowIndex, optIndex) => {
    setTripleSel(prev => ({ ...prev, [rowIndex]: optIndex }));
  };

  const handleTripleConfirm = () => {
    currentQuestion.rows.forEach((row, ri) => {
      const o = row.options[tripleSel[ri]];
      recordAnswer(currentQuestion.tag.split(" · ")[0], `${row.q} → ${o.text}`, o);
    });
    setTripleSel({});
    goToNextQuestion();
  };

  /* ---------------- start / continue ---------------- */

  const handleStart = () => {
    markStarted();
    setStep("quiz");
  };

  const handleLoadingDone = () => {
    const { persona, code } = getPersonality(state.scores.h, state.scores.c, state.scores.o);
    setPersonaResult(code, persona.key);
    setStep("reveal");
  };

  const handleContinue = () => {
    // Section2 doesn't exist yet — wire this once it's built.
    router.push("/(gowealthy)/questionnaire-v2/section2");
  };

  // The HTML's back button is stage-level, not per-question (see ORDER/goBack in the
  // source script — from anywhere inside the quiz it returns straight to landing).
  // Re-entering the loading screen isn't meaningful, so reveal's back goes to the
  // quiz's last question instead of replaying the loading animation.
  const handleBack = () => {
    if (step === "quiz") {
      setStep("landing");
    } else if (step === "reveal") {
      setQuizIdx(QUIZ.length - 1);
      setStep("quiz");
    }
  };

  const progress =
    step === "landing" ? 0 :
    step === "quiz" ? (state.quizIdx / QUIZ.length) * 0.7 :
    step === "loading" ? 0.85 :
    1;
if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <View style={styles.root}>
      <Embers />
      <ProgressBar progress={progress} />
      <TopBar visible={step !== "landing"} label={STEP_LABEL[step]} onBack={handleBack} />

      {step === "landing" && <Landing onStart={handleStart} />}

      {step === "quiz" && currentQuestion && (
        <QuizScreen
          question={currentQuestion}
          index={state.quizIdx}
          total={QUIZ.length}
          tripleSel={tripleSel}
          onSingleAnswer={handleSingleAnswer}
          onTriplePick={handleTriplePick}
          onTripleConfirm={handleTripleConfirm}
        />
      )}

      {step === "loading" && <BuildLoading onDone={handleLoadingDone} />}

      {step === "reveal" && (
        <RevealScreen
          scores={state.scores}
          answers={state.answers}
          personaCode={state.personaCode}
          onContinue={handleContinue}
        />
      )}
    </View>
  );
}

/* ============================================================
   Ambient embers — rising particles, ported from .ember/@keyframes rise
   ============================================================ */
function Embers() {
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
function ProgressBar({ progress }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={styles.progWrap}>
      <Animated.View style={{ height: "100%", width }}>
        <LinearGradient colors={[C.oDeep, C.o, C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}
function TopBar({ visible, label, onBack }) {
  if (!visible) return null;
  return (
    <View style={styles.topbar}>
      <Pressable onPress={onBack} style={styles.backBtn} hitSlop={10}>
        <Text style={{ color: C.muted, fontSize: 17 }}>←</Text>
      </Pressable>
      <View style={styles.stepTag}>
        <Text style={{ color: C.muted, fontSize: 10.5, fontFamily: FONT.bodySemi, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {label}
        </Text>
      </View>
      <View style={{ width: 38 }} />
    </View>
  );
}

/* ============================================================
   Screen 0 — Landing
   ============================================================ */
function Landing({ onStart }) {
  return (
    <View style={styles.stage}>
      <View style={styles.eyebrow}>
        <View style={styles.eyebrowLine} />
        <Text style={styles.eyebrowText}>GOPERSONA × GOWEALTHY</Text>
        <View style={styles.eyebrowLine} />
      </View>
      <Text style={[styles.h1, { marginBottom: 16 }]}>
        Your money,{"\n"}
        <Text style={styles.gradText}>forged</Text> around what you actually want.
      </Text>
      <Text style={styles.sub}>
        Eight quick gut-checks. No spreadsheets, no jargon. We read how you really move with
        money, then turn it into a live plan built around the goals you rank first.
      </Text>
      <PrimaryButton label="Start the 90-second read →" onPress={onStart} style={{ marginTop: 26 }} />
      <View style={styles.landingChipsRow}>
        {["✦ 8 scenarios", "✦ 1 personality", "✦ 1 real plan"].map(t => (
          <Text key={t} style={styles.landingChip}>{t}</Text>
        ))}
      </View>
    </View>
  );
}

/* ============================================================
   Screen — Quiz (single-select + triple-row types)
   ============================================================ */
function QuizScreen({ question, index, total, tripleSel, onSingleAnswer, onTriplePick, onTripleConfirm }) {
  return (
    <ScrollView style={styles.stageTopScroll} contentContainerStyle={styles.stageTopContent} showsVerticalScrollIndicator={false}>
      <View style={styles.eyebrowSolo}>
        <Text style={styles.eyebrowText}>{question.tag} · {index + 1} / {total}</Text>
      </View>
      <Text style={styles.h2}>{question.title}</Text>
      <Text style={styles.sub}>{question.sub}</Text>

      {question.type === "single" ? (
        <View style={styles.choicesWrap}>
          {question.options.map((o, i) => (
            <ChoiceCard key={`${question.id}-${i}`} icon={o.icon} text={o.text} onPress={() => onSingleAnswer(question, o)} delay={i * 50} />
          ))}
        </View>
      ) : (
        <TripleQuestion question={question} sel={tripleSel} onPick={onTriplePick} onConfirm={onTripleConfirm} />
      )}
    </ScrollView>
  );
}

function ChoiceCard({ icon, text, onPress, delay = 0 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [selected, setSelected] = useState(false);
  const press = () => {
    setSelected(true);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 90, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <FadeInUp delay={delay}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
  onPress={press}
  android_ripple={{ color: "transparent" }}
  style={[styles.choice, selected && styles.choiceSelected]}
>
          <Text style={styles.chIcon}>{icon}</Text>
          <Text style={styles.chText}>{text}</Text>
        </Pressable>
      </Animated.View>
    </FadeInUp>
  );
}

function TripleQuestion({ question, sel, onPick, onConfirm }) {
  const allPicked = Object.keys(sel).length >= question.rows.length;
  return (
    <View style={{ width: "100%" }}>
      {question.rows.map((row, ri) => (
        <FadeInUp key={ri} delay={ri * 60}>
          <View style={styles.rowq}>
            <Text style={styles.rowqQ}>{row.q}</Text>
            <View style={styles.rowqOpts}>
              {row.options.map((o, oi) => {
                const active = sel[ri] === oi;
                return (
                  <Pressable
  key={oi}
  onPress={() => onPick(ri, oi)}
  android_ripple={{ color: "transparent" }}
  style={[styles.rowqOpt, active && styles.rowqOptSelected]}
>
                    <Text style={styles.rowqIc}>{o.icon}</Text>
                    <Text style={[styles.rowqOptText, active && { color: C.o2, fontFamily: FONT.bodySemi }]}>
                      {o.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </FadeInUp>
      ))}
      <PrimaryButton label="Next →" onPress={onConfirm} disabled={!allPicked} style={{ marginTop: 8 }} />
    </View>
  );
}

/* ============================================================
   Screen — Build1 loading
   ============================================================ */
function BuildLoading({ onDone }) {
  const [pct, setPct] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })
    ).start();
    const t = setInterval(() => {
      setPct(prev => {
        const next = Math.min(prev + 2.2, 100);
        const i = Math.min(B1_MSG.length - 1, Math.floor((next / 100) * B1_MSG.length));
        setMsgIdx(i);
        if (next >= 100) {
          clearInterval(t);
          setTimeout(onDone, 450);
        }
        return next;
      });
    }, 26);
    return () => clearInterval(t);
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.stage}>
      <View style={styles.buildOrbWrap}>
        <Animated.View style={[styles.buildOrbRing, { transform: [{ rotate }] }]}>
          <LinearGradient colors={["transparent", C.o, C.gold, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        </Animated.View>
        <View style={styles.buildOrbCenter}>
          <Text style={{ fontSize: 44 }}>{B1_EMO[msgIdx]}</Text>
        </View>
      </View>
      <Text style={[styles.h2, { marginTop: 8 }]}>
        {pct >= 100 ? "Your persona is ready ✦" : "Reading how you move…"}
      </Text>
      <View style={styles.buildTrack}>
        <View style={[styles.buildFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.buildMsg}>{B1_MSG[msgIdx]}</Text>
    </View>
  );
}

/* ============================================================
   Screen — Persona Reveal (trading card + Why did I get this?)
   ============================================================ */
function RevealScreen({ scores, answers, personaCode, onContinue }) {
  const { persona, code } = useMemo(() => getPersonality(scores.h, scores.c, scores.o), [scores]);
  const [opened, setOpened] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const dealAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(dealAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }).start();
  }, []);
  const cardScale = dealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const cardOpacity = dealAnim;

  return (
    <ScrollView style={styles.stageTopScroll} contentContainerStyle={styles.stageTopContent} showsVerticalScrollIndicator={false}>
      <View style={styles.eyebrowSolo}><Text style={styles.eyebrowText}>YOUR GOPERSONA</Text></View>
      <Text style={[styles.h2, { marginBottom: 6 }]}>
        Here's how <Text style={styles.gradText}>you</Text> move.
      </Text>
      <Text style={[styles.sub, { marginBottom: 22 }]}>Pulled straight from your gut-calls — nothing generic.</Text>

      <Animated.View style={{ opacity: cardOpacity, transform: [{ scale: cardScale }], width: "100%", maxWidth: 360, alignSelf: "center" }}>
        <TiltCard persona={persona} opened={opened} onOpen={() => setOpened(true)} />
      </Animated.View>

      <Pressable onPress={() => setWhyOpen(v => !v)} style={styles.whyToggle}>
        <Text style={styles.whyToggleText}>{whyOpen ? "Hide the breakdown ▴" : "Why did I get this? ▾"}</Text>
      </Pressable>

      {whyOpen && (
        <WhyPanel scores={scores} answers={answers} persona={persona} code={code} />
      )}

      <PrimaryButton label="See what starting today unlocks →" onPress={onContinue} style={{ marginTop: 22 }} />
    </ScrollView>
  );
}

/** Trading-card reveal. On web this tilts to pointer position on hover; touch has no
 *  hover, so this uses a drag-to-tilt gesture instead (tilts while your finger is on
 *  the card, springs back to flat on release) — same visual language, touch-appropriate
 *  interaction. Tap (no drag) opens the detail panel, matching the HTML's click-to-open. */
function TiltCard({ persona, opened, onOpen }) {
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const cardSize = useRef({ w: 320, h: 420 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gesture) => {
        const { w, h } = cardSize.current;
        const px = Math.max(0, Math.min(1, (gesture.moveX - gesture.x0 + w / 2) / w));
        const py = Math.max(0, Math.min(1, (gesture.moveY - gesture.y0 + h / 2) / h));
        tiltY.setValue((px - 0.5) * 10); // rotateY
        tiltX.setValue((0.5 - py) * 10); // rotateX
      },
      onPanResponderRelease: (evt, gesture) => {
        Animated.spring(tiltX, { toValue: 0, useNativeDriver: true }).start();
        Animated.spring(tiltY, { toValue: 0, useNativeDriver: true }).start();
        // treat a near-stationary press as a tap
        if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6 && !opened) onOpen();
      },
    })
  ).current;

  const rotateXStr = tiltX.interpolate({ inputRange: [-10, 10], outputRange: ["-10deg", "10deg"] });
  const rotateYStr = tiltY.interpolate({ inputRange: [-10, 10], outputRange: ["-10deg", "10deg"] });

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={e => { cardSize.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}
    >
      <Animated.View style={[styles.tcard, { transform: [{ perspective: 900 }, { rotateX: rotateXStr }, { rotateY: rotateYStr }] }]}>
        <Text style={styles.tcardRank}>GOPERSONA</Text>
        <Text style={styles.tcardIcon}>{persona.icon}</Text>
        <Text style={styles.tcardName}>{persona.name}</Text>

        {!opened && (
          <View style={styles.tcardTap}>
            <Text style={styles.tcardTapText}>Tap to know more ✦</Text>
          </View>
        )}

        {opened && (
          <View style={styles.tcardDetail}>
            <View style={styles.traitsRow}>
              {persona.traits.map(t => (
                <View key={t} style={styles.trait}><Text style={styles.traitText}>{t}</Text></View>
              ))}
            </View>
            <TLine label="💡 Superpower" text={persona.superpower} />
            <TLine label="⚡ Blind spot" text={persona.blindspot} />
            <TLine label="📉 In a crash" text={persona.crash} />
            <TLine label="🔮 Five years out" text={persona.prediction} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}
function TLine({ label, text }) {
  return (
    <View style={styles.tline}>
      <Text style={styles.tlineLabel}>{label}</Text>
      <Text style={styles.tlineText}>{text}</Text>
    </View>
  );
}

/** "Why did I get this?" — per-dimension score breakdown, ported 1:1 from renderWhy(). */
function WhyPanel({ scores, answers, persona, code }) {
  const dims = [
    { name: "H · Heuristic (gut-led speed)", color: C.gd, field: "dH", score: scores.h },
    { name: "C · Cognitive (analytical rigour)", color: C.o2, field: "dC", score: scores.c },
    { name: "O · Orientation (risk / boldness)", color: C.gold, field: "dO", score: scores.o },
  ];
  return (
    <View style={styles.whyBody}>
      {dims.map(d => {
        const rows = answers.filter(a => a[d.field] !== 0);
        return (
          <View key={d.field} style={styles.whyDim}>
            <View style={styles.whyHead}>
              <Text style={[styles.whyName, { color: d.color }]}>{d.name}</Text>
              <Text style={[styles.whyScore, { color: d.color }]}>{d.score} / 10 · {bandLabel(d.score).toUpperCase()}</Text>
            </View>
            <WhyRow left="Neutral start" right="5" />
            {rows.map((r, i) => (
              <WhyRow
                key={i}
                left={`${r.tag} — "${r.label}"`}
                right={`${r[d.field] > 0 ? "+" : ""}${r[d.field]}`}
                positive={r[d.field] > 0}
              />
            ))}
            <WhyRow left="Final" right={`${d.score} → ${bandLabel(d.score)}`} bold color={d.color} />
          </View>
        );
      })}
      <View style={styles.whyFinal}>
        <Text style={styles.whyFinalText}>
          <Text style={{ fontFamily: FONT.bodyBold }}>How you were matched: </Text>
          each answer nudges three dials — H, C and O — from a neutral 5. A final score of{" "}
          <Text style={{ fontFamily: FONT.bodyBold }}>0–5 reads Low</Text>,{" "}
          <Text style={{ fontFamily: FONT.bodyBold }}>6–10 reads High</Text>. Your reading is{" "}
          <Text style={{ fontFamily: FONT.bodyBold }}>
            H:{bandLabel(scores.h)} · C:{bandLabel(scores.c)} · O:{bandLabel(scores.o)}
          </Text>{" "}
          (code <Text style={{ fontFamily: FONT.bodyBold }}>{code}</Text>), which is the signature of the{" "}
          <Text style={{ fontFamily: FONT.bodyBold }}>{persona.name}</Text>.
        </Text>
      </View>
    </View>
  );
}
function WhyRow({ left, right, positive, bold, color }) {
  return (
    <View style={styles.whyRow}>
      <Text style={styles.whyRowLeft} numberOfLines={2}>{left}</Text>
      <Text style={[
        styles.whyRowRight,
        positive === true && { color: C.gd },
        positive === false && { color: C.rd },
        bold && { fontFamily: FONT.bodySemi, color: color || C.ink },
      ]}>
        {right}
      </Text>
    </View>
  );
}

/* ============================================================
   Shared small components
   ============================================================ */
function FadeInUp({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function PrimaryButton({ label, onPress, disabled, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.timing(scale, { toValue: 0.985, duration: 90, useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }], width: "100%", maxWidth: 420 }, style]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
        <LinearGradient
          colors={disabled ? [C.faint, C.faint] : [C.o2, C.o]}
          style={[styles.btn, disabled && { opacity: 0.5 }]}
        >
          <Text style={styles.btnText}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   Styles — values ported from the HTML's CSS as closely as RN allows
   ============================================================ */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  progWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.05)", zIndex: 60 },
topbar: {
  position: "absolute", top: Platform.OS === "ios" ? 60 : 60, left: 18, right: 18, zIndex: 55,
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

  stage: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, paddingTop: 130, paddingBottom: 40 },
  stageTopScroll: { flex: 1 },
  stageTopContent: { alignItems: "center", paddingHorizontal: 22, paddingTop: 130, paddingBottom: 60 },

  eyebrow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  eyebrowSolo: { marginBottom: 14, alignItems: "center" },
  eyebrowLine: { width: 20, height: 1, backgroundColor: C.o2 },
  eyebrowText: { color: C.o2, fontSize: 11, fontFamily: FONT.bodySemi, letterSpacing: 2, textTransform: "uppercase" },

  h1: {
    fontFamily: FONT.display, color: C.ink, fontSize: 36, lineHeight: 40,
    letterSpacing: -1, textAlign: "center",
  },
  h2: {
    fontFamily: FONT.display, color: C.ink, fontSize: 26, lineHeight: 31,
    letterSpacing: -0.8, textAlign: "center", marginBottom: 12,
  },
  gradText: { color: C.gold }, // true gradient text needs MaskedView; solid gold is the RN fallback
  sub: { color: C.muted, fontSize: 14.5, textAlign: "center", lineHeight: 22, maxWidth: 420 },

  landingChipsRow: { flexDirection: "row", gap: 16, marginTop: 20, flexWrap: "wrap", justifyContent: "center" },
  landingChip: { color: C.muted, fontSize: 12 },

  choicesWrap: { width: "100%", maxWidth: 440, gap: 11, marginTop: 20 },
  choice: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.line,
    borderRadius: RADIUS.md, paddingVertical: 15, paddingHorizontal: 17,
  },
  choiceSelected: {
  borderColor: C.o, backgroundColor: "rgba(255,106,26,0.14)",
  shadowColor: C.o, shadowOpacity: 0.4, shadowRadius: 12,
},
  chIcon: { fontSize: 22, width: 26, textAlign: "center" },
  chText: { color: C.ink, fontSize: 14.5, fontFamily: FONT.bodyMed, flex: 1, lineHeight: 20 },

  rowq: {
    width: "100%", maxWidth: 440, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderRadius: RADIUS.md, padding: 16, marginBottom: 14,
  },
  rowqQ: { color: C.ink, fontSize: 13.5, fontFamily: FONT.bodySemi, marginBottom: 11 },
  rowqOpts: { flexDirection: "row", gap: 9 },
  rowqOpt: {
    flex: 1, backgroundColor: C.bg3, borderWidth: 1.5, borderColor: C.line,
    borderRadius: 11, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center",
  },
  rowqOptSelected: { borderColor: C.o, backgroundColor: "rgba(255,106,26,0.12)" },
  rowqIc: { fontSize: 18, marginBottom: 5 },
  rowqOptText: { color: C.ink, fontSize: 12.5, textAlign: "center" },

  btn: {
    borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 26,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.o, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  btnText: { color: "#1a0d04", fontSize: 15.5, fontFamily: FONT.bodySemi },

  buildOrbWrap: { width: 120, height: 120, marginBottom: 26, alignItems: "center", justifyContent: "center" },
  buildOrbRing: { position: "absolute", width: 120, height: 120, borderRadius: 60, overflow: "hidden" },
  buildOrbCenter: {
    width: 108, height: 108, borderRadius: 54, backgroundColor: C.bg2,
    alignItems: "center", justifyContent: "center",
  },
  buildTrack: { width: "100%", maxWidth: 300, height: 6, backgroundColor: C.faint, borderRadius: 6, overflow: "hidden", marginTop: 6 },
  buildFill: { height: "100%", backgroundColor: C.o, borderRadius: 6 },
  buildMsg: { color: C.muted, fontSize: 13.5, marginTop: 16, textAlign: "center", fontFamily: FONT.bodyMed },

  tcard: {
    borderRadius: 24, padding: 26, paddingTop: 24,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line2,
    shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 10,
    alignItems: "center", overflow: "hidden",
  },
  tcardRank: { position: "absolute", top: 16, right: 18, color: C.gold, fontFamily: FONT.displaySemi, fontSize: 11, letterSpacing: 2 },
  tcardIcon: { fontSize: 60, marginTop: 4 },
  tcardName: { fontFamily: FONT.display, color: C.ink, fontSize: 25, marginTop: 10, textAlign: "center" },
  tcardTap: {
    marginTop: 16, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(247,200,90,0.35)",
    backgroundColor: "rgba(247,200,90,0.05)", borderRadius: 30, paddingVertical: 9, paddingHorizontal: 16,
  },
  tcardTapText: { color: C.gold, fontSize: 12, fontFamily: FONT.bodySemi, letterSpacing: 1 },
  tcardDetail: { width: "100%", marginTop: 18 },
  traitsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center", marginBottom: 18 },
  trait: {
    backgroundColor: "rgba(255,106,26,0.1)", borderWidth: 1, borderColor: "rgba(255,106,26,0.24)",
    borderRadius: 30, paddingVertical: 6, paddingHorizontal: 13,
  },
  traitText: { color: C.o2, fontSize: 11.5, fontFamily: FONT.bodySemi },
  tline: { marginBottom: 13 },
  tlineLabel: { color: C.muted, fontSize: 10, fontFamily: FONT.bodySemi, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  tlineText: { color: C.ink, fontSize: 13, lineHeight: 20 },

  whyToggle: {
    width: "100%", maxWidth: 440, marginTop: 22, borderWidth: 1, borderStyle: "dashed", borderColor: C.line2,
    borderRadius: RADIUS.md, paddingVertical: 14, alignItems: "center",
  },
  whyToggleText: { color: C.o2, fontSize: 13, fontFamily: FONT.bodySemi },
  whyBody: { width: "100%", maxWidth: 440, marginTop: 12 },
  whyDim: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: RADIUS.md, padding: 15, marginBottom: 11 },
  whyHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9 },
  whyName: { fontFamily: FONT.displaySemi, fontSize: 13.5 },
  whyScore: { fontFamily: FONT.display, fontSize: 13.5 },
  whyRow: {
    flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  whyRowLeft: { color: C.muted, fontSize: 12, flex: 1 },
  whyRowRight: { color: C.muted, fontFamily: FONT.displaySemi, fontSize: 12 },
  whyFinal: {
    backgroundColor: "rgba(255,106,26,0.07)", borderWidth: 1, borderColor: "rgba(255,106,26,0.2)",
    borderRadius: RADIUS.md, padding: 15,
  },
  whyFinalText: { color: C.ink, fontSize: 12.5, lineHeight: 20 },
});