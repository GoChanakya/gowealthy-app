import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  colors, 
  globalStyles,
  shadows,
  isMobile
} from '../../src/theme/globalStyles';

const GoWealthyHome = () => {
  const router = useRouter();

  const features = [
    {
      id: 1,
      title: "Financial Planner",
      subtitle: "Plan your financial future",
      icon: "💰",
      route: "/(gowealthy)/questionnaire/section1/screen1"
    },
    {
      id: 2,
      title: "Mutual Fund platform",
      subtitle: "Invest in mutual funds", // <-- Add a subtitle here
      icon: "📈",
      route: "/(gowealthy)/mf/onboarding/screen1"
    },
    {
      id: 3,
      title: "GoWiser",
      subtitle: "Blogs and Articles",
      icon: "📚",
      route: "/(gowealthy)/gowiser"  // ADD THIS
    },
    {
      id: 4,
      title: "Expense Manager",
      subtitle: "Manage your expenses",
      icon: "💳",
      route: null
    },
  ];


  const goToTestScreen = () => {
    router.push('/(gowealthy)/dashboard/home');
  };
  const handleFeatureClick = (route) => {
    if (route) {
      router.push(route);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />

      <View style={globalStyles.backgroundContainer}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.appTitle}>GoWealthy</Text>
              <Text style={styles.appSubtitle}>Your Financial Companion</Text>
            </View>
<TouchableOpacity
              onPress={goToTestScreen}
              style={{
                backgroundColor: '#FF6B35',
                padding: 15,
                borderRadius: 10,
                marginBottom: 20,
                marginHorizontal: 20,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                Dashboard Test
              </Text>
              
            </TouchableOpacity>
            
<TouchableOpacity
  onPress={async () => {
    await AsyncStorage.multiRemove(['auth_token', 'user_phone', 'auth_timestamp']);
    router.replace('/(auth)/landing');
  }}
  style={{
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  }}
>
  <Text style={{ color: '#fca5a5', fontSize: 13, fontWeight: '600' }}>
    🧪 DEV: Clear Auth & Test Login Flow
  </Text>
</TouchableOpacity>
            {/* Feature Cards */}
            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureCard,
                    feature.route == null && styles.featureCardDisabled // changed from !feature.route
                  ]}
                  onPress={() => handleFeatureClick(feature.route)}
                  activeOpacity={0.8}
                  disabled={feature.route == null} // changed from !feature.route
                >
                  <LinearGradient
                    colors={feature.route ? [colors.gradientPurple1, colors.gradientPurple2] : [colors.optionBackground, colors.optionBackground]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureCardInner}
                  >
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                    {feature.route == null && ( // changed from !feature.route
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Coming Soon</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: isMobile ? 20 : 32,
    paddingTop: isMobile ? 60 : 80,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: isMobile ? 40 : 60,
  },

  appTitle: {
    fontSize: isMobile ? 36 : 48,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 8,
  },

  appSubtitle: {
    fontSize: isMobile ? 16 : 18,
    color: colors.subtitleColor,
    fontWeight: '400',
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 16 : 20,
    justifyContent: 'center',
  },

  featureCard: {
    width: isMobile ? '47%' : '48%',
    maxWidth: 200,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.md,
  },

  featureCardDisabled: {
    opacity: 0.6,
  },

  featureCardInner: {
    padding: isMobile ? 24 : 32,
    alignItems: 'center',
    minHeight: isMobile ? 180 : 200,
    justifyContent: 'center',
    position: 'relative',
  },

  featureIcon: {
    fontSize: isMobile ? 48 : 56,
    marginBottom: 16,
  },

  featureTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: colors.textColor,
    textAlign: 'center',
    marginBottom: 8,
  },

  featureSubtitle: {
    fontSize: isMobile ? 12 : 14,
    color: colors.subtitleColor,
    textAlign: 'center',
  },

  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.accentColor,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textColor,
  },
});

export default GoWealthyHome;

// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Image,
//   TouchableOpacity,
//   StatusBar,
//   Dimensions,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';



// const { width } = Dimensions.get('window');

