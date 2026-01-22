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
      title: "Investment Tracker",
      subtitle: "Track your investments",
      icon: "📈",
      route: null // Add route when ready
    },
    {
      id: 3,
      title: "Goal Planning",
      subtitle: "Set and achieve goals",
      icon: "🎯",
      route: null
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
    router.push('/(gowealthy)/questionnaire/section5/screen22');
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
                🚀 TEST
              </Text>
            </TouchableOpacity>
            {/* Feature Cards */}
            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureCard,
                    !feature.route && styles.featureCardDisabled
                  ]}
                  onPress={() => handleFeatureClick(feature.route)}
                  activeOpacity={0.8}
                  disabled={!feature.route}
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
                    {!feature.route && (
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