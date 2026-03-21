import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { colors, globalStyles, shadows, isMobile } from '../../src/theme/globalStyles';
import GowiserBlogList from './gowiser/index';
import ProfileScreen from './profile';
import GoSharesShell from './goshares/index';

const { width: W, height: H } = Dimensions.get('window');
const ND = Platform.OS !== 'web';

// ─────────────────────────────────────────────────────────────────────────────
//  Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: '#000000',
  card: '#0d1117',
  cardBorder: '#1a2332',
  orange: '#FF8500',
  purple: '#6C50C4',
  white: '#ffffff',
  gray500: '#6b7280',
  gray700: '#374151',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Ambient glow blob
// ─────────────────────────────────────────────────────────────────────────────
const GlowBlob = ({ style, color, duration = 4500, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: ND }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: ND }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={[style, {
        backgroundColor: color,
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.20] }),
      }]}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Slim Road Map strip  (static placeholders — swap from Firestore later)
// ─────────────────────────────────────────────────────────────────────────────
const ROADMAP = {
  current: '₹24.5L',
  progress: 0.18,
  milestones: [
    { label: '5Y', value: '₹35L', pct: 0.25 },
    { label: '10Y', value: '₹55L', pct: 0.55 },
    { label: '15Y', value: '₹85L', pct: 0.85 },
  ],
};

