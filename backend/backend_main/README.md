# backend-main

A private Cloud Run service (project `gochanakya-main`, region `asia-south1`). Every day at 01:00 IST, it builds every fund-card dataset from `gs://mf-data-public/nav_history.parquet` and `Scheme Master.csv`, and writes them to `gs://mf-data-public/backend_main_kartik/`. Cloud Scheduler triggers it by calling `POST /run`. A full run takes about 40 s and peaks at about 1.8 GB of memory.

It replaces `returns-calc`. The returns output is byte-for-byte the same JSON, at the same path.

## Output
Each dataset always writes `backend_main_kartik/<dataset>/latest/`, overwritten every run.

For datasets that keep history, dated copies are grouped by month:
- `backend_main_kartik/<dataset>/history/YYYY-MM/YYYY-MM-DD/`

`fund_cards` and `nse_schemes` are **latest-only** and do not write history copies.

Each written location gets three files:
- `<dataset>.json` for the app, keyed by `scheme_code`.
- `<dataset>.parquet`, a flat table.
- `<dataset>.xlsx`, a readable Excel copy with an **About** sheet explaining the method.

| Dataset | Funds (25 Sep 2026) | What it holds |
|---|---|---|
| `returns` | 8,636 (every plan) | NAV and 3M/6M/1Y point-to-point returns (unchanged from returns-calc) |
| `category` | 2,128 | Name, primary plan, AMC (plus short name), GoChanakya category, benchmark, launch date, and every plan of the fund. `plan_map.parquet` maps any plan code to its fund |
| `batting_average` | 1,966 | From `monthly_returns`: each of the last 12 months as 1 (beat its category's average) or 0 (didn't), plus 36-month totals |
| `rank_momentum` | 1,944 | 12 month-end snapshots of rank / total (rolling 6-month return within its category); the last 6 month-ends separately; rank now vs 6 months ago (`moved_6m`) |
| `sip_3y` | 1,392 | ₹5,000/month for 36 months: invested, value today, gain, vs a 3.5% savings account |
| `stress_events` | 2,128 | 6 market events: fall %, months to recover, or % recovered so far |
| `recovery_speed` | 2,128 (1,824 with both bars) | This fund's typical recovery months vs its category in the **same** events, a per-event comparison, events still recovering, plus resilience-score-v2 figures for reference |
| `aum` | 1,636 on cards (May 2026 test file) | Every row of the latest monthly `aum/YYYY-MM.parquet` (chosen by file name), mapped to its fund; `aum_lakhs` and `fund_age_years` go on the cards |
| `nse_schemes` | 1,863 on cards | Every NSE order code, matched by ISIN to its AMFI plan code and fund; the card carries all 43 columns of the selected order code |
| `fund_cards` | 2,128 | Everything above combined into one card per fund (schema `fund_card.schema.json` v1.1) |

A "fund" is its **primary plan** (`isprimary_v1 = Y`, Regular Growth) that has had a NAV in the last 10 days. `returns` covers every plan. To go from any plan code (Direct, IDCW…) to its fund card, use `category/latest/plan_map.parquet`, or the `plans` list in `category.json`.

## Methods
All of these are rebuilt from NAV history. For funds without a face-value change, each one was checked against the existing service's output:

