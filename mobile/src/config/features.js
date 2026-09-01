/**
 * Build variants.
 *
 * `full`  — everything. What you get from `npx expo start` locally.
 * `lite`  — the shipped app: dashboard + GoWiser + profile only. Mutual Funds
 *           shows a coming-soon sheet; GoShares, the product hub, the v1
 *           questionnaire and investments are unreachable.
 *
 * The variant is chosen at BUILD time, not runtime — `EXPO_PUBLIC_*` vars are
 * inlined into the bundle by Metro. eas.json sets it on the preview/production
 * profiles; running locally leaves it unset, so local is always `full`.
 *
 * To ship the full app instead, drop EXPO_PUBLIC_APP_VARIANT from eas.json.
 */
const VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'full';

export const IS_LITE = VARIANT === 'lite';
export const IS_FULL = !IS_LITE;

export const FEATURES = {
  /** The "Combine Holdings / Financial Plan / …" tile screen at (gowealthy)/index. */
  productHub: IS_FULL,
  /** Real MF onboarding + trading. When false the Funds tab is a coming-soon sheet. */
  mutualFunds: IS_FULL,
  goShares: IS_FULL,
  /** The original questionnaire, superseded by questionnaire-v2. */
  questionnaireV1: IS_FULL,
  investments: IS_FULL,
  /** Dev-only shortcuts into the parked flows, surfaced on the profile screen. */
  devDoor: IS_FULL,
};
