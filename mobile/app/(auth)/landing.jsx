// import React, { useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StatusBar,
//   StyleSheet,
//   Animated,
//   Dimensions,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import { isMobile } from '../../src/theme/globalStyles';

// const { width, height } = Dimensions.get('window');

// const LandingScreen = () => {
//   const router = useRouter();

//   // Animations
//   const logoAnim = useRef(new Animated.Value(0)).current;
//   const taglineAnim = useRef(new Animated.Value(0)).current;
//   const card1Anim = useRef(new Animated.Value(0)).current;
//   const card2Anim = useRef(new Animated.Value(0)).current;
//   const card3Anim = useRef(new Animated.Value(0)).current;
//   const btnAnim = useRef(new Animated.Value(0)).current;
//   const glowAnim = useRef(new Animated.Value(0.4)).current;

//   useEffect(() => {
//     // Staggered entrance
//     Animated.stagger(120, [
//       Animated.spring(logoAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
//       Animated.spring(taglineAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
//       Animated.spring(card1Anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
//       Animated.spring(card2Anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
//       Animated.spring(card3Anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
//       Animated.spring(btnAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
//     ]).start();

//     // Glow pulse loop
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
//         Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
//       ])
//     ).start();
//   }, []);

//   const makeSlide = (anim) => ({
//     opacity: anim,
//     transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
//   });

//   const features = [
//     { icon: '🎯', title: 'Personalized Plan', desc: 'Built around your goals & life' },
//     { icon: '📊', title: 'Smart Insights', desc: 'Data-driven wealth decisions' },
//     { icon: '🔒', title: 'Bank-Grade Safe', desc: 'Your data is always protected' },
//   ];

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor="#000000" />
//       <View style={styles.container}>

//         {/* Background glow blobs */}
//         <Animated.View style={[styles.blob1, { opacity: glowAnim }]} />
//         <Animated.View style={[styles.blob2, { opacity: glowAnim }]} />

//         <View style={styles.content}>

//           {/* Logo block */}
//           <Animated.View style={[styles.logoSection, makeSlide(logoAnim)]}>
//             <View style={styles.iconRing}>
//               <Text style={styles.iconEmoji}>💎</Text>
//             </View>
//             <Text style={styles.appName}>GoWealthy</Text>
//           </Animated.View>

//           {/* Tagline */}
//           <Animated.View style={makeSlide(taglineAnim)}>
//             <Text style={styles.headline}>Your money,{'\n'}working smarter.</Text>
//             <Text style={styles.subline}>
//               India's smartest financial planning tool — built for real goals, real lives.
//             </Text>
//           </Animated.View>

//           {/* Feature cards */}
//           <View style={styles.cardsRow}>
//             {features.map((f, i) => {
//               const anim = [card1Anim, card2Anim, card3Anim][i];
//               return (
//                 <Animated.View key={i} style={[styles.featureCard, makeSlide(anim)]}>
//                   <Text style={styles.featureIcon}>{f.icon}</Text>
//                   <Text style={styles.featureTitle}>{f.title}</Text>
//                   <Text style={styles.featureDesc}>{f.desc}</Text>
//                 </Animated.View>
//               );
//             })}
//           </View>

//           {/* CTA */}
//           <Animated.View style={[styles.btnSection, makeSlide(btnAnim)]}>
//             <TouchableOpacity
//               activeOpacity={0.88}
//               onPress={() => router.push('/(auth)/login')}
//             >
//               <LinearGradient
//                 colors={['#FF8500', '#FF5500']}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={styles.signInBtn}
//               >
//                 <Text style={styles.signInBtnText}>Sign In  →</Text>
//               </LinearGradient>
//             </TouchableOpacity>

//             <Text style={styles.disclaimer}>
//               By continuing, you agree to our{' '}
//               <Text style={styles.disclaimerLink}>Terms</Text>
//               {' '}&{' '}
//               <Text style={styles.disclaimerLink}>Privacy Policy</Text>
//             </Text>
//           </Animated.View>

