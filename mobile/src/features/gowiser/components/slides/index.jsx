import React from 'react';
import { SLIDE_TYPE } from '../../lib/slides';
import IntroSlide from './IntroSlide';
import ContentSlide from './ContentSlide';
import SocialSlide from './SocialSlide';
import McqSlide from './McqSlide';
import EndSlide from './EndSlide';

/**
 * Maps a slide to its renderer. Adding a slide type means adding a component
 * here and a branch in `buildSlides` — nothing in the screen changes.
 */
export default function Slide({ slide, scrollHandlers, onOptionTap, alreadyEarned, onDone }) {
  if (!slide) return null;

  switch (slide.type) {
    case SLIDE_TYPE.INTRO:
      return <IntroSlide content={slide.content} />;

    case SLIDE_TYPE.CONTENT:
      return <ContentSlide content={slide.content} scrollHandlers={scrollHandlers} />;

    case SLIDE_TYPE.SOCIAL:
      return <SocialSlide content={slide.content} scrollHandlers={scrollHandlers} />;

    case SLIDE_TYPE.MCQ:
      return (
        <McqSlide
          content={slide.content}
          scrollHandlers={scrollHandlers}
          onOptionTap={onOptionTap}
        />
      );

    case SLIDE_TYPE.END:
      return <EndSlide content={slide.content} alreadyEarned={alreadyEarned} onDone={onDone} />;

    default:
      return null;
  }
}