| Section | Method | Check against the existing service |
|---|---|---|
| Returns | Latest NAV ÷ NAV on the last date on or before the date 3/6/12 months earlier − 1 | Identical JSON to returns-calc (8,636 funds) |
| Batting | Read from `monthly_returns` (1 = the fund's month return is above the average of all funds in the same `GoChanakya Short Code`, 0 = not). Face-value months are corrected and that category-month's average is recalculated from the same file. Single-fund categories are left empty | 60,155 untouched fund-months 100% identical; 37 face-value months corrected (930 category-months recalculated) |
| Momentum | Rolling 6-month return at each month-end, ranked within `GoChanakya Short Code` (1 = best). Uses the same shortlist of funds as momentum-rank. `moved_6m` = rank 6 months ago − rank now (positive = climbed) | 100% identical ranks on the original NAVs and the same categories |
| SIP 3Y | Last NAV of each of the 36 completed months before the latest NAV month, valued at the latest NAV | 1,359 of 1,392 identical to the rupee; all 33 differences are face-value fixes |
| Stress events | Start NAV = last NAV on or before the event start (within 7 days). Fall = lowest NAV to the event end. Recovery = first date after the low when NAV is back to the start NAV; months = days ÷ 30.44 | 100% identical statuses and recovery months (5,574 fund-events) |
| Recovery speed | Fund: median recovery months over the events it recovered from (1 or more; `events_used` says how many). Category: for those same events, the median recovery of funds in the same `GoChanakya Short Code` (at least 3 per event), then the median across events — so young funds aren't compared with older, slower crashes | New. Resilience-score-v2's own "median recovery" is about 3 days because it counts every small dip, so it is kept only as a reference |

**Differences from the existing services, all deliberate:**
1. **Face-value changes are fixed everywhere.** A one-day NAV move within 5% of ×10/÷10 or ×100/÷100 rescales the older NAVs. The existing files show these as fake losses: 33 SIP values down to −85%, a −90.8% "fall" for the ICICI BSE 500 ETF in 2021, and 7 fake −90% falls in the 2026 event.
2. **Other jumps are handled too.** A bad NAV that bounces back within 3 days is dropped. A NAV that lands on exactly 10/100/1,000 after a jump is treated as a reset, and no calculation spans it.
3. **The 2026 Iran event gets a recovery.** The existing file skips it. Now 1,687 funds are recovered and 285 are still recovering.
4. **Categories come from today's Scheme Master.** 6 funds have changed category since momentum-rank last ran on 5 Sep.
5. **Batting months are 1/0 and single-fund categories are left empty.** In `monthly_returns` a fund alone in its category is compared with itself and always gets 0 (18 funds).
6. **Everything refreshes daily.** Momentum and resilience used to update monthly; fund_card last updated 1 Sep.

## fund_cards.json (contract v1.1)
The same shape as the agreed front-end contract, with these changes:
- **`sections_as_of`:** each section's as-of date.
- **Not produced yet:** `persona`, `personality_match` and `hook` are `null`, and `alternates` is `[]`.
- **Not enough history:** `batting_average`, `sip_3y` and `rank_momentum` are `null` when a fund doesn't have enough history.
- **Not-applicable stress events** carry a `reason`: `launched_after`, `no_data` or `nav_reset`. On today's data, all of them are `launched_after`.

## Inputs
| Setting | Default |
|---|---|
| `SRC_URI` | `gs://mf-data-public/nav_history.parquet` |
| `SCHEME_MASTER_URI` | `gs://mf-data-public/Scheme Master.csv` |
| `MONTHLY_RETURNS_URI` | `gs://mf-data-public/monthly_returns/monthly_returns_latest.parquet` (batting; if unreadable, batting is worked out from NAV month-ends) |
| `MOMENTUM_UNIVERSE_URI` | `gs://mf-data-public/momentum-rank/latest_rank_momentum.csv` (fund list only; if unreadable, all funds are ranked) |
| `RESILIENCE_URI` | `gs://mf-data-public/resilience-score-v2/latest_scores.parquet` (reference figures; optional) |
| `AUM_PREFIX` | `gs://mf-data-public/aum` (latest `YYYY-MM.parquet` by name; warns if it has under 80% of the previous month's rows) |
| `NSE_URI` | `gs://mf-data-public/nse-schemes/funds.json` |
| `DST_ROOT` | `gs://mf-data-public/backend_main_kartik` |

## Files
- `core.py`: settings, file access, NAV loading, jump cleaning, writer.
- `metrics.py`: one function per dataset.
- `cards.py`: builds the combined card.
- `extras.py`: AUM and NSE loading and matching.
- `main.py`: runs everything and writes it; the Flask `/run` endpoint.
- `test_backend.py`: 18 tests.
- `verify_against_sources.py`: compares the live output with the existing services.

## AUM and NSE on the card
- `aum`: `aum_lakhs`, `fund_age_years`, `as_on_date`, `start_date` from the latest monthly AUM file (null if the fund isn't in it). The file changes monthly; the service reads the latest every day, so the card only changes when a new month arrives.
- `nse`: all 43 columns of one NSE order code (also in the fund_cards Excel/Parquet as `nse_*` / "NSE ...") for the primary plan's ISIN. Preference: still live (closed NFO codes last) > normal settlement over the Rs 2 lakh L0/L1 codes > purchase / redemption / SIP allowed > DP mode > closest name > newest. Null for funds not on NSE (mostly ETFs). On the 26 Sep file: 146 funds have only closed codes and 21 only L0/L1 codes; check `maturity_date` and `settlement_type` before offering an order.
- Every plan's order codes (Direct, IDCW payout / reinvestment…) are in `nse_schemes.json`, keyed by AMFI plan code; `category/plan_map.parquet` links any plan to its fund.
