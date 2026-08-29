
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
// ^ if this isn't installed yet: npx expo install expo-haptics
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useNavigation } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../src/config/firebase";
// ^ adjust to your actual firebase init path/export name — same as section5

import {
  PERSONALITIES,
  PRI_ICON,
  fmtINR,
  fmtLac,
  fmtAgeSmart,
  timelineStatus,
} from "../../../src/lib/goPersonaEngine";
import { C as UI_C, FONT as UI_FONT, RADIUS as UI_RADIUS, Embers, Eyebrow } from "../../../src/lib/ui-kit";

/* ============================================================
   PALETTE — ui-kit token if present, else the exact hex from
   gowealthy_full.html's :root. Keeps the design "as it is" even
   before every token exists on ui-kit.
   ============================================================ */
   const BRAND_LOGO = require("../../../assets/images/logo.png");
const PROFILE_IMAGE = require("../../../assets/images/profile/profileUser.png");
const C = {
  bg: "#08060a",
  bg2: "#0e0a10",
  surface: "#181219",
  surface2: "#1f1722",
  line: "rgba(255,180,120,0.09)",
  line2: "rgba(255,180,120,0.16)",
  ink: "#fbf5ef",
  muted: "#a99ba6",
  faint: "#332a36",
  o: "#ff6a1a",
  o2: "#ff8f3c",
  oDeep: "#d4470a",
  gold: "#f7c85a",
  gold2: "#ffe0a3",
  gd: "#4fd39a",
  rd: "#ff6b6b",
  ...(UI_C || {}),
};
const RADIUS = { lg: 22, md: 15, sm: 15, xs: 11, ...(UI_RADIUS || {}) };
const FONT = { display: undefined, bodyBold: undefined, bodySemi: undefined, ...(UI_FONT || {}) };

/* Where the swipe-to-start CTA sends the user. Update to your real route. */
const INVEST_ROUTE = "/(gowealthy)/invest";

/* ============================================================
   Small formatters that mirror the HTML dashboard's local helpers
   (goPersonaEngine's fmtINR/fmtLac are close but the dashboard used
   its own compact inrShort — reproduced here for parity).
   ============================================================ */
