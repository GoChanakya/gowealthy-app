import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { C, FONT, RADIUS, ICON, gwStyles , STORY_TOP } from '../../theme';
import { getYouTubeVideoId } from '../../lib/html';
import { Ico } from '../../../../lib/icons';

const PLATFORM = {
  instagram: { icon: 'Instagram', heading: 'Instagram' },
  twitter: { icon: 'Twitter', heading: 'Twitter' },
  linkedin: { icon: 'Linkedin', heading: 'LinkedIn' },
};

const platformMeta = (platform) => PLATFORM[platform] || PLATFORM.linkedin;

function YouTubeCard({ post, videoId }) {
  return (
    <>
      <Text style={styles.heading}>YouTube</Text>
      <TouchableOpacity
        style={styles.videoWrap}
        onPress={() => Linking.openURL(post.url)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.playButton}>
          <Ico name="Play" size={20} color="#1a0d04" strokeWidth={2.2} />
        </View>
      </TouchableOpacity>
    </>
  );
}

function LinkCard({ post }) {
  const { icon, heading } = platformMeta(post.platform);
  return (
    <>
      <Text style={styles.heading}>{heading}</Text>
      <TouchableOpacity
        style={styles.link}
        onPress={() => Linking.openURL(post.url)}
        activeOpacity={0.75}
      >
        <View style={styles.linkIcon}>
          <Ico name={icon} size={ICON.md} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.platform}>{post.platform}</Text>
          <Text style={styles.hint} numberOfLines={1}>
            Tap to open
          </Text>
        </View>
        <Ico name="ArrowUpRight" size={ICON.md} color={C.muted} />
      </TouchableOpacity>
    </>
  );
}

export default function SocialSlide({ content, scrollHandlers }) {
  return (
    <View style={styles.slide}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        {...scrollHandlers}
      >
        <Text style={styles.title}>More on this</Text>

        <View style={{ gap: 16 }}>
          {content.map((post, idx) => {
            const videoId = post.platform === 'youtube' ? getYouTubeVideoId(post.url) : null;
            return (
              <View key={idx} style={[gwStyles.surfaceCard, styles.card]}>
                {videoId ? <YouTubeCard post={post} videoId={videoId} /> : <LinkCard post={post} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, paddingTop: STORY_TOP },
  inner: { padding: 24, paddingBottom: 130 },

  title: {
    fontSize: 25,
    fontFamily: FONT.display,
    color: C.ink,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: { fontSize: 13.5, fontFamily: FONT.body, color: C.muted, marginBottom: 22 },

  card: { padding: 16 },
  heading: {
    fontSize: 12,
    fontFamily: FONT.bodySemi,
    color: C.o2,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 13,
  },

  videoWrap: {
    position: 'relative',
    width: '100%',
    height: 190,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.line,
  },
  thumbnail: { width: '100%', height: '100%' },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.o,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.o,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  playIcon: { fontSize: 20, color: '#1a0d04', marginLeft: 3 },

  link: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.line,
    padding: 12,
    borderRadius: RADIUS.sm,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.bg2,
    borderWidth: 1,
    borderColor: C.line,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkEmoji: { fontSize: 21 },
  platform: {
    fontSize: 14,
    fontFamily: FONT.bodySemi,
    color: C.ink,
    textTransform: 'capitalize',
    marginBottom: 3,
  },
  hint: { fontSize: 11.5, fontFamily: FONT.body, color: C.muted },
  arrow: { fontSize: 18, color: C.o2 },
});
