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
 */

// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View, Text, TouchableOpacity, StatusBar,
//   StyleSheet, Animated, Dimensions, ScrollView, Image,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';

// const { width: W } = Dimensions.get('window');

// const C = {
//   bg:          '#030712',
//   card:        '#0d1117',
//   cardBorder:  '#1a2332',
//   orange:      '#FF8500',
//   orangeFaint: 'rgba(255,133,0,0.09)',
//   orangeMid:   'rgba(255,133,0,0.22)',
//   orangeText:  'rgba(255,133,0,0.75)',
//   purple:      '#6366f1',
//   purpleFaint: 'rgba(99,102,241,0.07)',
//   purpleMid:   'rgba(99,102,241,0.2)',
//   white:       '#ffffff',
//   gray400:     '#9ca3af',
//   gray500:     '#6b7280',
//   gray700:     '#374151',
// };

// // Breathing glow blob - pure opacity, no blur
// const GlowBlob = ({ style, color, duration = 4500, delay = 0 }) => {
//   const anim = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     const t = setTimeout(() => {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
//           Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
//         ])
//       ).start();
//     }, delay);
//     return () => clearTimeout(t);
//   }, []);
//   return (
//     <Animated.View
//       pointerEvents="none"
//       style={[style, {
//         backgroundColor: color,
//         opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.18] }),
//       }]}
//     />
//   );
// };

// // Auto-cycling feature ticker
// const FEATURES = [
//   { icon: '🛡️', text: 'Personalised Emergency Fund' },
//   { icon: '🧠', text: 'Behavioural Risk Profiling' },
//   { icon: '📈', text: 'Real Inflation-Linked Goals' },
//   { icon: '🎯', text: 'Short-Term Wins First' },
//   { icon: '🔒', text: 'Bank-Grade Security' },
// ];

// const FeatureLine = () => {
//   const [idx, setIdx] = useState(0);
//   const fade   = useRef(new Animated.Value(1)).current;
//   const slideY = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const iv = setInterval(() => {
//       Animated.parallel([
//         Animated.timing(fade,   { toValue: 0, duration: 180, useNativeDriver: true }),
//         Animated.timing(slideY, { toValue: -8, duration: 180, useNativeDriver: true }),
//       ]).start(() => {
//         setIdx(i => (i + 1) % FEATURES.length);
//         slideY.setValue(8);
//         Animated.parallel([
//           Animated.timing(fade,   { toValue: 1, duration: 260, useNativeDriver: true }),
//           Animated.timing(slideY, { toValue: 0, duration: 260, useNativeDriver: true }),
//         ]).start();
//       });
//     }, 2200);
//     return () => clearInterval(iv);
//   }, []);

//   const f = FEATURES[idx];
//   return (
//     <View style={fl.wrap}>
//       <Animated.View style={[fl.row, { opacity: fade, transform: [{ translateY: slideY }] }]}>
//         <Text style={fl.icon}>{f.icon}</Text>
//         <Text style={fl.text}>{f.text}</Text>
//       </Animated.View>
//       <View style={fl.dots}>
//         {FEATURES.map((_, i) => (
//           <View key={i} style={[fl.dot, i === idx && fl.dotOn]} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const fl = StyleSheet.create({
//   wrap: {
//     backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
//     borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
//     alignItems: 'center', gap: 10,
//   },
//   row:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   icon: { fontSize: 20 },
//   text: { fontSize: 15, fontWeight: '700', color: C.white, letterSpacing: -0.2 },
//   dots: { flexDirection: 'row', gap: 5 },
//   dot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: C.gray700 },
//   dotOn:{ width: 20, backgroundColor: C.orange },
// });

// const CARDS = [
//   { icon: '📊', title: 'Know Where\nYou Stand', sub: 'Full financial snapshot',    col: 'orange' },
//   { icon: '🗺️', title: '5-Year\nGame Plan',     sub: 'Not a 30-year guess',        col: 'purple' },
//   { icon: '🚀', title: 'Act With\nClarity',      sub: 'Curated, actionable steps',  col: 'orange' },
// ];

// const LandingScreen = () => {
//   const router = useRouter();
//   const a = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

//   useEffect(() => {
//     Animated.stagger(75,
//       a.map(v => Animated.spring(v, { toValue: 1, tension: 58, friction: 9, useNativeDriver: true }))
//     ).start();
//   }, []);

//   const enter = (v, dy = 20) => ({
//     opacity: v,
//     transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
//   });

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor={C.bg} />
//       <View style={s.root}>

