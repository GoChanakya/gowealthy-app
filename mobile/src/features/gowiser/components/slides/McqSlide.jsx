import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { C, FONT, RADIUS } from '../../theme';
import { useMcqAnswers } from '../../hooks/useMcqAnswers';

/** Resolve an option's colours from the answer state for its question. */
function optionAppearance({ answered, isSelected, isCorrect }) {
  if (!answered) return { bg: C.surface2, border: C.line, text: C.ink };
  if (isCorrect) return { bg: 'rgba(79,211,154,0.14)', border: C.gd, text: C.gd };
  if (isSelected) return { bg: 'rgba(255,107,107,0.14)', border: C.rd, text: C.rd };
  return { bg: C.surface2, border: C.line, text: C.muted };
}

function Question({ mcq, index, result, onAnswer }) {
  const answered = result !== undefined;

  return (
    <View style={[styles.card, { borderLeftColor: index % 2 === 0 ? C.o : C.gold }]}>
      <View style={{ padding: 16 }}>
        <Text style={styles.question}>{mcq.question}</Text>

        <View style={{ gap: 9, marginTop: 13 }}>
          {mcq.options.map((opt, oi) => {
            const { bg, border, text } = optionAppearance({
              answered,
              isSelected: result?.selected === oi,
              isCorrect: opt.isCorrect,
            });
            return (
              <TouchableOpacity
                key={oi}
                onPress={() => onAnswer(index, oi, opt.isCorrect)}
                disabled={answered}
                style={[styles.option, { backgroundColor: bg, borderColor: border }]}
              >
                <Text style={[styles.optionText, { color: text }]}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {answered && (
          <Text style={[styles.verdict, { color: result.isCorrect ? C.gd : C.rd }]}>
            {result.isCorrect ? '✓ Correct' : '✗ Not quite — the right answer is highlighted above.'}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function McqSlide({ content, scrollHandlers, onOptionTap }) {
  const { answers, answer } = useMcqAnswers({ onAnswer: onOptionTap });

  return (
    <View style={styles.slide}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        {...scrollHandlers}
      >
        <Text style={styles.title}>Test Your Knowledge</Text>
        <Text style={styles.subtitle}>
          Answer all {content.length} question{content.length === 1 ? '' : 's'}
        </Text>

        <View style={{ gap: 13 }}>
          {content.map((mcq, qi) => (
            <Question key={qi} mcq={mcq} index={qi} result={answers[qi]} onAnswer={answer} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, paddingTop: 100 },
  inner: { padding: 24, paddingBottom: 130 },

  title: {
    fontSize: 26,
    fontFamily: FONT.display,
    color: C.ink,
    letterSpacing: -0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONT.body,
    color: C.muted,
    marginBottom: 26,
    textAlign: 'center',
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.line,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  question: {
    fontSize: 15,
    fontFamily: FONT.displaySemi,
    color: C.ink,
    letterSpacing: -0.2,
    lineHeight: 21,
  },

  option: { borderWidth: 1.5, paddingVertical: 13, paddingHorizontal: 14, borderRadius: RADIUS.sm },
  optionText: { fontSize: 14, fontFamily: FONT.bodyMed, lineHeight: 20 },

  verdict: { marginTop: 11, fontSize: 12.5, fontFamily: FONT.bodySemi },
});
