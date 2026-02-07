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
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import { colors, globalStyles, shadows, isMobile } from '../../../src/theme/globalStyles';

const { width } = Dimensions.get('window');

const GowiserBlogList = () => {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
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

  const handleArticlePress = (articleId) => {
    router.push(`/(gowealthy)/gowiser/${articleId}`);
  };

  if (loading) {
    return (
      <View style={[globalStyles.backgroundContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accentColor} />
        <Text style={styles.loadingText}>Loading articles...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundColor} />
      
      <View style={globalStyles.backgroundContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GoWiser</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {articles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📚</Text>
              <Text style={styles.emptyTitle}>No Articles Yet</Text>
              <Text style={styles.emptySubtitle}>Check back soon for financial wisdom!</Text>
            </View>
          ) : (
            <View style={styles.articlesGrid}>
              {articles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleCard}
                  onPress={() => handleArticlePress(article.id)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[colors.gradientPurple1, colors.gradientPurple2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.articleCardInner}
                  >
                    {article.titleImage && (
                      <Image
                        source={{ uri: article.titleImage }}
                        style={styles.articleImage}
                        resizeMode="cover"
                      />
                    )}
                    
                    <View style={styles.articleContent}>
                      <Text style={styles.articleTitle} numberOfLines={2}>
                        {article.title}
                      </Text>
                      
                      <Text style={styles.articleDescription} numberOfLines={3}>
                        {article.description}
                      </Text>
                      
                      <View style={styles.articleFooter}>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaText}>📖 {article.minRead} min</Text>
                          <View style={styles.xpBadge}>
                            <Text style={styles.xpText}>🎯 {article.xp} XP</Text>
                          </View>
                        </View>
                        
                        {article.category && (
                          <Text style={styles.categoryText}>{article.category}</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.viewsBadge}>
                      <Text style={styles.viewsText}>👁 {article.views || 0}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: colors.textColor,
    marginTop: 16,
    fontSize: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.cardBackground,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    color: colors.textColor,
    fontSize: 28,
    fontWeight: '300',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textColor,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textColor,
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: colors.subtitleColor,
  },

  articlesGrid: {
    gap: 20,
  },

  articleCard: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.lg,
  },

  articleCardInner: {
    position: 'relative',
  },

  articleImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.optionBackground,
  },

  articleContent: {
    padding: 20,
  },

  articleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 12,
  },

  articleDescription: {
    fontSize: 14,
    color: colors.subtitleColor,
    lineHeight: 20,
    marginBottom: 16,
  },

  articleFooter: {
    gap: 8,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  metaText: {
    fontSize: 12,
    color: colors.subtitleColor,
  },

  xpBadge: {
    backgroundColor: colors.accentColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textColor,
  },

  categoryText: {
    fontSize: 11,
    color: colors.accentColor,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  viewsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  viewsText: {
    fontSize: 11,
    color: colors.textColor,
    fontWeight: '600',
  },
});

export default GowiserBlogList;