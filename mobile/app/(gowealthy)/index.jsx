import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import {
  colors,
  globalStyles,
  shadows,
  isMobile
} from '../../src/theme/globalStyles';
import GowiserBlogList from './gowiser/index';

const ORANGE = '#FF6300';

const GoWealthyHome = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

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
      subtitle: "Invest in mutual funds",
      icon: "📈",
      route: "/(gowealthy)/mf/onboarding/screen1"
    },
  ];

  useEffect(() => {
    if (activeTab === 'learn' && articles.length === 0) {
      fetchArticles();
    }
  }, [activeTab]);

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const articlesRef = collection(db, 'products', 'gowiser', 'articles');
      const q = query(articlesRef, where('published', '==', true));
      const querySnapshot = await getDocs(q);
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      fetched.sort((a, b) => {
        const dateA = a.publishedAt?.toDate?.() || new Date(0);
        const dateB = b.publishedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setArticles(fetched);
    } catch (e) {
      console.error('Error fetching articles:', e);
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleFeatureClick = (route) => {
    if (route) router.push(route);
  };

  const renderHome = () => (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.appTitle}>GoWealthy</Text>
          <Text style={styles.appSubtitle}>Your Financial Companion</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/dashboard/home')}
          style={styles.devButton}
        >
          <Text style={styles.devButtonText}>Dashboard Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.multiRemove(['auth_token', 'user_phone', 'auth_timestamp']);
            router.replace('/(auth)/landing');
          }}
          style={styles.clearAuthButton}
        >
          <Text style={styles.clearAuthText}>🧪 DEV: Clear Auth & Test Login Flow</Text>
        </TouchableOpacity>

        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, feature.route == null && styles.featureCardDisabled]}
              onPress={() => handleFeatureClick(feature.route)}
              activeOpacity={0.8}
              disabled={feature.route == null}
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
                {feature.route == null && (
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
  );

  const renderLearn = () => (
    <GowiserBlogList hideHeader={true} />
  );

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

        <View style={styles.bottomTabBar}>
          {[
            { key: 'home', icon: '🗺️', label: 'Wealth Journey' },
            { key: 'learn', icon: '💡', label: 'Learn' },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  devButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },

  devButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  clearAuthButton: {
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },

  clearAuthText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
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

  learnHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.cardBackground,
  },

  learnTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textColor,
  },

  learnSubtitle: {
    fontSize: 14,
    color: colors.subtitleColor,
    marginTop: 4,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: colors.textColor,
    marginTop: 12,
    fontSize: 14,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },

  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textColor,
    marginBottom: 6,
  },

  emptySubtitle: {
    fontSize: 13,
    color: colors.subtitleColor,
  },

  articleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.md,
  },

  articleCardInner: {
    position: 'relative',
  },

  articleImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.optionBackground,
  },

  articleContent: {
    padding: 16,
  },

  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 6,
  },

  articleDescription: {
    fontSize: 13,
    color: colors.subtitleColor,
    lineHeight: 18,
    marginBottom: 12,
  },

  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },

  metaText: {
    fontSize: 12,
    color: colors.subtitleColor,
  },

  xpBadge: {
    backgroundColor: ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  xpText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textColor,
  },

  categoryText: {
    fontSize: 11,
    color: ORANGE,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  viewsBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  viewsText: {
    fontSize: 11,
    color: colors.textColor,
    fontWeight: '600',
  },

  emptyTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTabEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTabText: {
    fontSize: 16,
    color: colors.subtitleColor,
  },

  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },

  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },

  tabLabel: {
    fontSize: 11,
    color: colors.subtitleColor,
    fontWeight: '500',
  },

  tabLabelActive: {
    color: ORANGE,
    fontWeight: '700',
  },

  tabActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ORANGE,
    marginTop: 4,
  },
});

export default GoWealthyHome;