import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, RADIUS, gwStyles } from '../theme';
import { FadeInUp } from '../../../lib/ui-kit';

/** Warm scrim over cover art so arbitrary CMS images stay inside the palette. */
const SCRIM = ['rgba(212,71,10,0.16)', 'rgba(8,6,10,0.78)'];

export default function ArticleCard({ article, onPress, delay = 0 }) {
  return (
    <FadeInUp delay={delay}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.imageWrap}>
          {article.titleImage ? (
            <Image source={{ uri: article.titleImage }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, { backgroundColor: C.surface2 }]} />
          )}
          <LinearGradient colors={SCRIM} style={StyleSheet.absoluteFill} pointerEvents="none" />

          {!!article.category && (
            <View style={styles.categoryBar}>
              <Text style={styles.categoryText} numberOfLines={1}>
                {article.category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {article.description}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.meta}>{article.minRead}m read</Text>
            <View style={styles.metaRight}>
              <Text style={styles.meta}>{article.views || 0} views</Text>
              <View style={[gwStyles.xpPill, styles.xpPill]}>
                <Text style={[gwStyles.xpPillText, styles.xpText]}>+{article.xp} XP</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </FadeInUp>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: C.line,
  },
  cardPressed: { borderColor: C.o, backgroundColor: 'rgba(255,106,26,0.08)' },

  imageWrap: { width: 104, alignSelf: 'stretch', position: 'relative' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  categoryBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: 'rgba(8,6,10,0.72)',
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  categoryText: {
    fontSize: 8,
    fontFamily: FONT.bodySemi,
    color: C.gold,
    letterSpacing: 1,
    textAlign: 'center',
  },

  body: { flex: 1, padding: 12, gap: 5 },
  title: {
    fontSize: 13.5,
    fontFamily: FONT.displaySemi,
    color: C.ink,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  desc: { fontSize: 11.5, fontFamily: FONT.body, color: C.muted, lineHeight: 16 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: 10.5, fontFamily: FONT.body, color: C.muted, opacity: 0.85 },

  xpPill: { paddingHorizontal: 8, paddingVertical: 2.5 },
  xpText: { fontSize: 9.5 },
});
