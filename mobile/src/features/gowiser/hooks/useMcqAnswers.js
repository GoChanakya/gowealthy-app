import { useState, useCallback } from 'react';
import { hapticError, hapticSuccess } from '../../../lib/haptics';
import { soundCorrect, soundWrong } from '../../../lib/sound';

/**
 * One-shot answer state for a quiz slide: `{ [questionIndex]: { selected, isCorrect } }`.
 * Answering is final — re-taps on an answered question are ignored.
 *
 * `onAnswer` runs alongside the state update so the story reader can swallow
 * the tap before its page-turn handler sees it.
 */
export function useMcqAnswers({ onAnswer } = {}) {
  const [answers, setAnswers] = useState({});

  const answer = useCallback(
    (questionIndex, optionIndex, isCorrect) => {
      if (answers[questionIndex] !== undefined) return;
      setAnswers((prev) => {
        if (prev[questionIndex] !== undefined) return prev;
        return { ...prev, [questionIndex]: { selected: optionIndex, isCorrect } };
      });
      if (isCorrect) {
        hapticSuccess();
        soundCorrect();
      } else {
        hapticError();
        soundWrong();
      }
      onAnswer?.();
    },
    [answers, onAnswer]
  );

  return { answers, answer };
}
