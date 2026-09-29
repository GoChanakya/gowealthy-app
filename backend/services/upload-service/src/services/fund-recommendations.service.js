import { parse } from "csv-parse/sync";
import { config } from "../config.js";
import { loadFundData } from "../repositories/fund-data.repository.js";

export const USER_PERSONAS = Object.freeze({
    LLL: "Realistic Guardian",
    LHL: "Prudent Treasurer",
    HLL: "Inspiring Storyteller",
    HHL: "Noble Diplomat",
    LHH: "Masterful Strategist",
    LLH: "Enigmatic Sage",
    HLH: "Supreme Ruler",
    HHH: "Bold Pioneer",
});

const PERSONA_ALIASES = new Map(
    Object.entries(USER_PERSONAS).flatMap(([code, label]) => [
        [code.toLowerCase(), { code, label }],
        [label.toLowerCase(), { code, label }],
        [label.toLowerCase().replaceAll(" ", "_"), { code, label }],
    ]),
);

const SCORE_BANDS = [
    [85, "GREAT", "Great match"],
    [70, "GOOD", "Good match"],
    [55, "FAIR", "Fair match"],
    [40, "STRETCH", "Stretch match"],
    [0, "NOT", "Low match"],
];

export class RecommendationError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = "RecommendationError";
        this.status = status;
    }
}

export function resolveUserPersona(value) {
    const normalized = String(value ?? "").trim().toLowerCase();
    const persona = PERSONA_ALIASES.get(normalized);
    if (!persona) {
        throw new RecommendationError("A valid persona_code is required", 400);
    }
    return persona;
}

export function parseSchemeMaster(csv) {
    return parse(csv, {
        bom: true,
        columns: (headers) => headers.map((header) => header.trim()),
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
    });
}

function text(value, fallback = "") {
    const result = String(value ?? "").trim();
    return result || fallback;
}

