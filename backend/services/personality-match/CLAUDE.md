# Personality Match — working context

GoWealthy batch job: screen the latest fund cards → persona-score the shortlist →
publish to `gs://mf-data-public/shortlisted_schemes/`. Read README.md for modules,
sources, outputs and commands. All rules live in `scheme_config_master.yaml`.

## Owner preferences
- GCP/Firebase deployments: region `asia-south1` only (project `gochanakya-main`).
- Python: scalable, vectorised, minimal CPU, no excess variables. If an instruction
  is vague, ask before finalising.

## Business rules agreed with the owner (do not change without asking)
- Universe: EQS* and HYB* only, plus OTH-EQS (index) and COM-FFD (gold FoF, "COM*"/"Gold")
  for basket slots; DES-LIQ only for the buffer. Never ELSS. ETFs excluded (no SIP).
- Screening (in this order): category in universe → `nse_purchase_allowed = Y` →
  top half of category by **latest month** rank (`rank_now <= rank_total_now / 2`).
  Categories with no ranks at all are not rank-filtered.
- Persona scoring runs on the shortlist only, and only where latest-month AUM is present
  (owner, 2026-10-10; the owner plans a 3-month AUM look-back later).
- Fund count by monthly SIP: <1k=1, 1k–5k=2, 5k–10k=3, 10k–20k=5, 20k–35k=6, 35k+=7.
  1–3 fund baskets take the first N slots of the 5-fund template.
- Slot templates per persona (5 / 6 / 7 funds) are in `basket.personas` and were given
  explicitly by the owner, e.g. Realistic Guardian at 5 drops Mid Cap, at 7 adds Flexi;
  Inspiring Storyteller/Enigmatic Sage add Multicap at 6 and Index at 7; Supreme Ruler/
  Bold Pioneer drop a sectoral at 5 and add one at 7; Masterful Strategist adds Small at 6
  and 1 Sectoral at 7; Noble Diplomat adds Mid at 6 and Gold at 7.
- Suitability (owner, 2026-10-10): every fund gets 8 persona scores = 100 x weighted
  components (consistency, rank momentum, resilience, AUM, age); weights in
  `personas.*.suitability`. The same score picks the fund in each basket slot and is the
  fund-card match %. No calibration layer any more.
- Components (owner, 2026-10-16):
  - Consistency = "Score 36M (%)" = months beating the category / months counted (36M).
  - Rank momentum = 65% x (total - latest rank) / total + 35% x max(oldest - latest of the
    last 3 monthly 6M-return ranks, 0) / total (a fall in rank adds nothing).
  - Resilience = per stress event, within the GOC short code, (n - rank + 1) / n on fall and
    on recovery; fall/recovery 50/50 is OUR assumption (owner did not split); still-recovering
    funds rank below recovered ones; missing events skipped and weights renormalised; a fund
    alone in its category gets 0.5. Event weights: Iran 30, FII 25, Covid 25, IL&FS 10,
    Demonetisation 5, Yuan 5.
  - AUM and age = percentile within the fund's own GOC short code.
- Tiers (owner) = number of schemes set by monthly SIP. Baskets are ordered by the owner's
  risk ladder (`basket.risk_order`); smaller tiers keep the lowest-risk slots. Ladder code
  fixes: EQS-LMC->EQS-LMF, EQS-MLT->EQS-MUC, COM-GLD->COM-FFD, OTH-OTH dropped (ETF).
- Minimum fund age = months since launch: Large, Large & Mid, Flexi 24; Small Cap 36;
  otherwise 24 for Realistic Guardian & Prudent Treasurer, 18 for others; 24 for the buffer.
- Equal split, rounded down to ₹100, remainder to the first fund. Fund must have
  NSE SIP allowed and minimum investment ≤ its share.
- AMC limit (owner, 2026-10-10): 1 per AMC in every basket; repeated slots from
  different AMCs.
- Buffer/emergency fund is a separate monthly SIP into one DES-LIQ fund, on top of the
  basket, ranked on consistency + AUM, then lowest minimum investment.
- Baskets are goal-agnostic: units are pooled and allocated to goals downstream
  (owner rejected the scheme-to-goal mapping approach).
- Capacity blend and risk caps (69/54) still adjust fund-card scores per user; they do
  not change basket slots.
- Fund-card listings use FIXED POSITIONS (owner, 2026-10-03): one card per slot of the
  persona's template at the user's SIP band, each filled by the best fund of that slot's
  own category (`positions` in shortlisted_schemes.json, built by `persona_positions`),
  with the next 2 of the same category as switch alternates. Funds are never compared
  across categories. The ranked `rank_funds` listing is a fallback only.
- INDEX slot = broad-market indices only (Nifty 50 / Next 50 / 100 / 200 / 500, Sensex,
  BSE 100–1000, Total Market) via `name_include` / `name_exclude`; no size, factor or
  sector indices.
- Owner-approved template fills (2026-10-03): Realistic Guardian at 5 drops Mid Cap;
  Storyteller/Sage add Multi at 6 and Index at 7; Ruler/Pioneer drop a Sectoral at 5
  and add one at 7.

## Data facts (live files as of 2026-10-02)
- `fund_cards.parquet`: 2,133 rows, one per scheme (mostly Regular plans), flat columns
  (`rank_now`, `rank_total_now`, `rank_1m_ago`…, `aum_lakhs`, `fund_age_years`, `nse_*`).
- `aum.parquet` has no rows for whole AMCs (Aditya Birla, Quant, Bank of India, Mahindra
  Manulife, …) → 103 shortlisted funds have no age; Scheme Master `Launch Date` is the
  fallback. Card `aum_lakhs` matches `aum.parquet` only ~64% — `aum.parquet` wins.
- Funnel: 2,133 → 498 shortlisted (384 scored, 11 buffer, 103 AGE_UNKNOWN).
- This sandbox could not reach GCS; the live run used manually uploaded parquets.
  `returns.parquet` and `sip_3y.parquet` schemas were never seen (column matching is
  best-guess, skipped with a warning if nothing matches).

## Open questions for the owner
1. (Resolved 2026-10-03: INDEX restricted to broad-market indices.)
2. Minimum SIP: cards only have NSE lump-sum minimums. Currently
   `nse_additional_purchase_min_amount`, falling back to `nse_new_purchase_min_amount`
   (`sources.fund_cards.min_investment_columns`). Confirm, or point to an NSE SIP minimum.
3. Fix the AUM pipeline's missing AMCs upstream.

## Next steps
- Deploy the Cloud Run Job (README) in asia-south1; first run should confirm all GCS
  sources load and the "shortlist coverage" log line.
- Move the Node upload service to `shortlisted_schemes/latest/shortlisted_schemes.json`,
  then set `outputs.legacy_scores_prefix: null`.
