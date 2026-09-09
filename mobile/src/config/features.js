/**
 * Build variants.
 *
 * `full`  — everything. What you get from `npx expo start` locally.
 * `lite`  — the shipped app: dashboard + GoWiser + profile. Mutual Funds shows
 *           a coming-soon sheet and GoShares is unreachable.
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
  /** Real MF onboarding + trading. When false the Funds tab is a coming-soon sheet. */
  mutualFunds: IS_FULL,
  goShares: IS_FULL,
  /** Dev-only shortcuts into the flows that aren't in the shipped nav. */
  devDoor: IS_FULL,
};