// // ─── Global Color Palette ─────────────────────────────────────────────────────
// const BG = '#0B0C10';
// const ORANGE = '#FF7E40';
// const PURPLE = '#A64BFF';
// const TEXT_PRIMARY = '#FFFFFF';
// const TEXT_SECONDARY = 'rgba(255,255,255,0.65)';
// const GLASS_FILL = 'rgba(20,20,30,0.6)';

// // ─── Road Map Items ───────────────────────────────────────────────────────────
// const ROAD_MAP_ITEMS = [
//   {
//     id: 1,
//     title: 'Combine Holdings',
//     subtitle: 'Unified view across Brokers, Family Members, and Banks.',
//     tag: null,
//     imageUri: null,
//   },
//   {
//     id: 2,
//     title: 'Comprehensive Financial Plan',
//     subtitle: null,
//     tag: 'Only for Pro Users',
//     imageUri: null,
//   },
//   {
//     id: 3,
//     title: 'Set Emergency Fund',
//     subtitle: null,
//     tag: null,
//     imageUri: null,
//   },
//   {
//     id: 4,
//     title: 'Set Goals',
//     subtitle: null,
//     tag: null,
//     imageUri: null,
//   },
//   {
//     id: 5,
//     title: 'How much Insurance',
//     subtitle: null,
//     tag: null,
//     imageUri: null,
//   },
// ];

// const MILESTONES = [
//   { label: '5 Yrs: ₹35L', position: 0.26 },
//   { label: '10 Yrs: ₹55L', position: 0.56 },
//   { label: '15 Yrs: ₹85L', position: 0.86 },
// ];

// // ─── Logo ─────────────────────────────────────────────────────────────────────
// function Logo() {
//   return (
//     <Text style={styles.logoText}>
//       <Text style={{ color: TEXT_PRIMARY }}>Go</Text>
//       <Text style={{ color: TEXT_PRIMARY }}>Wealthy</Text>
//     </Text>
//   );
// }

// // ─── Glassify Card ────────────────────────────────────────────────────────────
// function GlassCard({ children }) {
//   return (
//     <LinearGradient
//       colors={['rgba(255,126,64,0.8)', 'rgba(166,75,255,0.8)']}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={styles.glassGradientBorder}
//     >
//       <View style={styles.glassInner}>
//         {children}
//       </View>
//     </LinearGradient>
//   );
// }

// // ─── Header ───────────────────────────────────────────────────────────────────
// function Header() {
//   return (
//     <View style={styles.header}>
//       <Logo />
//       <View style={styles.headerRight}>
//         <View style={styles.avatar}>
//           <Text style={{ fontSize: 16 }}>👤</Text>
//         </View>
//         <View style={styles.bellBtn}>
//           <Text style={styles.bellIcon}>🔔</Text>
//         </View>
//       </View>
//     </View>
//   );
// }

// // ─── Wealth Progress Bar ──────────────────────────────────────────────────────
// function WealthProgressBar() {
//   const barWidth = width - 48;

//   return (
//     <View style={styles.progressSection}>
//       <Text style={styles.sectionTitle}>Wealth Road Map</Text>
//       <Text style={styles.currentWealth}>Current: ₹24.5L</Text>

//       <View style={{ width: barWidth }}>
//         {/* Gradient bar */}
//         <LinearGradient
//           colors={[PURPLE, ORANGE]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 0 }}
//           style={styles.progressBar}
//         />

//         {/* Marker dots */}
//         {MILESTONES.map((m) => (
//           <View
//             key={m.label}
//             style={[styles.markerDot, { left: barWidth * m.position - 6 }]}
//           />
//         ))}

//         {/* Labels row */}
//         <View style={styles.milestoneRow}>
//           {MILESTONES.map((m) => (
//             <Text key={m.label} style={styles.milestoneText}>{m.label}</Text>
//           ))}
//         </View>
//       </View>
//     </View>
//   );
// }

// // ─── Road Map Card ────────────────────────────────────────────────────────────
// function RoadMapCard({ item }) {
//   return (
//     <GlassCard>
//       <View style={styles.cardRow}>
//         {/* Left column */}
//         <View style={styles.cardLeftCol}>
//           <Text style={styles.cardNumber}>{item.id}.</Text>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.cardTitle}>{item.title}</Text>
//             {item.subtitle ? (
//               <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
//             ) : null}
//             {item.tag ? (
//               <Text style={styles.cardTag}>({item.tag})</Text>
//             ) : null}
//           </View>
//         </View>