function inrFull(n) {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}
function inrShort(n) {
  n = n || 0;
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(n % 10000000 ? 1 : 0).replace(/\.0$/, "") + "Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(n % 100000 ? 1 : 0).replace(/\.0$/, "") + "L";
  if (n >= 1000) return "₹" + Math.round(n / 1000) + "K";
  return "₹" + Math.round(n);
}
function greetWord() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning," : h < 17 ? "Good afternoon," : "Good evening,";
}
function GoalMark({ color }) {
  return (
    <View
      style={[
        goalMarkStyles.outer,
        {
          borderColor: color + "88",
          shadowColor: color,
        },
      ]}
    >
      <View
        style={[
          goalMarkStyles.inner,
          {
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
}
/** Firestore Timestamp -> JS Date, tolerant of already-converted values. */
function toDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  if (ts instanceof Date) return ts;
  return null;
}
/** Day count since the plan was saved (Day 1 on the save date itself). */
function daysSince(completedAt) {
  const d = toDate(completedAt);
  if (!d) return 1;
  const diffMs = Date.now() - d.getTime();
  return Math.max(1, Math.floor(diffMs / 86400000) + 1);
}
function bucketWhy(b) {
  if (b.key === "security") return "Six months of essentials, built first — then this whole share moves over to your goals.";
  if (b.key === "buffer") return "A flat 5%, kept in the bank. Not a growth bucket — just breathing room you can reach in a day.";
  return `As your Priority ${b.rank + 1}, this gets a bigger share now, and picks up freed-up money as earlier goals finish.`;
}
/** Darkens/lightens a #rrggbb hex by `percent` (-1..1) — used for the routed-bar segment gradients. */
function shadeColor(hex, percent) {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = percent < 0 ? percent * -1 : percent;
  const R = f >> 16, G = (f >> 8) & 0x00ff, B = f & 0x0000ff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

const NAV_ITEMS = [
  { key: "secHome", icon: "⌂", label: "Home" },
  { key: "secBlueprint", icon: "◈", label: "Life Blueprint" },
  { key: "secMoney", icon: "▤", label: "Money" },
  { key: "secGoals", icon: "◎", label: "Goals" },
  { key: "secInvest", icon: "⇗", label: "Investments" },
  { key: "secIdentity", icon: "◍", label: "Financial Identity" },
];

/* ============================================================
   Data hook — fetch saved submission from Firestore
   ============================================================ */
function useDashboardData() {
  const [status, setStatus] = useState("loading"); // loading | error | empty | ready
  const [raw, setRaw] = useState(null);
  const [name, setName] = useState("friend");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const phone = await AsyncStorage.getItem("user_phone");
        if (!phone) {
          if (alive) setStatus("error");
          return;
        }
        const storedName = await AsyncStorage.getItem("user_name");
        if (alive && storedName) setName(storedName);

        const snap = await getDoc(doc(db, "gowealthy-questionaire", phone));
        if (!alive) return;

        if (!snap.exists() || !snap.data()?.questionnaire_completed || !snap.data()?.allocation) {
          setStatus("empty");
          return;
        }
        setRaw(snap.data());
        setStatus("ready");
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { status, raw, name };
}

/* ============================================================
   Root screen
   ============================================================ */
export default function Home() {
  const router = useRouter();
  const navigation = useNavigation();
  const { status, raw, name } = useDashboardData();
  const [investStarted, setInvestStarted] = useState(false);
  const scrollRef = useRef(null);
  const sectionY = useRef({});
  const [activeSec, setActiveSec] = useState("secHome");

  // The swipe-to-start slider kept losing the drag to the stack's native
  // left-edge "swipe back" gesture — that gesture lives outside RN's JS
  // touch responder system, so toggling it mid-drag was too late/racy.
  // Home is the dashboard root anyway (nav chips/buttons cover navigation),
  // so we just turn swipe-back off for this whole screen and restore it
  // the moment the user leaves.
  useEffect(() => {
    if (navigation?.setOptions) {
      try {
        navigation.setOptions({ gestureEnabled: false });
      } catch (e) {}
    }
    return () => {
      if (navigation?.setOptions) {
        try {
          navigation.setOptions({ gestureEnabled: true });
        } catch (e) {}
      }
    };
  }, [navigation]);

  const derived = useMemo(() => {
    if (!raw) return null;
    const A = raw.allocation; // { security, goals[], buffer, step, allBuckets[] }
    const J = raw.projection || {}; // keyed by bucket key
    const persona = PERSONALITIES.find((p) => p.key === raw.persona?.key) || PERSONALITIES[0];

    const goalsTotal = A.goals.reduce((s, g) => s + g.amount, 0);
    const workingTotal = A.security.amount + goalsTotal;
    const workPct = raw.monthlyInvestment > 0 ? Math.round((workingTotal / raw.monthlyInvestment) * 100) : 0;
    const monthsToSafety = A.security.amount > 0 ? Math.ceil(A.security.target / A.security.amount) : 0;
    const thisYear = new Date().getFullYear();
    const sortedByYear = [...A.goals].sort((a, b) => a.years - b.years);
    const cheapestSoon = sortedByYear[0];
    const topGoal = A.goals[0];

    return { A, J, persona, workingTotal, workPct, monthsToSafety, thisYear, sortedByYear, cheapestSoon, topGoal };
  }, [raw]);

  const goEditGoals = () => router.push("/(gowealthy)/questionnaire-v2/section3");
  const goRestart = () => router.replace("/(gowealthy)/questionnaire-v2/section1");
  const goAchievements = () => router.push("/(gowealthy)/questionnaire-v2/section5");
  const goInvest = () => router.push("/(gowealthy)/mf/onboarding/screen1");

  const jumpTo = (key) => {
    setActiveSec(key);
    const y = sectionY.current[key];
    if (scrollRef.current && typeof y === "number") {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }
  };

  const onScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    let current = "secHome";
    let best = -Infinity;
    Object.entries(sectionY.current).forEach(([key, secY]) => {
      if (secY - 90 <= y && secY > best) {
        best = secY;
        current = key;
      }
    });
    setActiveSec(current);
  };

  if (status === "loading") {
    return (
      <View style={styles.centerRoot}>
        <ActivityIndicator color={C.o2} size="large" />
        <Text style={styles.centerText}>Loading your blueprint…</Text>
      </View>
    );
  }
  if (status === "error") {
    return (
      <View style={styles.centerRoot}>
        <Text style={styles.centerTitle}>Couldn't load your dashboard</Text>
        <Text style={styles.centerText}>Check your connection and try again.</Text>
      </View>
    );
  }
  if (status === "empty" || !derived) {
    return (
      <View style={styles.centerRoot}>
        <Text style={styles.centerTitle}>No blueprint yet</Text>
        <Text style={styles.centerText}>Finish the questionnaire to build your plan.</Text>
        <Pressable style={styles.centerBtn} onPress={() => router.replace("/(gowealthy)/questionnaire-v2/section1")}>
          <Text style={styles.centerBtnText}>Start the questionnaire →</Text>
        </Pressable>
      </View>
    );
  }

  const { A, J, persona, workingTotal, workPct, monthsToSafety, thisYear, sortedByYear, topGoal } = derived;
  const displayName = raw.name || name; // Firestore's own `name` field wins once section5 starts saving it
  const now = new Date();
  const clockLine = now
    .toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })
    .toUpperCase();
  const clockTime = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const ageLabel = raw.age >= 35 ? "35+" : raw.age;
  const planDay = daysSince(raw.completedAt);

  const buckets = A.allBuckets.filter((b) => b.amount > 0);
  const bucketsTot = buckets.reduce((s, b) => s + b.amount, 0) || 1;

  return (
    <View style={styles.root}>
      <Embers />

      {/* STICKY IDENTITY HEADER */}
      <View style={styles.dhead}>
        <View style={styles.brandRow}>
         <View style={styles.logo}>
  <Image
    source={BRAND_LOGO}
    style={styles.logoImage}
    resizeMode="contain"
  />
</View>
          <View>
            <Text style={styles.brandName}>GoWealthy</Text>
            
          </View>
        </View>
        <View style={styles.userRow}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.duName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.duRole} numberOfLines={1}>
              {persona.name}
            </Text>
          </View>
        {/* <View style={styles.avatar}>
  <Image
    source={PROFILE_IMAGE}
    style={styles.avatarImage}
    resizeMode="cover"
  />
</View> */}
        </View>
      </View>

      {/* STICKY CHIP NAV */}
      <View style={styles.dnav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
          {NAV_ITEMS.map((n) => {
            const active = activeSec === n.key;
            return (
              <Pressable key={n.key} onPress={() => jumpTo(n.key)} style={[styles.navChip, active && styles.navChipActive]}>
                <Text style={[styles.navChipIcon, active && styles.navChipTextActive]}>{n.icon}</Text>
                <Text style={[styles.navChipText, active && styles.navChipTextActive]}>{n.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.dmain}
        onScroll={onScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- HOME: status + greeting ---- */}
        <View onLayout={(e) => (sectionY.current.secHome = e.nativeEvent.layout.y)}>
          <View style={styles.dtop}>
            <View style={styles.statusRow}>
              <View style={styles.dot} />
              <Text style={styles.statusText}>YOUR PLAN IS LIVE — DAY {planDay}</Text>
            </View>
            <Text style={styles.clockText}>
               Age {ageLabel}
            </Text>
          </View>

          <Text style={styles.greet}>
            {greetWord()}
            {"\n"}
            <Text style={styles.gradText}>{displayName}.</Text>
          </Text>
          {/* <Text style={styles.greetSub}>Your blueprint is live.</Text> */}
        </View>

        {/* ---- BLUEPRINT HERO + ROUTED BAR (was "Investments" further down) ---- */}
        <View onLayout={(e) => (sectionY.current.secInvest = e.nativeEvent.layout.y)}>
          <View style={styles.heroBlock}>
            <Eyebrow>Your financial life blueprint</Eyebrow>
            {/* <Text style={styles.heroNum}>{inrFull(workingTotal)}</Text>
            <Text style={styles.heroSub}>
              Working for your goals · {inrFull(A.buffer)}/mo stays liquid in your buffer, on top of this.
            </Text> */}

            <RoutedBar buckets={buckets} bucketsTot={bucketsTot} topGoalName={topGoal.name} monthlyTotal={raw.monthlyInvestment} />

            <View style={styles.heroMileBox}>
              <Eyebrow>Next milestone</Eyebrow>
              <Text style={styles.heroMileName}>Safety Net</Text>
              <View style={styles.heroMileRow}>
                <Text style={styles.heroMileTgt}>{inrShort(A.security.target)}</Text>
                <Text style={styles.heroMilePct}>0% complete</Text>
              </View>
              <Text style={styles.heroMileCap}>{inrFull(A.security.amount)}/mo · 6 months of essentials.</Text>
              <Text style={styles.heroMileEta}>{monthsToSafety > 0 ? `~${monthsToSafety} MONTHS AWAY` : "STARTS TODAY"}</Text>
            </View>
          </View>
        </View>

        {/* ---- BLUEPRINT: journey timeline (comet trail) ---- */}
        <View style={styles.dblock} onLayout={(e) => (sectionY.current.secBlueprint = e.nativeEvent.layout.y)}>
          <View style={styles.blockHeadRow}>
            <Eyebrow>Where this plan takes you</Eyebrow>
            <Text style={styles.hint}>swipe →</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            <JourneyNode label="You are here" sub={`Day ${planDay}`} now />
            <JourneyNode label="Safety Net" sub={inrShort(A.security.target)} />
            {sortedByYear.map((g, i) => (
              <JourneyNode
                key={g.key}
                label={g.name}
                sub={`${thisYear + Math.round(g.years)} · ${inrShort(g.target)}`}
                isLast={i === sortedByYear.length - 1}
              />
            ))}
          </ScrollView>
          {/* <Pressable onPress={goAchievements} style={{ marginTop: 4 }}>
            <Text style={styles.linkText}>See full future story →</Text>
          </Pressable> */}
        </View>

        {/* ---- MONEY NOW ---- */}
        <View style={styles.dblock} onLayout={(e) => (sectionY.current.secMoney = e.nativeEvent.layout.y)}>
          <Eyebrow>Your money, right now</Eyebrow>
          <Text style={styles.moneyBig}>{inrFull(raw.monthlyInvestment)}</Text>
          <Text style={styles.moneyCap}>FLOWING EACH MONTH</Text>
          <View style={styles.moneySplitRow}>
            <View style={styles.moneySplitCard}>
              <Text style={styles.msLabel}>WORKING FOR YOU</Text>
              <Text style={[styles.msValue, { color: C.o2 }]}>{inrFull(workingTotal)}</Text>
            </View>
            <View style={styles.moneySplitCard}>
              <Text style={styles.msLabel}>LIQUID BUFFER</Text>
              <Text style={styles.msValue}>{inrFull(A.buffer)}</Text>
            </View>
          </View>
          {/* <Text style={styles.moneyNote}>
            <Text style={styles.b}>{workPct}%</Text> of every rupee is working — split across safety net + {A.goals.length}{" "}
            goals.
          </Text> */}
        </View>

        {/* ---- START INVESTING CTA (swipe to confirm) ---- */}
        <View style={styles.swipeCardWrap}>
          <LinearGradient
            colors={[C.oDeep, C.o, C.o2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.swipeCard}
          >
            <Text style={styles.eyebrowOnDark}>Your first move</Text>
            <Text style={styles.swipeH3}>Let's put your money to work.</Text>
            <Text style={styles.swipeWhy}>
              Toward <Text style={styles.bOnDark}>{topGoal.name}</Text> · {inrFull(topGoal.amount)}/mo — one click kicks off
              the transfer.
            </Text>
            <StartInvestingButton
  done={investStarted}
  goalName={topGoal.name}
  onComplete={() => {
    setInvestStarted(true);
    setTimeout(goInvest, 750);
  }}
/>
          </LinearGradient>
        </View>

        {/* ---- GOALS ---- */}
        <View style={styles.dblock} onLayout={(e) => (sectionY.current.secGoals = e.nativeEvent.layout.y)}>
          <View style={styles.blockHeadRow}>
            <Eyebrow>Where your money is headed</Eyebrow>
            {/* <Text style={styles.blockHeadR}>
              {A.goals.length} goals · ranked by you
            </Text> */}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 2 }}>
            {A.goals.map((g, i) => {
              const yr = thisYear + Math.round(g.years);
              const rankLabel = `Priority ${i + 1}`;
              const isLead = i === 0;
              const funded = isLead && investStarted;
              const pct = funded ? Math.max(2, Math.min(100, Math.round((g.amount / g.target) * 100))) : 0;
              return (
                <View key={g.key} style={[styles.goalCard, isLead && styles.goalCardLead]}>
                  <View style={styles.goalTop}>
                   <GoalMark color={g.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalName, isLead && { fontSize: 17 }]}>{g.name}</Text>
                      <Text style={styles.goalMeta}>
                        {g.instrument} · target {yr}
                      </Text>
                    </View>
                    <Text style={styles.goalRank}>{rankLabel}</Text>
                  </View>
                  <View style={styles.goalAmtRow}>
                    <Text style={styles.goalAmtLeft}>
                      {inrFull(0)} of <Text style={styles.b}>{inrShort(g.target)}</Text>
                    </Text>
                    <Text style={styles.goalAmtRight}>▲ {inrFull(g.amount)}/mo</Text>
                  </View>
                  <View style={styles.goalTrack}>
                    <View style={[styles.goalFill, { width: `${pct}%`, backgroundColor: g.color }]} />
                  </View>
                  <View style={styles.goalFootRow}>
                    <Text style={styles.goalFootText}>{funded ? `${pct}% funded · you started ` : "0% funded · starts today"}</Text>
                    <Text style={styles.goalFootText}>
                      {Math.round(g.years) === 0 ? "this year" : `~${Math.round(g.years)} yr${Math.round(g.years) > 1 ? "s" : ""} out`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ---- IDENTITY ---- */}
        <View onLayout={(e) => (sectionY.current.secIdentity = e.nativeEvent.layout.y)}>
          <View style={styles.identityBlock}>
            <Eyebrow>Your financial identity</Eyebrow>
            <Text style={styles.identityName}>{persona.name}</Text>
            <View style={styles.identityRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.diLabel}>Strength</Text>
                <Text style={styles.diValue}>{persona.traits[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.diLabel}>Watch-out</Text>
                <Text style={styles.diValue}>{persona.blindspot.split(".")[0]}.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ---- ACTIONS + FOOTER ---- */}
        <View style={styles.btnsBlock}>
          <Pressable style={styles.ghostBtn} onPress={goEditGoals}>
            <Text style={styles.ghostBtnText}>✏️ Adjust my plan</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={goRestart}>
            <Text style={styles.ghostBtnText}>↺ Start over</Text>
          </Pressable>
        </View>
        {/* <Text style={styles.footText}>GoWealthy</Text> */}
      </ScrollView>
    </View>
  );
}

/* ============================================================
   Routed bar — advanced version of "how your ₹ is routed this
   month". Rounded gapped segments with a per-bucket gradient +
   a wrapping legend row underneath.
   ============================================================ */
function RoutedBar({ buckets, bucketsTot, topGoalName, monthlyTotal }) {
  return (
    <View style={styles.routedWrap}>
      {/* <View style={styles.routedTopRow}>
        <Text style={styles.routedCaption}>ROUTED THIS MONTH</Text>
        <Text style={styles.routedCaptionSub}>by priority · {topGoalName} is #1</Text>
      </View> */}
      <View style={styles.routedTrack}>
        {buckets.map((b) => {
          const w = (b.amount / bucketsTot) * 100;
          return (
            <View key={b.key} style={[styles.routedSegSlot, { width: `${w}%` }]}>
              <LinearGradient
                colors={[b.color, shadeColor(b.color, -0.28)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.routedSeg}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        {buckets.map((b) => (
          <View key={b.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: b.color }]} />
            {/* Exact rupee figures on purpose — rounding these to "K" (e.g. ₹1,600 → ₹2K)
                is what made the total look off; every rupee here is accounted for. */}
            <Text style={styles.legendText}>
              {b.name} <Text style={styles.legendAmt}>· {inrFull(b.amount)}</Text>
            </Text>
          </View>
        ))}
      </View>
      {/* <Text style={styles.routedTotal}>
        Adds up to <Text style={styles.b}>{inrFull(monthlyTotal ?? bucketsTot)}</Text>/mo — your full monthly amount.
      </Text> */}
    </View>
  );
}

/* ============================================================
   Swipe-to-start CTA — drag the thumb across the track; past the
   threshold it snaps to the end, locks, and fires onComplete
   (used to navigate to the invest route).
   ============================================================ */
// const THUMB_SIZE = 52;
// const TRACK_PAD = 5;

// function SwipeToStart({ onComplete, done, goalName }) {
//   const [trackWidth, setTrackWidth] = useState(0);
//   const maxTranslateRef = useRef(0);
//   const pan = useRef(new Animated.Value(0)).current;
//   const checkScale = useRef(new Animated.Value(1)).current;
//   const celebrate = useRef(new Animated.Value(0)).current;
//   const [locked, setLocked] = useState(!!done);

//   useEffect(() => {
//     maxTranslateRef.current = Math.max(0, trackWidth - THUMB_SIZE - TRACK_PAD * 2);
//   }, [trackWidth]);

//   useEffect(() => {
//     if (done) setLocked(true);
//   }, [done]);

//   const fireSuccess = () => {
//     setLocked(true);
//     try {
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     } catch (e) {}
//     Animated.sequence([
//       Animated.spring(checkScale, { toValue: 1.35, useNativeDriver: false, friction: 4 }),
//       Animated.spring(checkScale, { toValue: 1, useNativeDriver: false, friction: 5 }),
//     ]).start();
//     Animated.timing(celebrate, {
//       toValue: 1,
//       duration: 320,
//       delay: 100,
//       easing: Easing.out(Easing.cubic),
//       useNativeDriver: true,
//     }).start();
//     onComplete && onComplete();
//   };

//   const panResponder = useRef(
//     PanResponder.create({
//       // Only the thumb has these handlers attached, and we claim on touch
//       // START (not after some movement), so a deliberate press-and-drag on
//       // the thumb itself reliably wins the gesture — nothing to race against.
//       onStartShouldSetPanResponder: () => !locked,
//       onStartShouldSetPanResponderCapture: () => !locked,
//       onMoveShouldSetPanResponder: () => !locked,
//       onMoveShouldSetPanResponderCapture: () => !locked,
//       onPanResponderTerminationRequest: () => false,
//       onPanResponderMove: (_, g) => {
//         const max = maxTranslateRef.current;
//         const x = Math.min(Math.max(0, g.dx), max);
//         pan.setValue(x);
//       },
//       onPanResponderRelease: (_, g) => {
//         const max = maxTranslateRef.current;
//         // Slightly forgiving threshold (60%) + a velocity assist, so a
//         // confident quick flick completes it even if it didn't reach all
//         // the way to the end — but a light accidental nudge springs back.
//         const passedDistance = max > 0 && g.dx >= max * 0.6;
//         const passedFlick = max > 0 && g.dx >= max * 0.35 && g.vx > 0.6;
//         if (passedDistance || passedFlick) {
//           Animated.timing(pan, { toValue: max, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(
//             fireSuccess
//           );
//         } else {
//           Animated.spring(pan, { toValue: 0, useNativeDriver: false, friction: 7 }).start();
//         }
//       },
//       onPanResponderTerminate: () => {
//         Animated.spring(pan, { toValue: 0, useNativeDriver: false, friction: 7 }).start();
//       },
//     })
//   ).current;

//   const fillWidth = Animated.add(pan, new Animated.Value(THUMB_SIZE + TRACK_PAD));

//   return (
//     <View>
//       <View style={swipeStyles.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
//         <Animated.View style={[swipeStyles.trackFill, { width: fillWidth }]} />
//         <Text style={swipeStyles.trackLabel} pointerEvents="none">
//           {locked ? "✓ You're moving now" : "Swipe to begin  →"}
//         </Text>
//         <Animated.View
//           {...panResponder.panHandlers}
//           style={[
//             swipeStyles.thumb,
//             locked && swipeStyles.thumbDone,
//             { transform: [{ translateX: pan }, { scale: checkScale }] },
//           ]}
//         >
//           <Text style={swipeStyles.thumbIcon}>{locked ? "✓" : "→"}</Text>
//         </Animated.View>
//       </View>
//       {locked && (
//         <Animated.Text
//           style={[
//             swipeStyles.celebrate,
//             { opacity: celebrate, transform: [{ translateY: celebrate.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] },
//           ]}
//         >
//           Nice — that's real momentum toward {goalName || "your goal"}. 🎉
//         </Animated.Text>
//       )}
//     </View>
//   );
// }
function StartInvestingButton({ onComplete, done }) {
  const [pressed, setPressed] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (done) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.03,
          useNativeDriver: true,
          friction: 5,
        }),
        Animated.timing(glow, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [done]);

  const handlePressIn = () => {
    setPressed(true);

    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);

    Animated.spring(scale, {
      toValue: done ? 1.03 : 1,
      useNativeDriver: true,
      friction: 7,
    }).start();
  };

  const handlePress = () => {
    if (done) return;

    try {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch (e) {}

    onComplete?.();
  };

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.42],
  });

  return (
    <View style={investStyles.wrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          investStyles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.04],
            }) }],
          },
        ]}
      />

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            investStyles.button,
            done && investStyles.buttonDone,
            pressed && investStyles.buttonPressed,
          ]}
        >
          <View style={investStyles.buttonIcon}>
            <Text style={investStyles.buttonIconText}>
              {done ? "✓" : "↗"}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={investStyles.buttonTitle}>
              {done ? "Investment started" : "Start investing"}
            </Text>

            <Text style={investStyles.buttonSub}>
              {done
                ? "Opening your investment desk..."
                : "Move toward your first goal"}
            </Text>
          </View>

          {!done && (
            <Text style={investStyles.buttonArrow}></Text>
          )}
        </Pressable>
      </Animated.View>

      {/* {!done && (
        <Text style={investStyles.helper}>
          One tap · you'll review everything before investing
        </Text>
      )} */}
    </View>
  );
}

