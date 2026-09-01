import { useRef, useCallback, useState } from 'react';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const LEFT_ZONE = width * 0.3;
const RIGHT_ZONE = width * 0.7;
/** Vertical travel past which a touch is a scroll, not a tap. */
const TAP_SLOP = 10;

/**
 * Instagram-style tap navigation: tap the left third to go back, the right
 * third to advance. The middle is dead space so long text stays readable.
 *
 * Guards against two false positives — a scroll gesture that ends inside a tap
 * zone, and a tap that was really meant for an MCQ option.
 */
export function useStoryTaps({ currentSlide, goToSlide }) {
  const [scrolling, setScrolling] = useState(false);
  const tapStartY = useRef(0);
  const childTapped = useRef(false);

  const onTouchStart = useCallback((event) => {
    tapStartY.current = event.nativeEvent.pageY;
  }, []);

  const onTouchEnd = useCallback(
    (event) => {
      if (scrolling || childTapped.current) return;
      if (Math.abs(event.nativeEvent.pageY - tapStartY.current) > TAP_SLOP) return;

      const { locationX } = event.nativeEvent;
      if (locationX < LEFT_ZONE) goToSlide(currentSlide - 1);
      else if (locationX > RIGHT_ZONE) goToSlide(currentSlide + 1);
    },
    [scrolling, currentSlide, goToSlide]
  );

  /** Spread onto any ScrollView inside a slide so dragging doesn't page. */
  const scrollHandlers = {
    onScrollBeginDrag: () => setScrolling(true),
    onScrollEndDrag: () => setTimeout(() => setScrolling(false), 100),
  };

  /** Call from an interactive child (e.g. an MCQ option) to swallow that tap. */
  const claimTap = useCallback(() => {
    childTapped.current = true;
    setTimeout(() => {
      childTapped.current = false;
    }, 300);
  }, []);

  return { onTouchStart, onTouchEnd, scrollHandlers, claimTap };
}
