import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../../theme';

const { width, height } = Dimensions.get('window');

const IMAGE_HEIGHT = height * 0.45;
const CHROME_HEIGHT = 100;

export default function IntroSlide({ content }) {
  return (
    <View style={styles.slide}>
      {!!content.image && (
        <Image source={{ uri: content.image }} style={styles.image} resizeMode="cover" />
      )}

      {/* Fades the cover art down into the ember ground rather than a flat black wash. */}
      <LinearGradient
        colors={['rgba(8,6,10,0.15)', 'rgba(8,6,10,0.86)', C.bg]}
        locations={[0, 0.46, 0.72]}
        style={styles.overlay}
      >
        {!!content.category && (
          <View style={styles.categoryWrap}>
            <Text style={styles.category}>{content.category}</Text>
          </View>
        )}

        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.description}>{content.description}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>By {content.author}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{content.minRead} min read</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, paddingTop: CHROME_HEIGHT },
  image: { width, height: IMAGE_HEIGHT, position: 'absolute', top: CHROME_HEIGHT },
  overlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    paddingTop: IMAGE_HEIGHT + CHROME_HEIGHT,
    paddingBottom: 44,
  },

  categoryWrap: { alignSelf: 'flex-start', marginBottom: 14 },
  category: {
    fontSize: 10,
    color: C.o2,
    fontFamily: FONT.bodySemi,
    letterSpacing: 2,
    textTransform: 'uppercase',
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.line2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    overflow: 'hidden',
  },

  title: {
    fontSize: 30,
    fontFamily: FONT.display,
    color: C.ink,
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 12,
  },
  description: {
    fontSize: 14.5,
    fontFamily: FONT.body,
    color: C.muted,
    lineHeight: 22,
    marginBottom: 16,
  },

  meta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  metaText: { fontSize: 11.5, fontFamily: FONT.bodyMed, color: C.muted, letterSpacing: 0.3 },
  metaDot: { fontSize: 11.5, color: C.o2 },
});