//         {/* Right column — image */}
//         <View style={styles.cardRightCol}>
//           {item.imageUri ? (
//             <Image
//               source={{ uri: item.imageUri }}
//               style={styles.cardImage}
//               resizeMode="cover"
//             />
//           ) : (
//             <LinearGradient
//               colors={['rgba(166,75,255,0.2)', 'rgba(255,126,64,0.15)']}
//               style={styles.cardImagePlaceholder}
//             >
//               <View style={styles.cardImageRingOuter} />
//               <View style={styles.cardImageRingInner} />
//               <Text style={styles.cardImageIcon}>✦</Text>
//             </LinearGradient>
//           )}
//         </View>
//       </View>
//     </GlassCard>
//   );
// }

// // ─── Bottom Nav ───────────────────────────────────────────────────────────────
// function BottomNav() {
//   const tabs = [
//     { label: 'Wealth Journey', icon: '◈', active: true },
//     { label: 'Learn', icon: '◎', active: false },
//     { label: 'Profile', icon: '◉', active: false },
//   ];

//   return (
//     <View style={styles.navBar}>
//       <View style={styles.navTopBorder} />
//       {tabs.map((tab) => (
//         <TouchableOpacity key={tab.label} style={styles.navTab} activeOpacity={0.7}>
//           <Text style={[styles.navIcon, tab.active && styles.navIconActive]}>
//             {tab.icon}
//           </Text>
//           <Text style={[styles.navLabel, tab.active && styles.navLabelActive]}>
//             {tab.label}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );
// }

// // ─── Root Screen ──────────────────────────────────────────────────────────────
// export default function WealthJourneyScreen() {
//   return (
//     <View style={styles.root}>
//       <StatusBar barStyle="light-content" backgroundColor={BG} />

//       {/* Background ambient glows */}
//       <View style={styles.glowPurple} />
//       <View style={styles.glowOrange} />

//       <SafeAreaView style={{ flex: 1 }}>
//         <Header />

//         <ScrollView
//           style={styles.scrollView}
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           <WealthProgressBar />

//           {/* Cards list */}
//           <View style={styles.cardList}>
//             {ROAD_MAP_ITEMS.map((item) => (
//               <RoadMapCard key={item.id} item={item} />
//             ))}
//           </View>

//           <View style={{ height: 100 }} />
//         </ScrollView>
//       </SafeAreaView>

//       <BottomNav />
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: BG,
//   },

//   // Ambient glows
//   glowPurple: {
//     position: 'absolute',
//     top: -60, right: -60,
//     width: 300, height: 300, borderRadius: 150,
//     backgroundColor: PURPLE,
//     opacity: 0.10,
//   },
//   glowOrange: {
//     position: 'absolute',
//     bottom: 100, left: -80,
//     width: 300, height: 300, borderRadius: 150,
//     backgroundColor: ORANGE,
//     opacity: 0.08,
//   },

//   // Header
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingTop: 14,
//     paddingBottom: 10,
//   },
//   logoText: {
//     fontSize: 28,
//     fontWeight: '700',
//     fontFamily: 'Syne_700Bold',
//     letterSpacing: 0.3,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 36, height: 36, borderRadius: 18,
//     backgroundColor: 'rgba(255,126,64,0.2)',
//     borderWidth: 1.5, borderColor: ORANGE,
//     alignItems: 'center', justifyContent: 'center',
//     marginRight: 12,
//   },
//   bellBtn: {
//     width: 34, height: 34, borderRadius: 17,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   bellIcon: { fontSize: 18, opacity: 0.8 },

//   // Scroll
//   scrollView: { flex: 1 },
//   scrollContent: { paddingHorizontal: 24, paddingTop: 4 },