/* ---- journey node subcomponent — comet-trail connector on the
   "now" segment (gradient line + a small traveling glow head),
   plain dim connector on future segments ---- */
function JourneyNode({ label, sub, now, isLast }) {
  return (
    <View style={styles.jNode}>
      {!isLast && (now ? <CometTrail /> : <View style={styles.jLine} />)}
      <View style={styles.jDotWrap}>
        {now && <PulseGlow />}
        <View style={[styles.jDot, now && styles.jDotNow]} />
      </View>
      <Text style={[styles.jLbl, now && { color: C.o2 }]}>{label}</Text>
      <Text style={styles.jSub}>{sub}</Text>
    </View>
  );
}

/** Soft breathing ring behind the "now" dot. */
function PulseGlow() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  return <Animated.View style={[styles.jDotGlow, { opacity, transform: [{ scale }] }]} />;
}

/** Gradient connector with a small glowing head that travels along it — the
 *  "comet" advancing-progress effect requested for the journey timeline. */
function CometTrail() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 92] });
  const opacity = anim.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] });
  return (
    <View style={styles.jCometWrap}>
      <LinearGradient colors={[C.oDeep, C.o, C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.jCometBase} />
      <Animated.View style={[styles.jCometHead, { opacity, transform: [{ translateX }] }]} />
    </View>
  );
}

