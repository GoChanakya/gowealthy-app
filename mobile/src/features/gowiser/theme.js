import { StyleSheet, Platform } from 'react-native';
import { C, FONT, RADIUS } from '../../lib/ui-kit';

/**
 * Ember-forge patterns used by more than one GoWiser component. Anything used
 * by a single component stays in that component's own StyleSheet.
 *
 * Tokens themselves are never redefined here — always import C/FONT/RADIUS
 * from src/lib/ui-kit so gowiser can't drift from the questionnaire.
 */
export { C, FONT, RADIUS };

/** Vertical offset for absolutely-positioned top chrome, matching kitStyles.topbar. */
export const TOP_INSET = Platform.OS === 'ios' ? 52 : 28;

export const gwStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },

  /** Glass pill — the back button, step tag, and slide counter all share it. */
  glassPill: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
  },

  /** Gold-outlined pill used for every XP figure. */
  xpPill: {
    backgroundColor: 'rgba(247,200,90,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(247,200,90,0.45)',
    borderRadius: 999,
  },
  xpPillText: { fontFamily: FONT.bodyBold, color: C.gold, letterSpacing: 0.4 },

  /** Card surface matching kitStyles.choiceCard. */
  surfaceCard: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: RADIUS.md,
  },

  /** Ember glow under primary gradient buttons. */
  emberGlow: {
    shadowColor: C.o,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  h2: {
    fontFamily: FONT.display,
    color: C.ink,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
  },
  body: { fontFamily: FONT.body, color: C.muted, fontSize: 13.5, lineHeight: 20 },
});