//   // Progress bar section
//   progressSection: { marginBottom: 28 },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     fontFamily: 'Syne_700Bold',
//     color: TEXT_PRIMARY,
//     marginBottom: 2,
//     letterSpacing: 0.3,
//   },
//   currentWealth: {
//     fontSize: 14,
//     fontFamily: 'SpaceGrotesk_400Regular',
//     color: TEXT_SECONDARY,
//     marginBottom: 16,
//   },
//   progressBar: {
//     height: 12,
//     borderRadius: 6,
//     marginBottom: 10,
//     shadowColor: PURPLE,
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.7,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   markerDot: {
//     position: 'absolute',
//     top: 1,
//     width: 10, height: 10, borderRadius: 5,
//     backgroundColor: '#FFFFFF',
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.5)',
//     shadowColor: '#FFFFFF',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.8,
//     shadowRadius: 4,
//   },
//   milestoneRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 0,
//     marginTop: 8,
//   },
//   milestoneText: {
//     fontSize: 12,
//     fontFamily: 'SpaceGrotesk_400Regular',
//     color: TEXT_PRIMARY,
//     fontWeight: '500',
//   },

//   // Cards list
//   cardList: {
//     flexDirection: 'column',
//   },

//   // Glassify card
//   glassGradientBorder: {
//     borderRadius: 16,
//     padding: 1.5,
//     marginBottom: 14,
//     shadowColor: ORANGE,
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.25,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   glassInner: {
//     borderRadius: 15,
//     overflow: 'hidden',
//     backgroundColor: '#13101E',
//   },

//   // Card row
//   cardRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     minHeight: 90,
//   },
//   cardLeftCol: {
//     flex: 0.70,
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     paddingRight: 8,
//   },
//   cardNumber: {
//     fontSize: 16,
//     fontWeight: '700',
//     fontFamily: 'Syne_700Bold',
//     color: TEXT_SECONDARY,
//     marginRight: 8,
//     marginTop: 1,
//     width: 24,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     fontFamily: 'Syne_700Bold',
//     color: TEXT_PRIMARY,
//     lineHeight: 24,
//     marginBottom: 4,
//   },
//   cardSubtitle: {
//     fontSize: 13,
//     fontFamily: 'SpaceGrotesk_400Regular',
//     color: TEXT_SECONDARY,
//     lineHeight: 18,
//   },
//   cardTag: {
//     fontSize: 12,
//     fontFamily: 'SpaceGrotesk_400Regular',
//     color: 'rgba(255,255,255,0.35)',
//     fontStyle: 'italic',
//     marginTop: 2,
//   },
//   cardRightCol: {
//     flex: 0.30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cardImage: {
//     width: 80, height: 80, borderRadius: 12,
//   },
//   cardImagePlaceholder: {
//     width: 80, height: 80, borderRadius: 12,
//     alignItems: 'center', justifyContent: 'center',
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   cardImageRingOuter: {
//     position: 'absolute',
//     width: 72, height: 72, borderRadius: 36,
//     borderWidth: 1, borderColor: 'rgba(166,75,255,0.3)',
//   },
//   cardImageRingInner: {
//     position: 'absolute',
//     width: 44, height: 44, borderRadius: 22,
//     borderWidth: 1, borderColor: 'rgba(255,126,64,0.3)',
//   },
//   cardImageIcon: {
//     fontSize: 22,
//     color: 'rgba(255,255,255,0.25)',
//   },

//   // Bottom nav
//   navBar: {
//     position: 'absolute',
//     bottom: 0, left: 0, right: 0,
//     flexDirection: 'row',
//     paddingTop: 12,
//     paddingBottom: 28,
//     backgroundColor: '#0D0A16',
//     overflow: 'hidden',
//   },
//   navTopBorder: {
//     position: 'absolute',
//     top: 0, left: 0, right: 0,
//     height: 1,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },
//   navTab: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   navIcon: {
//     fontSize: 22,
//     marginBottom: 3,
//     color: TEXT_SECONDARY,
//   },
//   navIconActive: {
//     color: ORANGE,
//     textShadowColor: ORANGE,
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 8,
//   },
//   navLabel: {
//     fontSize: 11,
//     fontFamily: 'SpaceGrotesk_400Regular',
//     color: TEXT_SECONDARY,
//     fontWeight: '500',
//   },
//   navLabelActive: {
//     color: ORANGE,
//     fontWeight: '700',
//     textShadowColor: 'rgba(255,126,64,0.5)',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 6,
//   },
// });