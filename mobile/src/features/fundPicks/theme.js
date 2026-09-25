import { FONT } from '../../lib/ui-kit';

/**
 * "Ember forge, minimal" tokens for the fund picks screen.
 *
 * These are deliberately separate from ui-kit's C: the fund-card design was
 * signed off with its own warmer, flatter palette (solid cards, no glass).
 * Fonts come from ui-kit — Space Grotesk stands in for Fraunces as the display
 * face and Inter for DM Sans, so no extra font packages are needed.
 */
export const P = {
  page: '#0B0908',
  card: '#141110',
  cardBorder: 'rgba(255,255,255,0.05)',
  panel: '#161210',
  divider: 'rgba(255,255,255,0.06)',
  faint: 'rgba(255,255,255,0.08)',

  text: '#F4ECE4',
  textSecondary: '#A3978D',
  textDim: '#7F746B',
  textSoft: '#C9BEB4',

  orange: '#FF6B1F',
  onOrange: '#1A0E06',
  gold: '#F2B544',
  goldLight: 'rgba(242,181,68,0.22)',
  goldPale: '#FFD9A0',

  gain: '#8FD9A8',
  loss: '#E8897C',
};

export const F = {
  display: FONT.display,
  displaySemi: FONT.displaySemi,
  body: FONT.body,
  bodyMed: FONT.bodyMed,
  bodySemi: FONT.bodySemi,
  bodyBold: FONT.bodyBold,
};

/** Spread into any Text style that shows numbers so columns line up. */
export const TABULAR = { fontVariant: ['tabular-nums'] };

export const CARD_RADIUS = 26;
export const MIN_TOUCH = 44;