//         </View>
//       </View>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000000',
//     overflow: 'hidden',
//   },
//   blob1: {
//     position: 'absolute',
//     width: 320,
//     height: 320,
//     borderRadius: 160,
//     backgroundColor: '#FF850022',
//     top: -60,
//     right: -80,
//   },
//   blob2: {
//     position: 'absolute',
//     width: 260,
//     height: 260,
//     borderRadius: 130,
//     backgroundColor: '#6366f122',
//     bottom: 80,
//     left: -60,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: isMobile ? 24 : 48,
//     paddingTop: isMobile ? 80 : 100,
//     paddingBottom: 40,
//     justifyContent: 'space-between',
//   },

//   // Logo
//   logoSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     marginBottom: 4,
//   },
//   iconRing: {
//     width: 48,
//     height: 48,
//     borderRadius: 14,
//     backgroundColor: 'rgba(255,133,0,0.15)',
//     borderWidth: 1,
//     borderColor: 'rgba(255,133,0,0.4)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   iconEmoji: { fontSize: 24 },
//   appName: {
//     fontSize: isMobile ? 28 : 34,
//     fontWeight: '800',
//     color: '#FF8500',
//     letterSpacing: -0.5,
//   },

//   // Headline
//   headline: {
//     fontSize: isMobile ? 38 : 48,
//     fontWeight: '800',
//     color: '#ffffff',
//     lineHeight: isMobile ? 46 : 58,
//     letterSpacing: -1,
//     marginBottom: 14,
//   },
//   subline: {
//     fontSize: isMobile ? 15 : 17,
//     color: 'rgba(255,255,255,0.45)',
//     lineHeight: 24,
//     maxWidth: 320,
//   },

//   // Feature cards
//   cardsRow: {
//     flexDirection: 'row',
//     gap: 10,
//     marginVertical: isMobile ? 24 : 32,
//   },
//   featureCard: {
//     flex: 1,
//     backgroundColor: '#111111',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.08)',
//     borderRadius: 16,
//     padding: 14,
//     alignItems: 'flex-start',
//   },
//   featureIcon: { fontSize: 22, marginBottom: 8 },
//   featureTitle: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#ffffff',
//     marginBottom: 4,
//   },
//   featureDesc: {
//     fontSize: 11,
//     color: 'rgba(255,255,255,0.4)',
//     lineHeight: 16,
//   },

//   // CTA
//   btnSection: { gap: 16 },
//   signInBtn: {
//     borderRadius: 16,
//     paddingVertical: isMobile ? 18 : 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   signInBtnText: {
//     fontSize: 17,
//     fontWeight: '800',
//     color: '#ffffff',
//     letterSpacing: 0.3,
//   },
//   disclaimer: {
//     textAlign: 'center',
//     fontSize: 12,
//     color: 'rgba(255,255,255,0.25)',
//   },
//   disclaimerLink: {
//     color: 'rgba(255,133,0,0.6)',
//   },
// });

// export default LandingScreen;
/**
 * ─────────────────────────────────────────────
 *  HOW TO ADD SYNE FONT (do this ONCE in your app):
 *
 *  1. Install: npx expo install expo-font @expo-google-fonts/syne
 *  2. In your root _layout.jsx add:
 *
 *     import { useFonts, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
 *     import { Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
 *
 *     const [fontsLoaded] = useFonts({ Syne_700Bold, Syne_800ExtraBold, Poppins_400Regular, Poppins_600SemiBold });
 *     if (!fontsLoaded) return null;
 *
 *  3. Use fontFamily: 'Syne_800ExtraBold' in styles below (already done).
 *
 *  FOR THE LOGO IMAGE — replace the <View style={s.logoMark}> block with:
 *     <Image source={require('../../assets/images/logo.png')} style={s.logoImg} resizeMode="contain" />
 *  (path depends on where your logo lives)
 * ─────────────────────────────────────────────
 */
/**
 * FONTS: Already loaded in your _layout.jsx ✅
 * Syne_700Bold, Syne_800ExtraBold, Poppins_400Regular are active.
 *
 * LOGO: Change the `LOGO_SOURCE` constant below to your actual logo path.
 * Your assets are at: assets/images/page_images/ based on other screens.
 * Example: require('../../assets/images/logo.png')
 * If your logo is elsewhere, adjust the path. The (auth) folder is 2 levels
 * deep from app root, so ../../assets/... is correct.
 *
 * LAYOUT of this file lives at: app/(auth)/landing.jsx
 */import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar,
  StyleSheet, Animated, Dimensions, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');