/* ============================================================
   Styles
   ============================================================ */
   const goalMarkStyles = StyleSheet.create({
  outer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.2,
    backgroundColor: "rgba(255,255,255,0.025)",
    shadowOpacity: 0.45,
    shadowRadius: 7,
    elevation: 3,
  },

  inner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
});
   const investStyles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },

  glow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  button: {
    minHeight: 68,
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,10,16,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  buttonPressed: {
    backgroundColor: "rgba(10,7,12,0.96)",
    borderColor: "rgba(255,255,255,0.38)",
  },

  buttonDone: {
    backgroundColor: "rgba(10,38,26,0.92)",
    borderColor: "rgba(79,211,154,0.45)",
  },

  buttonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  buttonIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  buttonTitle: {
    color: "#fbf9f6",
    fontSize: 15,
    paddingHorizontal : 3,
    fontWeight: "800",
  },

  buttonSub: {
    color: "#fbfaf7",
    paddingHorizontal : 3,
    fontSize: 10.5,
    marginTop: 3,
  },

  buttonArrow: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 10,
    marginRight: 5,
  },

  helper: {
    textAlign: "center",
    color: "rgba(255,255,255,0.58)",
    fontSize: 9.5,
    marginTop: 9,
  },
});
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  centerRoot: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  centerTitle: { color: C.ink, fontSize: 18, fontFamily: FONT.display, marginBottom: 8, textAlign: "center" },
  centerText: { color: C.muted, fontSize: 13.5, marginTop: 10, textAlign: "center" },
  centerBtn: { marginTop: 20, backgroundColor: C.o, paddingVertical: 14, paddingHorizontal: 22, borderRadius: RADIUS.sm },
  centerBtnText: { color: "#180f08", fontFamily: FONT.bodyBold, fontSize: 14 },

  /* header */
  dhead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 54 : 24,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(8,6,10,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  logo: {
    width: 25,
    height: 24,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.gold,
    marginRight: 9,
  },
  logoText: { color: "#eb7114", fontWeight: "800", fontSize: 15 },
  logoImage: {
  width: "100%",
  height: "110%",
  // borderRadius: 0,
},
  brandName: {
  color: C.ink,
  fontWeight: "700",
fontSize: 18,
  fontFamily: "Syne",
},
  brandTag: { color: C.muted, fontSize: 7, letterSpacing: 1.5, marginTop: 2 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  duName: { color: C.ink, fontSize: 12, fontWeight: "600", maxWidth: 104 },
  duRole: { color: C.o2, fontSize: 9, maxWidth: 104, marginTop: 1 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.o,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
avatarImage: {
  width: "50%",
  height: "50%",
  // borderRadius: 16,
},
  /* chip nav */
  dnav: {
    backgroundColor: "rgba(8,6,10,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  navScroll: { paddingHorizontal: 20, paddingVertical: 9, gap: 7, flexDirection: "row" },
  navChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 99,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    marginRight: 7,
  },
  navChipActive: { backgroundColor: C.gold, borderColor: "transparent" },
  navChipIcon: { fontSize: 12, color: C.muted },
  navChipText: { fontSize: 12, fontWeight: "600", color: C.muted },
  navChipTextActive: { color: "#1a1006" },

  /* main */
  dmain: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  dtop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gd },
  statusText: { fontSize: 8.5, letterSpacing: 1.4, color: C.muted, fontWeight: "700" },
  clockText: { fontSize: 8, letterSpacing: 1, color: "#7a6c76", textAlign: "right", lineHeight: 13 },

  greet: { fontSize: 32, fontWeight: "800", color: C.ink, lineHeight: 36, marginBottom: 10, fontFamily: FONT.display },
  gradText: { color: C.o2 },
  greetSub: { color: C.muted, fontSize: 13.5, lineHeight: 20, marginBottom: 8, maxWidth: 330 },

  heroBlock: { paddingTop: 14, paddingBottom: 4 },
  heroNum: { fontSize: 46, fontWeight: "800", color: C.o, marginVertical: 10, fontFamily: FONT.display },
  heroSub: { fontSize: 12, color: C.muted, lineHeight: 18, maxWidth: 330, marginBottom: 4 },
  heroMileBox: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: RADIUS.sm,
    backgroundColor: "rgba(247,200,90,0.06)",
  },
  heroMileName: { fontSize: 19, fontWeight: "800", color: C.gold2, marginVertical: 6 },
  heroMileRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  heroMileTgt: { fontSize: 17, fontWeight: "700", color: C.ink },
  heroMilePct: { fontSize: 11, color: C.gd, fontWeight: "600" },
  heroMileCap: { fontSize: 12, color: C.muted, lineHeight: 18, marginTop: 10 },
  heroMileEta: { fontSize: 9.5, letterSpacing: 1.4, color: C.o2, marginTop: 11, fontWeight: "700" },

  /* routed bar — now lives inside the blueprint hero */
  routedWrap: { marginTop: 10, marginBottom: 6 },
  routedTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  routedCaption: { fontSize: 9.5, letterSpacing: 1.6, color: C.muted, fontWeight: "700" },
  routedCaptionSub: { fontSize: 10.5, color: "#7a6c76" },
  routedTrack: {
    flexDirection: "row",
    height: 20,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    padding: 3,
    overflow: "hidden",
  },
  routedSegSlot: { paddingHorizontal: 1.5 },
  routedSeg: { flex: 1, borderRadius: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: C.ink, fontWeight: "600" },
  legendAmt: { color: C.muted, fontWeight: "500" },
  routedTotal: { fontSize: 11.5, color: C.muted, marginTop: 12, lineHeight: 17 },

  dblock: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 24 },
  blockHeadRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 },
  blockHeadR: { fontSize: 10.5, color: C.muted },
  hint: { fontSize: 9, letterSpacing: 1.2, color: "#6f6272", fontWeight: "700", textTransform: "uppercase" },

  /* journey — dot + connecting trail line; comet gradient + traveling
     glow head on the "now" segment */
  jNode: { width: 128, paddingRight: 12 },
  jDotWrap: { width: 16, height: 16, marginBottom: 13 },
  jLine: { position: "absolute", left: 21, right: 0, top: 7, height: 2, backgroundColor: C.faint, borderRadius: 2 },
  jCometWrap: { position: "absolute", left: 21, right: 0, top: 2, height: 12, justifyContent: "center" },
  jCometBase: { height: 2, width: "100%", borderRadius: 2 },
  jCometHead: {
    position: "absolute",
    top: 2,
    left: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.gold2,
    shadowColor: C.gold,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  jDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.bg2, borderWidth: 2, borderColor: C.faint },
  jDotNow: { backgroundColor: C.o, borderColor: C.o },
  jDotGlow: {
    position: "absolute",
    left: -5,
    top: -5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,106,26,0.18)",
  },
  jLbl: { fontSize: 11.5, fontWeight: "700", color: C.ink, lineHeight: 15 },
  jSub: { fontSize: 9.5, color: C.muted, marginTop: 4 },

  linkText: { color: C.o2, fontSize: 12.5, fontWeight: "700" },

  /* money */
  moneyBig: { fontSize: 36, fontWeight: "800", color: C.ink, marginTop: 10, marginBottom: 3, fontFamily: FONT.display },
  moneyCap: { fontSize: 8.5, letterSpacing: 1.4, color: "#7a6c76", marginBottom: 16, fontWeight: "700" },
  moneySplitRow: { flexDirection: "row", gap: 11, marginBottom: 15 },
  moneySplitCard: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: RADIUS.xs, padding: 11 },
  msLabel: { fontSize: 8, letterSpacing: 1.2, color: "#7a6c76", marginBottom: 4, fontWeight: "700" },
  msValue: { fontSize: 17, fontWeight: "800", color: C.ink },
  moneyNote: { fontSize: 12.5, color: C.muted, lineHeight: 20 },
  b: { fontFamily: FONT.bodyBold, color: C.ink },

  /* start-investing swipe CTA */
  swipeCardWrap: { marginTop : 0},
  swipeCard: { borderRadius: RADIUS.lg, padding: 22 },
  eyebrowOnDark: { fontSize: 9.5, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.75)", fontWeight: "700" },
  swipeH3: { fontSize: 24, fontWeight: "800", color: "#fff", marginVertical: 12 },
  swipeWhy: { fontSize: 12.5, lineHeight: 19, color: "rgba(255,255,255,0.94)", marginBottom: 18 },
  bOnDark: { fontFamily: FONT.bodyBold, color: "#fff" },

  /* footer actions */
  btnsBlock: { flexDirection: "column", gap: 10, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 22, marginTop: 26 },
  ghostBtn: { borderWidth: 1.5, borderColor: C.line2, borderRadius: RADIUS.sm, paddingVertical: 16, alignItems: "center" },
  ghostBtnText: { color: C.ink, fontWeight: "600", fontSize: 14 },
  footText: { textAlign: "center", fontSize: 10, color: "#6a5d66", marginTop: 20, lineHeight: 17 },

  /* goals */
  goalCard: {
    width: 272,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.sm,
    padding: 16,
    marginRight: 12,
  },
  goalCardLead: { width: 288, backgroundColor: "#2a1d1c", borderColor: C.line2 },
  goalTop: { flexDirection: "row", alignItems: "flex-start", gap: 11, marginBottom: 13 },
  goalIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  goalName: { fontSize: 15.5, fontWeight: "700", color: C.ink },
  goalMeta: { fontSize: 10.5, color: C.muted, marginTop: 3 },
  goalRank: { fontSize: 8, letterSpacing: 0.6, textTransform: "uppercase", color: C.o2, borderWidth: 1, borderColor: C.line2, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 8 },
  goalAmtRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  goalAmtLeft: { fontSize: 11, color: C.muted },
  goalAmtRight: { fontSize: 11, color: C.o2, fontWeight: "700" },
  goalTrack: { height: 7, backgroundColor: "#241a24", borderRadius: 99, overflow: "hidden" },
  goalFill: { height: "100%", borderRadius: 99 },
  goalFootRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  goalFootText: { fontSize: 10, color: C.muted },

  /* identity */
  identityBlock: {
    backgroundColor: "#1c1420",
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginTop: 4,
  },
  identityName: { fontSize: 21, fontWeight: "800", color: C.gold2, marginVertical: 8 },
  identityRow: { flexDirection: "row", gap: 14, marginTop: 15 },
  diLabel: { fontSize: 8.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#7a6c76", marginBottom: 4, fontWeight: "700" },
  diValue: { fontSize: 12, fontWeight: "600", color: C.ink, lineHeight: 17 },
});

