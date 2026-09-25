/**
 * Fund picks — the "Picked for you" recommendations shown after the
 * questionnaire.
 *
 *   contract/   fund_card.schema.json (v1.0, the API contract) + sample data
 *   api/        the only file that talks to the network; USE_MOCK lives here
 *   lib/        pure helpers: number formatting and the card's wording rules
 *   hooks/      screen state (switch / swap in / undo) and opening a fund
 *   components/ card, switch panel, search, one file per opened-card section
 *   screens/    composition
 *
 * Route: app/(gowealthy)/mf/picks.jsx
 */
export { default as FundPicksScreen } from './screens/FundPicksScreen';
