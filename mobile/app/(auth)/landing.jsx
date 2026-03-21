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