// /* Styles for the swipe-to-start thumb/track, kept separate for readability. */
// const swipeStyles = StyleSheet.create({
//   track: {
//     height: THUMB_SIZE + TRACK_PAD * 2,
//     borderRadius: (THUMB_SIZE + TRACK_PAD * 2) / 2,
//     backgroundColor: "rgba(0,0,0,0.28)",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.18)",
//     padding: TRACK_PAD,
//     justifyContent: "center",
//     overflow: "hidden",
//   },
//   trackFill: {
//     position: "absolute",
//     left: 0,
//     top: 0,
//     bottom: 0,
//     backgroundColor: "rgba(255,255,255,0.14)",
//   },
//   trackLabel: {
//     textAlign: "center",
//     color: "rgba(255,255,255,0.92)",
//     fontSize: 14.5,
//     fontWeight: "700",
//     letterSpacing: 0.3,
//   },
//   thumb: {
//     position: "absolute",
//     left: TRACK_PAD,
//     top: TRACK_PAD,
//     width: THUMB_SIZE,
//     height: THUMB_SIZE,
//     borderRadius: THUMB_SIZE / 2,
//     backgroundColor: "#141018",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.35,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 5,
//   },
//   thumbDone: { backgroundColor: "#0f2a1c" },
//   thumbIcon: { color: "#fff", fontSize: 20, fontWeight: "800" },
//   celebrate: {
//     marginTop: 12,
//     textAlign: "center",
//     color: "#fff",
//     fontSize: 12.5,
//     fontWeight: "700",
//   },
// });