const RoadMapStrip = ({ enterAnim }) => {
  const dotAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.spring(dotAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: ND }).start();
    }, 500);
  }, []);

  return (
    <Animated.View style={[rm.wrap, {
      opacity: enterAnim,
      transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }]}>
      {/* Label row */}
      <View style={rm.labelRow}>
        <View style={rm.titleRow}>
          <View style={rm.dot} />
          <Text style={rm.title}>Wealth Road Map</Text>
        </View>
        <Text style={rm.current}>{ROADMAP.current}</Text>
      </View>

      {/* Bar */}
      <View style={rm.track}>
        <View style={[rm.fill, { width: `${ROADMAP.progress * 100}%` }]}>
          <LinearGradient
            colors={['#6C50C4', '#FF8500']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Glowing tip */}
          <View style={rm.fillTip} />
        </View>
        {ROADMAP.milestones.map((m, i) => (
          <View key={i} style={[rm.tick, { left: `${m.pct * 100}%` }]} />
        ))}
      </View>

      {/* Milestone labels */}
      <View style={rm.milestonesRow}>
        {ROADMAP.milestones.map((m, i) => (
          <View key={i} style={[rm.milestone, { left: `${m.pct * 100}%` }]}>
            <Text style={rm.mLabel}>{m.label}</Text>
            <Text style={rm.mValue}>{m.value}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const rm = StyleSheet.create({
  wrap: { marginBottom: 28, paddingHorizontal: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.orange },
  title: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.42)', letterSpacing: 0.5 },
  current: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.78)' },
  track: {
    height: 5, width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10, overflow: 'visible', position: 'relative',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 10, overflow: 'hidden' },
  fillTip: {
    position: 'absolute', right: -1, top: -2,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: '#FF8500',
    shadowColor: '#FF8500', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 6, elevation: 4,
  },
  tick: {
    position: 'absolute', top: -3, marginLeft: -1,
    width: 1.5, height: 11, borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  milestonesRow: { position: 'relative', height: 32, marginTop: 8 },
  milestone: { position: 'absolute', transform: [{ translateX: -18 }], alignItems: 'center' },
  mLabel: { fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: '600', letterSpacing: 0.3 },
  mValue: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginTop: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Journey cards
// ─────────────────────────────────────────────────────────────────────────────
const JOURNEYS = [
  {
    num: 1, accent: 'orange',
    title: 'Combine Holdings',
    sub: 'Brokers · Family · Banks',
    image: require('../../assets/images/home_page/CombineHoldings.webp'),   // swap: require('../../assets/images/journey/combine.png')
    route: '/(gowealthy)/mf/onboarding/screen1',   // swap: '/(gowealthy)/combine'
  },
  {
    num: 2, accent: 'purple',
    title: 'Financial Plan',
    sub: 'Pro Users · Comprehensive',
    image: require('../../assets/images/home_page/comprehensive-fp.webp'),
    route: '/(gowealthy)/questionnaire/section1/screen1',
  },
  {
    num: 3, accent: 'orange',
    title: 'Emergency Fund',
    sub: 'Build your safety net',
    image: require('../../assets/images/home_page/Emergencyfund.webp'),
    route: null,
  },
  {
    num: 4, accent: 'orange',
    title: 'Set Goals',
    sub: 'Define · Track · Achieve',
    image: require('../../assets/images/home_page/Goals-setting-image.webp'),
    route: null,
  },
  {
    num: 5, accent: 'purple',
    title: 'Insurance Cover',
    sub: 'Find your ideal amount',
    image: require('../../assets/images/home_page/Insure-requirement.webp'),
    route: null,
  },
];

const JourneyCard = ({ item, enterAnim, onPress }) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const isOrange = item.accent === 'orange';

  const onPressIn = () => Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  return (
    <Animated.View style={{
      opacity: enterAnim,
      transform: [
        { translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
        { scale: pressAnim },
      ],
      marginBottom: 12,
    }}>
      <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>

        {/* Outer glow ring */}
        <View style={[jc.glowBorder, isOrange ? jc.glowOrange : jc.glowPurple]} />

        <View style={[jc.card, isOrange ? jc.cardOrange : jc.cardPurple]}>

          {/* Full-card left-fade sweep */}
          <LinearGradient
            colors={isOrange
              ? ['rgba(255,133,0,0.12)', 'rgba(255,133,0,0.03)', 'transparent']
              : ['rgba(108,80,196,0.14)', 'rgba(108,80,196,0.03)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Left content */}
          <View style={jc.left}>
            {/* Number badge */}
            <View style={[jc.numBadge, isOrange ? jc.numBadgeOrange : jc.numBadgePurple]}>
              <Text style={[jc.numText, isOrange ? jc.numTextOrange : jc.numTextPurple]}>
                {item.num}
              </Text>
            </View>

            <View style={jc.textBlock}>
              <Text style={jc.title}>{item.title}</Text>
              <Text style={jc.sub}>{item.sub}</Text>
            </View>

            {/* Arrow */}
            <View style={[jc.arrow, isOrange ? jc.arrowOrange : jc.arrowPurple]}>
              <Text style={[jc.arrowText, isOrange ? jc.arrowTextOrange : jc.arrowTextPurple]}>→</Text>
            </View>
          </View>

          {/* Right — image slot */}
          <View style={[jc.imgWrap, isOrange ? jc.imgWrapOrange : jc.imgWrapPurple]}>
            {item.image ? (
              <Image source={item.image} style={jc.img} resizeMode="cover" />
            ) : (
              <>
                <LinearGradient
                  // colors={isOrange
                  //   ? ['rgba(255,133,0,0.22)', 'rgba(255,80,0,0.05)']
                  //   : ['rgba(108,80,196,0.26)', 'rgba(80,40,160,0.05)']}
                  colors={isOrange
                    ? ['rgba(255,133,0,0.05)', 'transparent', 'transparent']
                    : ['rgba(108,80,196,0.06)', 'transparent', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[jc.ring1, isOrange
                  ? { borderColor: 'rgba(255,133,0,0.28)' }
                  : { borderColor: 'rgba(108,80,196,0.30)' }]}
                />
                <View style={[jc.ring2, isOrange
                  ? { borderColor: 'rgba(255,133,0,0.15)' }
                  : { borderColor: 'rgba(108,80,196,0.18)' }]}
                />
                <Text style={jc.imgLabel}>IMG</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const jc = StyleSheet.create({
  glowBorder: {
    position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
    borderRadius: 20, borderWidth: 1, zIndex: 0,
  },
  // glowOrange: {
  //   borderColor: 'rgba(255,133,0,0.50)',
  //   shadowColor: '#FF8500', shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
  // },
  // glowPurple: {
  //   borderColor: 'rgba(108,80,196,0.54)',
  //   shadowColor: '#6C50C4', shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.55, shadowRadius: 10, elevation: 6,
  // },
  glowOrange: { borderColor: 'rgba(255,133,0,0.22)', shadowColor: '#FF8500', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.20, shadowRadius: 8, elevation: 3 },
  glowPurple: { borderColor: 'rgba(108,80,196,0.24)', shadowColor: '#6C50C4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.20, shadowRadius: 8, elevation: 3 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, borderWidth: 1,
    paddingVertical: 14, paddingLeft: 16, paddingRight: 14,
    overflow: 'hidden', position: 'relative', minHeight: 90,
  },
  // cardOrange: { backgroundColor: 'rgba(255,133,0,0.07)', borderColor: 'rgba(255,133,0,0.32)' },
  // cardPurple: { backgroundColor: 'rgba(108,80,196,0.09)', borderColor: 'rgba(108,80,196,0.36)' },
  cardOrange: { backgroundColor: '#0d1117', borderColor: 'rgba(255,133,0,0.18)' },
  cardPurple: { backgroundColor: '#0d1117', borderColor: 'rgba(108,80,196,0.20)' },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 10 },

  numBadge: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  numBadgeOrange: { backgroundColor: 'rgba(255,133,0,0.15)', borderColor: 'rgba(255,133,0,0.38)' },
  numBadgePurple: { backgroundColor: 'rgba(108,80,196,0.18)', borderColor: 'rgba(108,80,196,0.40)' },
  numText: { fontSize: 14, fontWeight: '800', fontFamily: 'Syne' },
  numTextOrange: { color: '#FF8500' },
  numTextPurple: { color: '#9B84F0' },

  textBlock: { flex: 1, gap: 3 },
  title: {
    fontSize: 15, fontWeight: '800', color: '#ffffff',
    letterSpacing: -0.3, lineHeight: 19, fontFamily: 'Syne',
  },
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.40)', lineHeight: 15, fontWeight: '500' },

  arrow: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  arrowOrange: { backgroundColor: 'rgba(255,133,0,0.12)', borderColor: 'rgba(255,133,0,0.28)' },
  arrowPurple: { backgroundColor: 'rgba(108,80,196,0.14)', borderColor: 'rgba(108,80,196,0.30)' },
  arrowText: { fontSize: 13, fontWeight: '700' },
  arrowTextOrange: { color: '#FF8500' },
  arrowTextPurple: { color: '#9B84F0' },

  imgWrap: {
    width: 76, height: 76, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative', flexShrink: 0,
  },
  imgWrapOrange: { borderColor: 'rgba(255,133,0,0.30)' },
  imgWrapPurple: { borderColor: 'rgba(108,80,196,0.32)' },
  img: { width: '100%', height: '100%' },
  ring1: {
    position: 'absolute', width: 54, height: 54,
    borderRadius: 27, borderWidth: 1,
  },
  ring2: {
    position: 'absolute', width: 34, height: 34,
    borderRadius: 17, borderWidth: 1,
  },
  imgLabel: { fontSize: 9, color: 'rgba(255,255,255,0.18)', fontWeight: '700', letterSpacing: 1.5 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Main screen
// ─────────────────────────────────────────────────────────────────────────────
const GoWealthyHome = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [articles, setArticles] = useState([]);

  const anims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (activeTab === 'home') {
      anims.forEach(a => a.setValue(0));
      Animated.stagger(70,
        anims.map(v => Animated.spring(v, { toValue: 1, tension: 58, friction: 9, useNativeDriver: ND }))
      ).start();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'learn' && articles.length === 0) fetchArticles();
  }, [activeTab]);

  const fetchArticles = async () => {
    try {
      const q = query(collection(db, 'products', 'gowiser', 'articles'), where('published', '==', true));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.publishedAt?.toDate?.() || 0) - (a.publishedAt?.toDate?.() || 0));
      setArticles(list);
    } catch (e) { console.error('Error fetching articles:', e); }
  };

  const enter = (v, dy = 18) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
  });

  // ── renderHome ─────────────────────────────────────────────────────────────
  const renderHome = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#0a0408', '#060308', '#000000', '#04030a']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <GlowBlob color="#FF8500" duration={5200} delay={0}
        style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, right: -80 }} />
      <GlowBlob color="#6C50C4" duration={4400} delay={800}
        style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, bottom: 100, left: -70 }} />

      <ScrollView contentContainerStyle={hs.scroll} showsVerticalScrollIndicator={false}>

        {/* GoWealthy title */}
        <Animated.View style={[hs.header, enter(anims[0])]}>
          <Text style={hs.headerTitle}>
            <Text style={hs.headerGo}>Go</Text>
            <Text style={hs.headerWealthy}>Wealthy</Text>
          </Text>
        </Animated.View>

        {/* Slim Road Map */}
        <RoadMapStrip enterAnim={anims[1]} />

        {/* Section label */}
        <Animated.View style={[hs.sectionRow, enter(anims[2])]}>
          <Text style={hs.sectionLabel}>Your Journey</Text>
          <View style={hs.sectionLine} />
        </Animated.View>

        {/* Journey cards */}
        {JOURNEYS.map((item, idx) => (
          <JourneyCard
            key={item.num}
            item={item}
            enterAnim={anims[Math.min(idx + 3, 7)]}
            onPress={() => { if (item.route) router.push(item.route); }}
          />
        ))}

        {/* Dev buttons */}
        <View style={hs.devSection}>
          <TouchableOpacity
            style={hs.devBtn}
            onPress={() => router.push('/(gowealthy)/dashboard/home')}
            activeOpacity={0.75}
          >
            <Text style={hs.devBtnText}>🧪 Dashboard Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[hs.devBtn, hs.devBtnDanger]}
            onPress={async () => {
              await AsyncStorage.multiRemove(['auth_token', 'user_phone', 'auth_timestamp']);
              router.replace('/(auth)/landing');
            }}
            activeOpacity={0.75}
          >
            <Text style={hs.devBtnText}>🔐 Clear Auth & Test Login</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );

  const renderLearn = () => <GowiserBlogList hideHeader={true} />;

  const renderProfile = () => (
    <View style={styles.emptyTabContainer}>
      <Text style={styles.emptyTabEmoji}>👤</Text>
      <Text style={styles.emptyTabText}>Profile coming soon</Text>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      <View style={globalStyles.backgroundContainer}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'learn' && renderLearn()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'goshares' && <GoSharesShell />}

        <View style={styles.bottomTabBar}>
          {[
            { key: 'home', icon: '🗺️', label: 'Wealth Journey' },
            { key: 'learn', icon: '💡', label: 'Learn' },
            { key: 'goshares', icon: '📈', label: 'GoShares' },
            { key: 'profile', icon: '👤', label: 'Profile' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabActiveDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Shared styles — tab bar + profile empty state (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const ORANGE = '#FF6300';
const styles = StyleSheet.create({
  emptyTabContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTabEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTabText: { fontSize: 16, color: colors.subtitleColor },
  bottomTabBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 72,
    backgroundColor: colors.cardBackground,
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  tabIcon: { fontSize: 22, marginBottom: 4 },
  tabLabel: { fontSize: 11, color: colors.subtitleColor, fontWeight: '500' },
  tabLabelActive: { color: ORANGE, fontWeight: '700' },
  tabActiveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: ORANGE, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Home-specific styles
// ─────────────────────────────────────────────────────────────────────────────
const hs = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 42,
    paddingBottom: 100,
  },
  header: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 30, letterSpacing: -0.8, fontFamily: 'Syne' },
  headerGo: { color: 'rgba(255,255,255,255)', fontWeight: '300' },
  headerWealthy: { color: '#FF8500', fontWeight: '800' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.22)', letterSpacing: 1.6, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  devSection: { gap: 10, marginTop: 24 },
  devBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  devBtnDanger: {
    backgroundColor: 'rgba(239,68,68,0.07)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  devBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.42)', fontWeight: '600' },
});

export default GoWealthyHome;