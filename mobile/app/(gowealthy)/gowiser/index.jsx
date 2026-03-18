import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../src/config/firebase';
import { colors, shadows } from '../../../src/theme/globalStyles';

const ORANGE = '#FF6300';
const PURPLE = '#6C50C4';

const GowiserBlogList = ({ hideHeader = false }) => {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('new');
  const [completedIds, setCompletedIds] = useState([]);

  useEffect(() => {
    fetchArticles();
    fetchCompletedBlogs();
  }, []);

  const fetchArticles = async () => {
    try {
      const articlesRef = collection(db, 'products', 'gowiser', 'articles');
      const q = query(articlesRef, where('published', '==', true));
      const querySnapshot = await getDocs(q);
      const fetchedArticles = [];
      querySnapshot.forEach((doc) => {
        fetchedArticles.push({ id: doc.id, ...doc.data() });
      });
      fetchedArticles.sort((a, b) => {
        const dateA = a.publishedAt?.toDate?.() || new Date(0);
        const dateB = b.publishedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedBlogs = async () => {
    try {
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) return;
      const blogsReadRef = collection(db, 'questionnaire_submissions', phone, 'blogsRead');
      const snap = await getDocs(blogsReadRef);
      const ids = [];
      snap.forEach((d) => ids.push(d.id));
      setCompletedIds(ids);
    } catch (e) {
      console.error('Error fetching completed blogs:', e);
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (activeFilter === 'new') return !completedIds.includes(a.id);
    return completedIds.includes(a.id);
  });

  const handleArticlePress = (articleId) => {
    router.push(`/(gowealthy)/gowiser/${articleId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>Loading articles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />

      <View style={styles.topHeader}>
        {!hideHeader && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.appName}>GoWealthy</Text>
        {!hideHeader && <View style={styles.backButton} />}
      </View>

      <View style={styles.iqBanner}>
        <Text style={styles.iqTitle}>Increase your Financial IQ</Text>
        <Text style={styles.iqSubtitle}>
          Read stories, learn and earn <Text style={styles.iqOrange}>XP</Text>. Use XP to upgrade your portfolio.
        </Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilter === 'new' && styles.filterBtnActive]}
          onPress={() => setActiveFilter('new')}
        >
          <Text style={[styles.filterText, activeFilter === 'new' && styles.filterTextActive]}>
            New Stories
          </Text>
        </TouchableOpacity>
        <View style={styles.filterDivider} />
        <TouchableOpacity
          style={[styles.filterBtn, activeFilter === 'completed' && styles.filterBtnActive]}
          onPress={() => setActiveFilter('completed')}
        >
          <Text style={[styles.filterText, activeFilter === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredArticles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              {activeFilter === 'completed' ? '🏆' : '📚'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'completed' ? 'No completed articles yet' : 'No new articles'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'completed' ? 'Start reading to earn XP!' : 'Check back soon!'}
            </Text>
          </View>
        ) : (
          filteredArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => handleArticlePress(article.id)}
              activeOpacity={0.85}
            >
              <View style={styles.imageContainer}>
                {article.titleImage ? (
                  <Image
                    source={{ uri: article.titleImage }}
                    style={styles.articleImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.articleImage} />
                )}
                {article.category && (
                  <View style={styles.categoryOverlay}>
                    <Text style={styles.categoryText}>{article.category.toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.articleBody}>
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <Text style={styles.articleDesc} numberOfLines={2}>
                  {article.description}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>📖 {article.minRead}m</Text>
                  <View style={styles.metaRight}>
                    <Text style={styles.metaText}>👁 {article.views || 0}</Text>
                    <View style={styles.xpPill}>
                      <Text style={styles.xpText}>+{article.xp} XP</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.backgroundColor,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundColor,
  },

  loadingText: {
    color: colors.textColor,
    marginTop: 12,
    fontSize: 14,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    color: colors.textColor,
    fontSize: 26,
    fontWeight: '300',
  },

  appName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtitleColor,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  iqBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    backgroundColor: 'rgba(108,80,196,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108,80,196,0.3)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },

  iqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 4,
    textAlign: 'center',
  },

  iqSubtitle: {
    fontSize: 13,
    color: colors.subtitleColor,
    lineHeight: 18,
    textAlign: 'center',
  },

  iqOrange: {
    color: ORANGE,
    fontWeight: '700',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },

  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },

  filterBtnActive: {
    backgroundColor: 'rgba(255,99,0,0.12)',
  },

  filterDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.subtitleColor,
  },

  filterTextActive: {
    color: ORANGE,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  articleCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...shadows.md,
  },


imageContainer: {
  width: 100,
  alignSelf: 'stretch',
  position: 'relative',
},

articleImage: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.optionBackground,
},

  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  categoryText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(220,220,220,0.9)',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  articleBody: {
    flex: 1,
    padding: 10,
    gap: 5,
    justifyContent: 'flex-start',
  },

  articleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textColor,
    lineHeight: 19,
  },

  articleDesc: {
    fontSize: 11,
    color: colors.subtitleColor,
    lineHeight: 16,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaText: {
    fontSize: 11,
    color: colors.subtitleColor,
  },

  xpPill: {
    backgroundColor: 'rgba(255,99,0,0.15)',
    borderWidth: 1,
    borderColor: ORANGE,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },

  xpText: {
    fontSize: 10,
    fontWeight: '700',
    color: ORANGE,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textColor,
    marginBottom: 4,
  },

  emptySubtitle: {
    fontSize: 13,
    color: colors.subtitleColor,
  },
});

export default GowiserBlogList;