//         {/* Glow blobs */}
//         <GlowBlob color={C.orange} duration={5000} delay={0}
//           style={{ position: 'absolute', width: 340, height: 340, borderRadius: 170, top: -100, right: -100 }} />
//         <GlowBlob color={C.purple} duration={4200} delay={700}
//           style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, bottom: 40, left: -100 }} />
//         <GlowBlob color={C.orange} duration={6500} delay={1500}
//           style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, top: '42%', left: -60 }} />

//         <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

//           {/* Logo */}
//           <Animated.View style={[s.logoRow, enter(a[0])]}>
//             {/*
//               LOGO: change path to match your file.
//               File is at app/(auth)/landing.jsx so path is ../../assets/...
//               e.g. require('../../assets/images/logo.png')
//             */}
//             <Image
//               source={require('../../assets/images/logo.png')}
//               style={s.logoImg}
//               resizeMode="contain"
//             />
//             <Text style={s.logoName}>GoWealthy</Text>
//           </Animated.View>

//           {/* Headline */}
//           <Animated.View style={[s.heroBlock, enter(a[1])]}>
//             <View style={s.eyebrow}>
//               <View style={s.eyebrowDot} />
//               <Text style={s.eyebrowText}>DIY Financial Planner</Text>
//             </View>
//             <Text style={s.h1}>
//               {'Plan Your\nFinancial Future\n'}
//               <Text style={s.h1Accent}>in Minutes.</Text>
//             </Text>
//             <Text style={s.subline}>
//               Stop guessing. Start building real wealth — backed by behavioral science, built for your life.
//             </Text>
//           </Animated.View>

//           {/* CTA */}
//           <Animated.View style={[s.ctaBlock, enter(a[2])]}>
//             <TouchableOpacity activeOpacity={0.86} onPress={() => router.push('/(auth)/login')}>
//               <LinearGradient
//                 colors={['#FF8500', '#d96800']}
//                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//                 style={s.ctaBtn}
//               >
//                 <Text style={s.ctaBtnText}>Start Your Free Plan  →</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//             <Text style={s.ctaMeta}>Ready in 10 minutes · No credit card</Text>
//           </Animated.View>

//           {/* Feature ticker */}
//           <Animated.View style={enter(a[3])}>
//             <FeatureLine />
//           </Animated.View>

//           {/* 3 cards */}
//           <Animated.View style={[s.cardsRow, enter(a[4])]}>
//             {CARDS.map((card, i) => (
//               <View key={i} style={[s.card, card.col === 'orange' ? s.cardO : s.cardP]}>
//                 <Text style={s.cardIcon}>{card.icon}</Text>
//                 <Text style={s.cardTitle}>{card.title}</Text>
//                 <Text style={s.cardSub}>{card.sub}</Text>
//               </View>
//             ))}
//           </Animated.View>

//           {/* Trust + disclaimer */}
//           <Animated.View style={[s.bottom, enter(a[5])]}>
//             <View style={s.trustRow}>
//               {['✓  Bank-Grade Safe', '✓  Part of GoChanakya', '✓  Free to start'].map((t, i) => (
//                 <React.Fragment key={i}>
//                   {i > 0 && <View style={s.trustDiv} />}
//                   <Text style={s.trustText}>{t}</Text>
//                 </React.Fragment>
//               ))}
//             </View>
//             <Text style={s.disclaimer}>
//               {'By continuing you agree to our '}
//               <Text style={s.disclaimerLink}>Terms</Text>
//               {' & '}
//               <Text style={s.disclaimerLink}>Privacy Policy</Text>
//             </Text>
//           </Animated.View>

//         </ScrollView>
//       </View>
//     </>
//   );
// };

// const s = StyleSheet.create({
//   root: { flex: 1, backgroundColor: C.bg },
//   scroll: { paddingHorizontal: 22, paddingTop: 64, paddingBottom: 44, gap: 28 },

//   logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   logoImg:  { width: 36, height: 36, borderRadius: 8 },
//   logoName: { fontSize: 22, fontWeight: '800', color: C.orange, letterSpacing: -0.4 },

//   heroBlock:   { gap: 12 },
//   eyebrow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   eyebrowDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: C.orange },
//   eyebrowText: { fontSize: 11, color: C.orange, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
//   h1:          { fontSize: 36, fontWeight: '800', color: C.white, lineHeight: 44, letterSpacing: -0.8 },
//   h1Accent:    { color: C.orange },
//   subline:     { fontSize: 14, color: C.gray400, lineHeight: 22 },