function number(value, fallback = null) {
    if (value == null || value === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(value, fallback = null) {
    const parsed = number(value, fallback);
    return parsed == null ? fallback : Math.round(parsed);
}

function dateOnly(value, fallback = null) {
    const match = text(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match?.[0] ?? fallback;
}

function slug(value, fallback = "UNKNOWN") {
    return text(value, fallback)
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase() || fallback;
}

function shortAmcName(name) {
    return text(name, "Unknown AMC")
        .replace(/\bAsset Management Company\b/gi, "")
        .replace(/\bAMC\b/gi, "")
        .replace(/\bLimited\b/gi, "")
        .replace(/\bLtd\.?\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

function matchBand(score) {
    const [, code, label] = SCORE_BANDS.find(([minimum]) => score >= minimum);
    return { code, label };
}

function configuredBand(score, settings) {
    const row = settings?.bands?.find((candidate) => score >= Number(candidate.min));
    return row ? { code: row.code, label: row.label } : matchBand(score);
}

function firstUpperBand(value, rows) {
    return rows.find((row) => value <= Number(row.max));
}

function upperBandPoints(value, rows, fieldName) {
    const row = firstUpperBand(value, rows);
    if (!row) throw new RecommendationError(`No ${fieldName} band contains ${value}`, 400);
    return Number(row.points);
}

export function buildUserCapacityContext(profile, settings) {
    if (!settings) throw new RecommendationError("User-adjustment configuration is unavailable", 503);
    const age = integer(profile?.age);
    const living = text(profile?.living);
    if (age == null || !living) {
        throw new RecommendationError("profile.age and profile.living are required", 400);
    }

    const ageBand = settings.age_bands.find((row) => age >= Number(row.min) && age <= Number(row.max));
    if (!ageBand) throw new RecommendationError(`Age ${age} is outside the supported range`, 400);
    if (!(living in settings.capacity_points.living)) {
        throw new RecommendationError(`Unknown living value: ${living}`, 400);
    }

    let points = Number(ageBand.points);
    const capacity = settings.capacity_points;
    const emiRatio = number(profile.emi_ratio_pct);
    if (emiRatio == null) {
        points += Number(capacity.living[living] ?? settings.missing_field_points);
    } else {
        if (living !== "own_emi") points += Number(capacity.living[living] ?? settings.missing_field_points);
        points += upperBandPoints(emiRatio, capacity.emi_ratio_pct, "emi_ratio_pct");
    }

    if (profile.spouse_income != null) {
        points += Number(capacity.spouse_income[profile.spouse_income ? "has" : "none"]);
    }
    if (profile.dependents_non_earning != null) {
        points += upperBandPoints(
            Number(profile.dependents_non_earning), capacity.dependents_non_earning, "dependents_non_earning",
        );
    }
    if (profile.emergency_fund != null) {
        if (!(profile.emergency_fund in capacity.emergency_fund)) {
            throw new RecommendationError(`Unknown emergency_fund value: ${profile.emergency_fund}`, 400);
        }
        points += Number(capacity.emergency_fund[profile.emergency_fund]);
    }
    if (profile.health_insurance != null) {
        points += Number(capacity.health_insurance[profile.health_insurance ? "has" : "none"]);
    }

    const tier = settings.capacity_tiers.find((row) => points >= Number(row.min_points));
    const horizonYears = number(profile.horizon_years, Number(ageBand.default_horizon_years));
    const horizonGrade = settings.horizon.grade_by_years
        .find((row) => horizonYears >= Number(row.min_years))?.grade;
    const persona = resolveUserPersona(profile.persona_code);
    const willingness = Number(settings.willingness_by_persona[persona.code])
        - (profile.loss_reaction === "sell" ? Number(settings.gates.loss_reaction_sell_grade_penalty) : 0);
    const allowedGrade = Math.max(
        Number(settings.gates.min_allowed_grade),
        Math.min(willingness, Number(tier.capacity_grade), Number(horizonGrade)),
    );

    return {
        persona_code: persona.code,
        points,
        tier: Number(tier.tier),
        beta: Number(tier.beta),
        capacity_grade: Number(tier.capacity_grade),
        horizon_years: horizonYears,
        horizon_grade: Number(horizonGrade),
        willingness_grade: willingness,
        allowed_grade: allowedGrade,
    };
}

function reasonForCode(code, settings) {
    for (const group of ["positive", "negative", "gate"]) {
        for (const reason of Object.values(settings?.reasons?.[group] ?? {})) {
            if (reason.code === code) return { code: reason.code, text: reason.text };
        }
    }
    return null;
}

export function adjustEngineMatch(engine, profile, settings) {
    const persona = resolveUserPersona(profile.persona_code);
    const personaScore = number(engine?.[`score_${persona.code}`]);
    const anchorScore = number(engine?.[`score_${settings.blend_anchor_persona}`]);
    if (engine?.status !== "SCORED" || personaScore == null || anchorScore == null) return null;

    const context = buildUserCapacityContext(profile, settings);
    const raw = (1 - context.beta) * personaScore + context.beta * anchorScore;
    const over = Number(engine.grade) - context.allowed_grade;
    const cap = over >= 2
        ? Number(settings.gates.grade_over_by_2plus_cap)
        : over === 1
            ? Number(settings.gates.grade_over_by_1_cap)
            : 100;
    const score = Math.floor(Math.min(raw, cap) + 0.5 + 1e-9);
    let userGate = null;
    if (cap < raw) {
        userGate = context.allowed_grade < context.willingness_grade ? "SAFETY_FIRST" : "RISKIER_THAN_YOU";
    } else {
        userGate = { GRADE_OVER: "RISKIER_THAN_YOU", COMPLEX: "NICHE_BET", HISTORY: "TOO_NEW" }[
            engine[`gate_${persona.code}`]
        ] ?? null;
    }

    const reasonCodes = userGate ? [userGate] : [];
    const stored = engine[`${score >= Number(settings.basket_min_score) ? "pos" : "neg"}_reasons_${persona.code}`];
    for (const code of Array.isArray(stored) ? stored : []) {
        if (!reasonCodes.includes(code)) reasonCodes.push(code);
        if (reasonCodes.length >= Number(settings.reasons.max)) break;
    }

    return {
        score,
        band: configuredBand(score, settings),
        reasons: reasonCodes.map((code) => reasonForCode(code, settings)).filter(Boolean),
        recommended: score >= Number(settings.recommend_floor),
        context,
    };
}

function monthSequence(count, endDate) {
    const anchor = new Date(`${endDate}T00:00:00Z`);
    if (Number.isNaN(anchor.valueOf())) return [];
    return Array.from({ length: count }, (_, index) => {
        const current = new Date(Date.UTC(
            anchor.getUTCFullYear(),
            anchor.getUTCMonth() - (count - index - 1),
            1,
        ));
        return current.toISOString().slice(0, 7);
    });
}

function datedRankTrail(rankMomentum, endDate) {
    const trail = Array.isArray(rankMomentum?.trail) ? rankMomentum.trail : [];
    const total = Math.max(1, integer(rankMomentum?.total_funds, 1));
    const months = monthSequence(trail.length, endDate);
    return trail
        .map((rank, index) => ({
            date: `${months[index]}-01`,
            rank: Math.min(total, Math.max(1, integer(rank, 1))),
            total,
        }))
        .filter((snapshot) => snapshot.date !== "undefined-01");
}

function battingHistory(batting, endDate) {
    const pattern = Array.isArray(batting?.win_pattern) ? batting.win_pattern : [];
    const months = monthSequence(pattern.length, endDate);
    return pattern.map((beat, index) => ({ month: months[index], beat: Boolean(beat) }));
}

function canonicalBattingHistory(batting) {
    if (!Array.isArray(batting?.monthly)) return [];
    return batting.monthly
        .filter((item) => /^\d{4}-(0[1-9]|1[0-2])$/.test(text(item?.month)))
        .map((item) => ({ month: text(item.month), beat: Boolean(number(item.beat, 0)) }));
}

function canonicalStressEvents(recovery) {
    if (!Array.isArray(recovery?.events)) return [];
    return recovery.events.map((event) => ({
        event_code: event.event_code,
        name: event.name,
        start_date: event.start_date,
        end_date: event.end_date,
        status: event.status,
        fall_pct: number(event.fall_pct),
        recovery_months: number(event.recovery_months),
        recovered_pct: number(event.recovered_pct),
    }));
}

function indexSchemeRows(rows) {
    return new Map(rows.map((row) => [text(row.Code), row]).filter(([code]) => code));
}

function cardScore(card, personaLabel) {
    if (card.__matchScore != null) return card.__matchScore;
    return Math.min(100, Math.max(0, integer(card?.gopersona_match?.by_user_persona?.[personaLabel], 0)));
}

function compareCards(a, b, personaLabel) {
    const scoreDiff = cardScore(b, personaLabel) - cardScore(a, personaLabel);
    if (scoreDiff) return scoreDiff;

    const aRank = integer(a?.rank_momentum?.rank_now, Number.MAX_SAFE_INTEGER);
    const bRank = integer(b?.rank_momentum?.rank_now, Number.MAX_SAFE_INTEGER);
    if (aRank !== bRank) return aRank - bRank;

    const returnDiff = number(b?.returns_pct?.y1, number(b?.persona?.ret_1y, -Infinity))
        - number(a?.returns_pct?.y1, number(a?.persona?.ret_1y, -Infinity));
    if (returnDiff) return returnDiff;
    return text(a?.scheme_code).localeCompare(text(b?.scheme_code), "en", { numeric: true });
}

function adaptCard(raw, schemeRow, persona) {
    const schemeCode = text(raw.scheme_code);
    const meta = raw.meta ?? {};
    const fundPersona = raw.persona ?? {};
    const canonical = raw.nav != null || raw.batting_average != null;
    const navDate = dateOnly(
        raw.nav?.date,
        dateOnly(meta.nav_date, dateOnly(raw.updated_at, new Date().toISOString().slice(0, 10))),
    );
    const nav = number(raw.nav?.value, number(meta.nav));
    const battingMonthly = canonical
        ? canonicalBattingHistory(raw.batting_average)
        : battingHistory(raw.batting, navDate);
    const score = cardScore(raw, persona.label);
    const schemeName = text(
        raw.name,
        text(
            schemeRow?.["Scheme NAV Name"],
            text(schemeRow?.["Scheme Name"], text(meta.scheme_name, `Scheme ${schemeCode}`)),
        ),
    );
    const amcName = text(raw.amc?.name, text(schemeRow?.AMC, text(meta.amc, "Unknown AMC")));
    const categoryLabel = text(
        raw.category?.label,
        text(
            schemeRow?.GOC_Category,
            text(schemeRow?.["Scheme Category"], text(meta.category, "Other")),
        ),
    );
    const categoryCode = text(
        raw.category?.goc_short_code,
        text(schemeRow?.["GoChanakya Short Code"], slug(categoryLabel)),
    );
    const installments = Math.max(1, integer(raw.sip_3y?.installments, integer(raw.wealth_3y?.months, 36)));
    const monthlyAmount = Math.max(1, number(raw.sip_3y?.monthly_amount, number(raw.wealth_3y?.monthly_amount, 5000)));
    const profileLabel = text(fundPersona.label, text(fundPersona.archetype, "Data-backed fund profile"));
    const profileDescription = text(
        fundPersona.description,
        text(
            fundPersona.one_liner,
            "Matched using its returns, consistency, momentum and recovery history.",
        ),
    );

    if (!schemeCode || nav == null || nav <= 0 || battingMonthly.length === 0) return null;

    return {
        scheme_code: schemeCode,
        ...(text(raw.isin, text(schemeRow?.["ISIN Growth/Div Payout"]))
            ? { isin: text(raw.isin, text(schemeRow?.["ISIN Growth/Div Payout"])) }
            : {}),
        name: schemeName,
        plan: text(raw.plan, text(meta.plan, text(schemeRow?.Schemetype, "Regular"))),
        amc: {
            code: text(raw.amc?.code, slug(amcName)),
            name: amcName,
            short_name: text(raw.amc?.short_name, shortAmcName(amcName)),
        },
        category: { goc_short_code: categoryCode, label: categoryLabel },
        hook: text(raw.hook, text(fundPersona.tagline, `${matchBand(score).label} for your GoPersona`)).slice(0, 48),
        nav: { value: nav, date: navDate },
        returns_pct: {
            m3: number(raw.returns_pct?.m3, number(fundPersona.ret_3m)),
            m6: number(raw.returns_pct?.m6, number(fundPersona.ret_6m)),
            y1: number(raw.returns_pct?.y1, number(fundPersona.ret_1y)),
        },
        personality_match: {
            score,
            band: raw.__matchBand ?? matchBand(score),
            ...(raw.__matchReasons?.length ? { reasons: raw.__matchReasons } : {}),
        },
        persona: {
            code: text(fundPersona.code, slug(profileLabel, "DATA_BACKED_PROFILE")),
            label: profileLabel,
            description: profileDescription,
        },
        batting_average: {
            window_months: battingMonthly.length,
            months_beat: Math.min(
                battingMonthly.length,
                Math.max(0, integer(raw.batting_average?.months_beat, integer(raw.batting?.wins, 0))),
            ),
            monthly: battingMonthly,
        },
        sip_3y: {
            monthly_amount: monthlyAmount,
            installments,
            ...(dateOnly(raw.sip_3y?.start_date) ? { start_date: dateOnly(raw.sip_3y.start_date) } : {}),
            ...(dateOnly(raw.sip_3y?.end_date) ? { end_date: dateOnly(raw.sip_3y.end_date) } : {}),
            invested: number(raw.sip_3y?.invested, number(raw.wealth_3y?.invested, monthlyAmount * installments)),
            current_value: number(raw.sip_3y?.current_value, number(raw.wealth_3y?.value, monthlyAmount * installments)),
        },
        rank_momentum: {
            basis: "rolling_6m_return",
            snapshots: Array.isArray(raw.rank_momentum?.snapshots)
                ? raw.rank_momentum.snapshots.map((snapshot) => ({
                    date: dateOnly(snapshot.date),
                    rank: Math.max(1, integer(snapshot.rank, 1)),
                    total: Math.max(1, integer(snapshot.total, 1)),
                }))
                : datedRankTrail(raw.rank_momentum, navDate),
        },
        recovery: {
            typical_months: number(
                raw.recovery?.typical_months,
                raw.recovery?.recovered ? number(raw.recovery?.months_to_recover) : null,
            ),
            category_typical_months: number(raw.recovery?.category_typical_months),
            events: canonicalStressEvents(raw.recovery),
        },
        alternates: [],
    };
}

function addAlternates(cards) {
    return cards.map((card) => ({
        ...card,
        alternates: cards
            .filter((candidate) => (
                candidate.scheme_code !== card.scheme_code
                && candidate.category.goc_short_code === card.category.goc_short_code
            ))
            .slice(0, 5)
            .map((candidate) => ({
                scheme_code: candidate.scheme_code,
                name: candidate.name,
                amc_short_name: candidate.amc.short_name,
                personality_match: candidate.personality_match.score,
                returns_1y_pct: candidate.returns_pct.y1,
            })),
    }));
}

export function buildRankedCatalogue({
    cards,
    schemeMasterCsv,
    scoreRows = [],
    scoreMetadata = {},
    personaCode,
    userProfile = null,
}) {
    const persona = resolveUserPersona(personaCode);
    const rowsByCode = indexSchemeRows(parseSchemeMaster(schemeMasterCsv));
    const engineByCode = new Map(
        (scoreRows ?? []).map((row) => [text(row.scheme_code), row]).filter(([code]) => code),
    );
    const engineAvailable = engineByCode.size > 0;
    const scoredCards = cards
        .map((card) => {
            const engine = engineByCode.get(text(card.scheme_code));
            const calibrated = number(engine?.[`score_${persona.code}`]);
            const adjusted = userProfile && scoreMetadata.userAdjustment
                ? adjustEngineMatch(engine, { ...userProfile, persona_code: persona.code }, scoreMetadata.userAdjustment)
                : null;
            return {
                ...card,
                __matchScore: adjusted?.score ?? (calibrated == null
                    ? cardScore(card, persona.label)
                    : Math.min(100, Math.max(0, integer(calibrated, 0)))),
                __matchBand: adjusted?.band,
                __matchReasons: adjusted?.reasons,
                __recommended: adjusted?.recommended,
                __engineStatus: engine?.status,
                __autoRecommend: engine?.auto_recommend,
            };
        })
        .filter((card) => !engineAvailable || (
            card.__engineStatus === "SCORED"
            && card.__autoRecommend !== false
            && card.__recommended !== false
        ));
    const rankedRaw = scoredCards.sort((a, b) => compareCards(a, b, persona.label));
    const adapted = rankedRaw
        .map((card) => adaptCard(card, rowsByCode.get(text(card.scheme_code)), persona))
        .filter(Boolean);
    return { persona, cards: addAlternates(adapted) };
}

export async function getFundRecommendations({
    personaCode,
    userProfile = null,
    limit = config.fundRecommendations.topLimit,
}) {
    const data = await loadFundData();
    const catalogue = buildRankedCatalogue({ ...data, personaCode, userProfile });
    const safeLimit = Math.min(50, Math.max(1, integer(limit, config.fundRecommendations.topLimit)));
    const funds = catalogue.cards.slice(0, safeLimit);
    if (funds.length === 0) throw new RecommendationError("No eligible fund recommendations are available", 503);

    return {
        schema_version: "1.1",
        as_of_date: funds.map((fund) => fund.nav.date).sort().at(-1),
        user: { persona_code: catalogue.persona.code, persona_label: catalogue.persona.label },
        funds,
    };
}

export async function getFundCard({ schemeCode, personaCode, userProfile = null }) {
    const data = await loadFundData();
    const catalogue = buildRankedCatalogue({ ...data, personaCode, userProfile });
    const fund = catalogue.cards.find((card) => card.scheme_code === String(schemeCode));
    if (!fund) throw new RecommendationError(`Fund card ${schemeCode} was not found`, 404);
    return fund;
}
