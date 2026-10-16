import { FONT } from '../../lib/ui-kit';

/**
 * "Ember forge, quiet" tokens for the fund picks screen.
 *
 * Same warm-dark family as ui-kit's C, but deliberately muted: this screen
 * shows money, so colour is reserved for meaning. One restrained amber accent
 * for "this fund / you", soft green and red for gains and losses, and
 * everything else in warm neutrals. No glows, no saturated fills.
 * Fonts come from ui-kit — Space Grotesk for display, Inter for body.
 */
export const P = {
  page: '#0A0908',
  card: '#121010',
  cardBorder: 'rgba(255,255,255,0.06)',
  panel: '#181514',
  divider: 'rgba(255,255,255,0.06)',
  faint: 'rgba(255,255,255,0.08)',

  text: '#F2EDE7',
  textSoft: '#CDC5BC',
  textSecondary: '#9E958D',
  textDim: '#756C65',

  // Single accent. `gold` keeps its name so search/switch panels pick it up.
  gold: '#D4A55E',
  goldLight: 'rgba(212,165,94,0.12)',
  goldLine: 'rgba(212,165,94,0.30)',
  goldPale: '#E7D2AE',

  gain: '#74C394',
  gainSoft: 'rgba(116,195,148,0.12)',
  loss: '#E2806F',
  lossSoft: 'rgba(226,128,111,0.12)',
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

export const CARD_RADIUS = 22;
export const MIN_TOUCH = 44;