const C = {
  bg:          '#030712',
  card:        '#0d1117',
  cardBorder:  '#1a2332',
  orange:      '#FF8500',
  orangeFaint: 'rgba(255,133,0,0.09)',
  orangeMid:   'rgba(255,133,0,0.22)',
  orangeText:  'rgba(255,133,0,0.75)',
  purple:      '#6366f1',
  purpleFaint: 'rgba(99,102,241,0.07)',
  purpleMid:   'rgba(99,102,241,0.2)',
  white:       '#ffffff',
  gray400:     '#9ca3af',
  gray500:     '#6b7280',
  gray700:     '#374151',
};

// Breathing glow blob - pure opacity, no blur
const GlowBlob = ({ style, color, duration = 4500, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
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
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.18] }),
      }]}
    />
  );
};

// Auto-cycling feature ticker
const FEATURES = [
  { icon: '🛡️', text: 'Personalised Emergency Fund' },
  { icon: '🧠', text: 'Behavioural Risk Profiling' },
  { icon: '📈', text: 'Real Inflation-Linked Goals' },
  { icon: '🎯', text: 'Short-Term Wins First' },
  { icon: '🔒', text: 'Bank-Grade Security' },
];

const FeatureLine = () => {
  const [idx, setIdx] = useState(0);
  const fade   = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const iv = setInterval(() => {
      Animated.parallel([
        Animated.timing(fade,   { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: -8, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % FEATURES.length);
        slideY.setValue(8);
        Animated.parallel([
          Animated.timing(fade,   { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(slideY, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]).start();
      });
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  const f = FEATURES[idx];
  return (
    <View style={fl.wrap}>
      <Animated.View style={[fl.row, { opacity: fade, transform: [{ translateY: slideY }] }]}>
        <Text style={fl.icon}>{f.icon}</Text>
        <Text style={fl.text}>{f.text}</Text>
      </Animated.View>
      <View style={fl.dots}>
        {FEATURES.map((_, i) => (
          <View key={i} style={[fl.dot, i === idx && fl.dotOn]} />
        ))}
      </View>
    </View>
  );
};

const fl = StyleSheet.create({
  wrap: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
    alignItems: 'center', gap: 10,
  },
  row:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 20 },
  text: { fontSize: 15, fontWeight: '700', color: C.white, letterSpacing: -0.2 },
  dots: { flexDirection: 'row', gap: 5 },
  dot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: C.gray700 },
  dotOn:{ width: 20, backgroundColor: C.orange },
});

const CARDS = [
  { icon: '📊', title: 'Know Where\nYou Stand', sub: 'Full financial snapshot',    col: 'orange' },
  { icon: '🗺️', title: '5-Year\nGame Plan',     sub: 'Not a 30-year guess',        col: 'purple' },
  { icon: '🚀', title: 'Act With\nClarity',      sub: 'Curated, actionable steps',  col: 'orange' },
];

const LandingScreen = () => {
  const router = useRouter();
  const a = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(75,
      a.map(v => Animated.spring(v, { toValue: 1, tension: 58, friction: 9, useNativeDriver: true }))
    ).start();
  }, []);

  const enter = (v, dy = 20) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.root}>

        {/* Glow blobs */}
        <GlowBlob color={C.orange} duration={5000} delay={0}
          style={{ position: 'absolute', width: 340, height: 340, borderRadius: 170, top: -100, right: -100 }} />
        <GlowBlob color={C.purple} duration={4200} delay={700}
          style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, bottom: 40, left: -100 }} />
        <GlowBlob color={C.orange} duration={6500} delay={1500}
          style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, top: '42%', left: -60 }} />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <Animated.View style={[s.logoRow, enter(a[0])]}>
            {/*
              LOGO: change path to match your file.
              File is at app/(auth)/landing.jsx so path is ../../assets/...
              e.g. require('../../assets/images/logo.png')
            */}
            <Image
              source={require('../../assets/images/logo.png')}
              style={s.logoImg}
              resizeMode="contain"
            />
            <Text style={s.logoName}>GoWealthy</Text>
          </Animated.View>

          {/* Headline */}
          <Animated.View style={[s.heroBlock, enter(a[1])]}>
            <View style={s.eyebrow}>
              <View style={s.eyebrowDot} />
              <Text style={s.eyebrowText}>DIY Financial Planner</Text>
            </View>
            <Text style={s.h1}>
              {'Plan Your\nFinancial Future\n'}
              <Text style={s.h1Accent}>in Minutes.</Text>
            </Text>
            <Text style={s.subline}>
              Stop guessing. Start building real wealth — backed by behavioral science, built for your life.
            </Text>
          </Animated.View>

          {/* CTA */}
          <Animated.View style={[s.ctaBlock, enter(a[2])]}>
            <TouchableOpacity activeOpacity={0.86} onPress={() => router.push('/(auth)/login')}>
              <LinearGradient
                colors={['#FF8500', '#d96800']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.ctaBtn}
              >
                <Text style={s.ctaBtnText}>Start Your Free Plan  →</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={s.ctaMeta}>Ready in 10 minutes · No credit card</Text>
          </Animated.View>

          {/* Feature ticker */}
          <Animated.View style={enter(a[3])}>
            <FeatureLine />
          </Animated.View>

          {/* 3 cards */}
          <Animated.View style={[s.cardsRow, enter(a[4])]}>
            {CARDS.map((card, i) => (
              <View key={i} style={[s.card, card.col === 'orange' ? s.cardO : s.cardP]}>
                <Text style={s.cardIcon}>{card.icon}</Text>
                <Text style={s.cardTitle}>{card.title}</Text>
                <Text style={s.cardSub}>{card.sub}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Trust + disclaimer */}
          <Animated.View style={[s.bottom, enter(a[5])]}>
            <View style={s.trustRow}>
              {['✓  Bank-Grade Safe', '✓  Part of GoChanakya', '✓  Free to start'].map((t, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={s.trustDiv} />}
                  <Text style={s.trustText}>{t}</Text>
                </React.Fragment>
              ))}
            </View>
            <Text style={s.disclaimer}>
              {'By continuing you agree to our '}
              <Text style={s.disclaimerLink}>Terms</Text>
              {' & '}
              <Text style={s.disclaimerLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>

        </ScrollView>
      </View>
    </>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 64, paddingBottom: 44, gap: 28 },

  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg:  { width: 36, height: 36, borderRadius: 8 },
  logoName: { fontSize: 22, fontWeight: '800', color: C.orange, letterSpacing: -0.4 },

  heroBlock:   { gap: 12 },
  eyebrow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: C.orange },
  eyebrowText: { fontSize: 11, color: C.orange, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  h1:          { fontSize: 36, fontWeight: '800', color: C.white, lineHeight: 44, letterSpacing: -0.8 },
  h1Accent:    { color: C.orange },
  subline:     { fontSize: 14, color: C.gray400, lineHeight: 22 },

  ctaBlock: { gap: 10 },
  ctaBtn: {
    borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.orange, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: C.white, letterSpacing: 0.1 },
  ctaMeta:    { textAlign: 'center', fontSize: 12, color: C.gray500 },

  cardsRow: { flexDirection: 'row', gap: 10 },
  card:  { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 6 },
  cardO: { backgroundColor: C.orangeFaint, borderColor: C.orangeMid },
  cardP: { backgroundColor: C.purpleFaint, borderColor: C.purpleMid },
  cardIcon:  { fontSize: 22 },
  cardTitle: { fontSize: 12, fontWeight: '800', color: C.white, lineHeight: 17 },
  cardSub:   { fontSize: 10, color: C.gray500, lineHeight: 14 },

  bottom:   { gap: 14 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  trustDiv: { width: 1, height: 12, backgroundColor: C.gray700 },
  trustText:{ fontSize: 11, color: C.gray500, fontWeight: '500' },
  disclaimer:     { textAlign: 'center', fontSize: 11, color: C.gray700, lineHeight: 16 },
  disclaimerLink: { color: C.orangeText },
});

export default LandingScreen;