//   ctaBlock: { gap: 10 },
//   ctaBtn: {
//     borderRadius: 14, paddingVertical: 17,
//     alignItems: 'center', justifyContent: 'center',
//     shadowColor: C.orange, shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
//   },
//   ctaBtnText: { fontSize: 16, fontWeight: '800', color: C.white, letterSpacing: 0.1 },
//   ctaMeta:    { textAlign: 'center', fontSize: 12, color: C.gray500 },

//   cardsRow: { flexDirection: 'row', gap: 10 },
//   card:  { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 6 },
//   cardO: { backgroundColor: C.orangeFaint, borderColor: C.orangeMid },
//   cardP: { backgroundColor: C.purpleFaint, borderColor: C.purpleMid },
//   cardIcon:  { fontSize: 22 },
//   cardTitle: { fontSize: 12, fontWeight: '800', color: C.white, lineHeight: 17 },
//   cardSub:   { fontSize: 10, color: C.gray500, lineHeight: 14 },

//   bottom:   { gap: 14 },
//   trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
//   trustDiv: { width: 1, height: 12, backgroundColor: C.gray700 },
//   trustText:{ fontSize: 11, color: C.gray500, fontWeight: '500' },
//   disclaimer:     { textAlign: 'center', fontSize: 11, color: C.gray700, lineHeight: 16 },
//   disclaimerLink: { color: C.orangeText },
// });

// export default LandingScreen;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const ND = Platform.OS !== 'web';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// ── Floating particle dot ─────────────────────────────────────────────────────
const Particle = ({ x, y, size, delay, color, duration }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: duration * 0.4,
              easing: Easing.out(Easing.quad),
              useNativeDriver: ND,
            }),
            Animated.timing(translateY, {
              toValue: -12,
              duration: duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: ND,
            }),
          ]),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.1,
              duration: duration * 0.4,
              easing: Easing.in(Easing.quad),
              useNativeDriver: ND,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: ND,
            }),
          ]),
        ])
      ).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
};

// ── Rotating ring ─────────────────────────────────────────────────────────────
const RotatingRing = ({ size, borderColor, duration, delay, clockwise = true }) => {
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: ND,
      }).start();

      Animated.loop(
        Animated.timing(rotate, {
          toValue: clockwise ? 1 : -1,
          duration,
          easing: Easing.linear,
          useNativeDriver: ND,
        })
      ).start();
    }, delay);
  }, []);

  const spin = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor,
        borderStyle: 'dashed',
        opacity,
        transform: [{ rotate: spin }],
      }}
    />
  );
};

// ── Pulse ring (static, scale pulse) ─────────────────────────────────────────
const PulseRing = ({ size, color, delay }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: ND }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.06,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: ND,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: ND,
          }),
        ])
      ).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
};

