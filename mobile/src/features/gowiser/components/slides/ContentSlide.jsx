import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, FONT } from '../../theme';

/** Render the parsed text runs from `parseContentWithFormatting`. */
function FormattedText({ parts }) {
  return parts.map((part, index) => {
    if (part.bold) return <Text key={index} style={styles.bold}>{part.text}</Text>;
    if (part.italic) return <Text key={index} style={styles.italic}>{part.text}</Text>;
    if (part.heading) {
      return (
        <Text key={index} style={styles.h3}>
          {'\n'}{part.text}{'\n'}
        </Text>
      );
    }
    return <Text key={index}>{part.text}</Text>;
  });
}

export default function ContentSlide({ content, scrollHandlers }) {
  return (
    <View style={styles.slide}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        {...scrollHandlers}
      >
        {!!content.title && <Text style={styles.title}>{content.title}</Text>}
        <Text style={styles.body}>
          <FormattedText parts={content.parts} />
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, paddingTop: 100 },
  inner: { padding: 24, paddingBottom: 130 },

  title: {
    fontSize: 25,
    fontFamily: FONT.display,
    color: C.ink,
    letterSpacing: -0.8,
    lineHeight: 31,
    marginBottom: 18,
  },
  body: { fontSize: 15.5, fontFamily: FONT.body, color: C.ink, lineHeight: 26 },

  bold: { fontFamily: FONT.bodyBold, color: C.gold2 },
  italic: { fontStyle: 'italic', color: C.muted },
  h3: { fontSize: 17, fontFamily: FONT.displaySemi, color: C.o2, letterSpacing: -0.3 },
});
