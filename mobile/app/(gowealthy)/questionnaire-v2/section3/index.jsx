import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, Animated, StyleSheet, LayoutAnimation, Platform, UIManager, PanResponder,
} from "react-native";
import { useRouter } from "expo-router";

import { useQuestionnaireV2 } from "../../../../src/context/QuestionnaireV2Context";
import { GOALS, PRI_WORDS, PRI_ICON } from "../../../../src/lib/goPersonaEngine";
import { C, FONT, RADIUS, Embers, ProgressBar, TopBar, PrimaryButton, Eyebrow, kitStyles } from "../../../../src/lib/ui-kit";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MAX_GOALS = 4;
const ROW_HEIGHT = 78; // card height + margin — kept intentionally uniform so drag math stays simple/reliable

export default function Section3() {
  const router = useRouter();
  const { state, setSelectedGoals } = useQuestionnaireV2();
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const goNext = () => {
    // Section4 doesn't exist yet — wire this once it's built.
    router.push("/(gowealthy)/questionnaire-v2/section4");
  };
  const handleBack = () => router.back(); // returns to section2's Living screen

  const pickedKeys = state.selectedGoals.map(g => g.key);
  const n = pickedKeys.length;
  const canContinue = n >= 1 && n <= MAX_GOALS;

  // picked goals first (in priority order), unpicked goals after — matches the HTML exactly
  const ordered = useMemo(() => {
    const picked = state.selectedGoals.map(sg => GOALS.find(g => g.key === sg.key));
    const unpicked = GOALS.filter(g => !pickedKeys.includes(g.key));
    return [...picked, ...unpicked];
  }, [state.selectedGoals]);

  const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const toggleGoal = (key) => {
    animateLayout();
    const i = state.selectedGoals.findIndex(g => g.key === key);
    if (i >= 0) {
      // tapping a picked card's body (not the handle) un-ranks it — matches the HTML
      setSelectedGoals(state.selectedGoals.filter(g => g.key !== key));
    } else {
      if (state.selectedGoals.length >= MAX_GOALS) return;
      const g = GOALS.find(x => x.key === key);
      setSelectedGoals([...state.selectedGoals, { key, years: g.defaultYears }]);
    }
  };

  // live reorder while dragging — called by GoalCard's pan responder as the finger
  // crosses a row-height threshold, same live-reorder-during-drag feel as the HTML's
  // pointermove/elementFromPoint approach.
  const reorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const next = [...state.selectedGoals];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setSelectedGoals(next);
  };

  return (
    <View style={styles.root}>
      <Embers />
      <ProgressBar progress={0.5} />
      <TopBar visible label="Rank goals" onBack={handleBack} />

      {/* scrollEnabled is toggled off for the duration of a drag — otherwise the
          ScrollView's own gesture recognizer competes with the drag handle's
          PanResponder for the touch, which is a common RN-specific gotcha that
          has no equivalent on the web (browsers don't have competing gesture
          recognizers the same way). */}
      <ScrollView
        contentContainerStyle={kitStyles.stageTopContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        <Eyebrow>Rank what matters</Eyebrow>
        <Text style={kitStyles.h2}>
          Pick your goals{"\n"}<Text style={kitStyles.gradText}>— in order.</Text>
        </Text>
        <Text style={[kitStyles.sub, { marginBottom: 16 }]}>
          The order you tap them <Text style={{ fontFamily: FONT.bodyBold }}>is</Text> their priority. Your #1 gets
          the biggest push and lands soonest. Drag the handle to reorder anytime.
        </Text>

        <Text style={styles.counter}>
          {n === 0 ? (
            <>Tap <Text style={styles.counterBold}>1 to 4</Text> goals — the order becomes your priority</>
          ) : (
            <>Ranked <Text style={styles.counterBold}>{n}</Text> · {n < MAX_GOALS ? "tap more or " : ""}drag the handle to reorder</>
          )}
        </Text>

        <View style={styles.grid}>
          {ordered.map((g) => {
            const rank = pickedKeys.indexOf(g.key);
            const picked = rank >= 0;
            return (
              <GoalCard
                key={g.key}
                goal={g}
                rank={rank}
                picked={picked}
                pickedCount={n}
                onToggle={() => toggleGoal(g.key)}
                onReorder={reorder}
                onDragStateChange={(dragging) => setScrollEnabled(!dragging)}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton label="Set your timeframes →" onPress={goNext} disabled={!canContinue} />
      </View>
    </View>
  );
}

/** One goal row. Unpicked: tap anywhere to rank it (adds to the end).
 *  Picked: tap the body to un-rank it; drag the handle (⠿) to reorder —
 *  live-reorders as you cross a row-height threshold, then springs back
 *  to flat on release.
 *
 *  The PanResponder is created exactly once (useRef) — its handlers read
 *  `rank`/`pickedCount`/`onReorder` via refs that are updated every render,
 *  never captured directly in the responder's closures. This matters:
 *  during a fast multi-row drag, several re-renders happen mid-gesture,
 *  and a responder that captured a stale `onReorder` would compute
 *  reorders against an outdated goals array and silently corrupt the
 *  order. Refs guarantee every move-event reads the current values. */
function GoalCard({ goal, rank, picked, pickedCount, onToggle, onReorder, onDragStateChange }) {
  const dragY = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);

  const rankRef = useRef(rank);
  const pickedCountRef = useRef(pickedCount);
  const onReorderRef = useRef(onReorder);
  const onDragStateChangeRef = useRef(onDragStateChange);
  useEffect(() => { rankRef.current = rank; }, [rank]);
  useEffect(() => { pickedCountRef.current = pickedCount; }, [pickedCount]);
  useEffect(() => { onReorderRef.current = onReorder; }, [onReorder]);
  useEffect(() => { onDragStateChangeRef.current = onDragStateChange; }, [onDragStateChange]);

  const startIndexRef = useRef(rank);
  const committedDyRef = useRef(0);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragging(true);
        onDragStateChangeRef.current?.(true);
        startIndexRef.current = rankRef.current;
        committedDyRef.current = 0;
        dragY.setValue(0);
      },
      onPanResponderMove: (evt, gesture) => {
        const liveDy = gesture.dy - committedDyRef.current;
        dragY.setValue(liveDy);
        const steps = liveDy / ROW_HEIGHT;
        if (Math.abs(steps) >= 1) {
          const dir = steps > 0 ? 1 : -1;
          const nextIndex = Math.max(0, Math.min(pickedCountRef.current - 1, startIndexRef.current + dir));
          if (nextIndex !== startIndexRef.current) {
            onReorderRef.current(startIndexRef.current, nextIndex);
            startIndexRef.current = nextIndex;
            committedDyRef.current += dir * ROW_HEIGHT;
            dragY.setValue(gesture.dy - committedDyRef.current);
          }
        }
      },
      onPanResponderRelease: () => {
        setDragging(false);
        onDragStateChangeRef.current?.(false);
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        onDragStateChangeRef.current?.(false);
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.card,
        { borderColor: picked ? goal.color : C.line, backgroundColor: picked ? goal.color + "1a" : C.surface },
        dragging && { zIndex: 10, elevation: 8, shadowColor: goal.color, shadowOpacity: 0.5, shadowRadius: 16 },
        { transform: [{ translateY: dragY }] },
      ]}
    >
      <Pressable style={styles.cardBody} onPress={onToggle}>
        <View style={[styles.rank, picked && { backgroundColor: goal.color }]}>
          <Text style={[styles.rankText, picked && { color: "#fff" }]}>
            {picked ? PRI_ICON[rank] : "+"}
          </Text>
        </View>
        <Text style={styles.icon}>{goal.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{goal.name}</Text>
          <Text style={styles.desc}>{picked ? PRI_WORDS[rank] : goal.desc}</Text>
        </View>
      </Pressable>

      {picked && (
        <View {...responder.panHandlers} style={styles.handle} hitSlop={10}>
          <Text style={styles.handleText}>⠿</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  counter: { color: C.muted, fontSize: 12.5, textAlign: "center", marginBottom: 16 },
  counterBold: { color: C.gold2, fontFamily: FONT.bodyBold },

  grid: { width: "100%", maxWidth: 460, gap: 10 },

  card: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: RADIUS.md, height: ROW_HEIGHT - 10, marginBottom: 10,
    paddingHorizontal: 15,
  },
  cardBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: 13, height: "100%" },
  rank: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: C.faint,
    alignItems: "center", justifyContent: "center",
  },
  rankText: { color: C.muted, fontFamily: FONT.display, fontSize: 14 },
  icon: { fontSize: 23, width: 28, textAlign: "center" },
  name: { color: C.ink, fontSize: 14.5, fontFamily: FONT.bodySemi },
  desc: { color: C.muted, fontSize: 11.5, marginTop: 1 },
  handle: { paddingHorizontal: 8, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  handleText: { color: C.muted, fontSize: 18 },

  bottomBar: {
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 30 : 18,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line, alignItems: "center",
  },
});