// ── Main splash ───────────────────────────────────────────────────────────────
export default function SplashScreen() {
  const router   = useRouter();
  const authDest = useRef(null);

  // Core animations
  const bgOpacity    = useRef(new Animated.Value(0)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.6)).current;
  const logoBorder   = useRef(new Animated.Value(0)).current; // animated border glow
  const shimmerX     = useRef(new Animated.Value(-120)).current;

  const nameOpacity  = useRef(new Animated.Value(0)).current;
  const nameScale    = useRef(new Animated.Value(0.88)).current;

  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const tagY         = useRef(new Animated.Value(8)).current;

  const dotRow       = useRef(new Animated.Value(0)).current;

  const lineProgress = useRef(new Animated.Value(0)).current;
  const lineOpacity  = useRef(new Animated.Value(0)).current;

  const veil         = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkAuth();
    runAnimation();
  }, []);

  const checkAuth = async () => {
    try {
      const results = await AsyncStorage.multiGet([
        'auth_token', 'user_phone', 'auth_timestamp',
      ]);
      const token   = results[0][1];
      const phone   = results[1][1];
      const ts      = parseInt(results[2][1] || '0', 10);
      const valid   = token === 'verified' && !!phone;
      const expired = TOKEN_TTL_MS > 0 && Date.now() - ts > TOKEN_TTL_MS;
      if (valid && !expired) {
        authDest.current = '/(gowealthy)';
      } else {
        await AsyncStorage.multiRemove(['auth_token', 'user_phone', 'auth_timestamp']);
        authDest.current = '/(auth)/landing';
      }
    } catch {
      authDest.current = '/(auth)/landing';
    }
  };

  const runAnimation = () => {
    // 0ms — background fades in
    Animated.timing(bgOpacity, {
      toValue: 1, duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: ND,
    }).start();

    // 250ms — logo springs in
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: ND,
        }),
        Animated.spring(logoScale, {
          toValue: 1, tension: 65, friction: 7,
          useNativeDriver: ND,
        }),
      ]).start();
    }, 250);

    // 500ms — shimmer sweep
    setTimeout(() => {
      Animated.timing(shimmerX, {
        toValue: 140, duration: 650,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: ND,
      }).start();
    }, 550);

    // 750ms — name
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1, duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: ND,
        }),
        Animated.spring(nameScale, {
          toValue: 1, tension: 60, friction: 8,
          useNativeDriver: ND,
        }),
      ]).start();
    }, 750);

    // 1000ms — tagline
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(tagOpacity, {
          toValue: 1, duration: 400,
          useNativeDriver: ND,
        }),
        Animated.spring(tagY, {
          toValue: 0, tension: 55, friction: 9,
          useNativeDriver: ND,
        }),
      ]).start();
    }, 1000);

    // 1200ms — dot indicators
    setTimeout(() => {
      Animated.timing(dotRow, {
        toValue: 1, duration: 400,
        useNativeDriver: ND,
      }).start();
    }, 1200);

    // 1350ms — progress line
    setTimeout(() => {
      Animated.timing(lineOpacity, {
        toValue: 1, duration: 200,
        useNativeDriver: false,
      }).start();
      Animated.timing(lineProgress, {
        toValue: 1, duration: 1100,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    }, 1350);

    // 2600ms — exit fade to black
    setTimeout(() => {
      Animated.timing(veil, {
        toValue: 1, duration: 400,
        easing: Easing.in(Easing.quad),
        useNativeDriver: ND,
      }).start(() => {
        router.replace('/(auth)/login');
      });
    }, 2600);
  };

  const progressW = lineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '68%'],
  });

  // Particles config
  const particles = [
    { x: width * 0.08,  y: height * 0.18, size: 3,   delay: 400,  color: '#FF8500', duration: 3200 },
    { x: width * 0.82,  y: height * 0.14, size: 4,   delay: 700,  color: '#FF8500', duration: 2800 },
    { x: width * 0.15,  y: height * 0.72, size: 3,   delay: 300,  color: '#6C50C4', duration: 3600 },
    { x: width * 0.88,  y: height * 0.68, size: 5,   delay: 900,  color: '#6C50C4', duration: 2600 },
    { x: width * 0.05,  y: height * 0.44, size: 2.5, delay: 550,  color: '#FF8500', duration: 4000 },
    { x: width * 0.92,  y: height * 0.40, size: 3,   delay: 1100, color: '#FF8500', duration: 3400 },
    { x: width * 0.72,  y: height * 0.82, size: 3.5, delay: 200,  color: '#6C50C4', duration: 3000 },
    { x: width * 0.25,  y: height * 0.85, size: 2.5, delay: 800,  color: '#FF8500', duration: 3800 },
    { x: width * 0.50,  y: height * 0.08, size: 4,   delay: 600,  color: '#6C50C4', duration: 2900 },
    { x: width * 0.60,  y: height * 0.90, size: 2,   delay: 1300, color: '#FF8500', duration: 4200 },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      <View style={styles.root}>

        {/* ── Deep background gradient ──────────────────────────── */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
          <LinearGradient
            colors={['#0a0408', '#060308', '#000000', '#04030a']}
            locations={[0, 0.35, 0.65, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* ── Subtle orange radial top-right ────────────────────── */}
        <Animated.View
          style={[styles.radialOrange, { opacity: Animated.multiply(bgOpacity, 1) }]}
        />
        {/* ── Subtle purple radial bottom-left ──────────────────── */}
        <Animated.View
          style={[styles.radialPurple, { opacity: Animated.multiply(bgOpacity, 1) }]}
        />
        {/* ── Tiny center glow behind logo ──────────────────────── */}
        <Animated.View
          style={[styles.radialCenter, { opacity: logoOpacity }]}
        />

        {/* ── Floating particles ────────────────────────────────── */}
        {particles.map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        {/* ── Center stage ──────────────────────────────────────── */}
        <View style={styles.stage}>

          {/* Concentric rings behind logo */}
          <View style={styles.ringsWrap}>
            <PulseRing  size={220} color="rgba(255,133,0,0.12)"  delay={400} />
            <PulseRing  size={170} color="rgba(108,80,196,0.14)" delay={600} />
            <RotatingRing size={260} borderColor="rgba(255,133,0,0.08)"  duration={18000} delay={500}  clockwise={true} />
            <RotatingRing size={195} borderColor="rgba(108,80,196,0.10)" duration={12000} delay={700}  clockwise={false} />
            <RotatingRing size={140} borderColor="rgba(255,133,0,0.10)"  duration={8000}  delay={900}  clockwise={true} />
          </View>

          {/* Logo */}
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            {/* Outer glow border */}
            <View style={styles.logoGlowBorder} />

            <View style={styles.logoInner}>
              <Image
                source={require('../../assets/Logo.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
              {/* Shimmer */}
              <Animated.View
                style={[
                  styles.shimmerWrap,
                  { transform: [{ translateX: shimmerX }, { skewX: '-15deg' }] },
                ]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </Animated.View>

          {/* App name */}
          <Animated.View
            style={[
              styles.nameRow,
              { opacity: nameOpacity, transform: [{ scale: nameScale }] },
            ]}
          >
            <Text style={styles.nameGo}>Go</Text>
            <Text style={styles.nameWealthy}>Wealthy</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              { opacity: tagOpacity, transform: [{ translateY: tagY }] },
            ]}
          >
            Plan smarter. Grow faster.
          </Animated.Text>

          {/* Dot row */}
          {/* <Animated.View style={[styles.dotRow, { opacity: dotRow }]}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </Animated.View> */}

        </View>

        {/* ── Bottom area ───────────────────────────────────────── */}
        <View style={styles.bottom}>
          <Animated.View style={[styles.poweredRow, { opacity: tagOpacity }]}>
            <Text style={styles.poweredText}>Part of </Text>
            <Text style={styles.poweredBrand}>GoChanakya</Text>
          </Animated.View>

          {/* Progress line */}
          <Animated.View style={[styles.lineTrack, { opacity: lineOpacity }]}>
            <Animated.View style={[styles.lineFill, { width: progressW }]}>
              <LinearGradient
                colors={['#FF8500', '#c860d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* ── Exit veil ─────────────────────────────────────────── */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: veil }]}
          pointerEvents="none"
        />

      </View>
    </>
  );
}

const LOGO_SIZE = 110;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 48,
    paddingTop: 0,
  },

  // Radial glows — small and targeted, not giant blobs
  radialOrange: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 100, 0, 0.13)',
    top: -60,
    right: -60,
  },
  radialPurple: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(90, 50, 180, 0.15)',
    bottom: -80,
    left: -80,
  },
  radialCenter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 133, 0, 0.07)',
    top: height / 2 - 100,
    left: width / 2 - 100,
  },

  // Stage
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Rings wrap — all rings centered absolutely
  ringsWrap: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo
  logoWrap: {
    marginBottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
 // Change these two styles:

logoGlowBorder: {
  position: 'absolute',
  width: LOGO_SIZE + 16,
  height: LOGO_SIZE + 16,
  borderRadius: (LOGO_SIZE + 16) / 2 * 0.42,
  borderWidth: 1,
  borderColor: 'rgba(255, 133, 0, 0.35)',
  shadowColor: '#FF8500',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 16,
  elevation: 10,
  // ✅ ADD THIS — hides the box, keeps the glow effect
  backgroundColor: 'transparent',
},

logoInner: {
  width: LOGO_SIZE,
  height: LOGO_SIZE,
  borderRadius: LOGO_SIZE * 0.26,
  overflow: 'hidden',
  // ✅ REMOVE backgroundColor entirely, just keep shadow
  // shadowColor: '#FF8500',
  // shadowOffset: { width: 0, height: 0 },  // center glow, not offset
  // shadowOpacity: 0.45,
  // shadowRadius: 24,
  // elevation: 16,
},
  logoImg: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: '100%',
  },

  // Text
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  nameGo: {
    fontSize: 40,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: -0.5,
    fontFamily: 'Syne',
  },
  nameWealthy: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FF8500',
    letterSpacing: -1,
    fontFamily: 'Syne',
  },
  tagline: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 20,
  },

  // // Dots
  // dotRow: {
  //   flexDirection: 'row',
  //   gap: 6,
  //   alignItems: 'center',
  // },
  // dot: {
  //   width: 5,
  //   height: 5,
  //   borderRadius: 3,
  //   backgroundColor: 'rgba(255,255,255,0.15)',
  // },
  // dotActive: {
  //   width: 20,
  //   height: 5,
  //   borderRadius: 3,
  //   backgroundColor: '#FF8500',
  // },

  // Bottom
  bottom: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  poweredRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poweredText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    fontWeight: '400',
  },
  poweredBrand: {
    fontSize: 11,
    color: 'rgba(255,133,0,0.5)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lineTrack: {
    width: '100%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  lineFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
});