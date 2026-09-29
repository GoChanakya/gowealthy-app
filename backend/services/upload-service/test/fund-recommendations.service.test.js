import assert from "node:assert/strict";
import test from "node:test";
import {
    adjustEngineMatch,
    buildRankedCatalogue,
    buildUserCapacityContext,
    parseSchemeMaster,
    RecommendationError,
    resolveUserPersona,
} from "../src/services/fund-recommendations.service.js";

const userAdjustment = {
    blend_anchor_persona: "LLL",
    missing_field_points: 0,
    age_bands: [
        { min: 18, max: 25, points: 2, default_horizon_years: 10 },
        { min: 26, max: 35, points: 2, default_horizon_years: 10 },
        { min: 36, max: 45, points: 1, default_horizon_years: 10 },
        { min: 46, max: 55, points: 0, default_horizon_years: 8 },
        { min: 56, max: 65, points: -1, default_horizon_years: 6 },
        { min: 66, max: 120, points: -2, default_horizon_years: 4 },
    ],
    capacity_points: {
        living: { family: 1, renting: 0, own_emi: -1 },
        emi_ratio_pct: [
            { max: 30, points: 0 }, { max: 50, points: -1 }, { max: 999, points: -2 },
        ],
        spouse_income: { has: 1, none: 0 },
        dependents_non_earning: [{ max: 2, points: 0 }, { max: 99, points: -1 }],
        emergency_fund: { funded: 1, partial: 0, none: -1 },
        health_insurance: { has: 0, none: -1 },
    },
    capacity_tiers: [
        { tier: 4, min_points: 3, capacity_grade: 7, beta: 0 },
        { tier: 3, min_points: 1, capacity_grade: 7, beta: 0.15 },
        { tier: 2, min_points: -1, capacity_grade: 6, beta: 0.35 },
        { tier: 1, min_points: -99, capacity_grade: 5, beta: 0.55 },
    ],
    horizon: {
        grade_by_years: [
            { min_years: 7, grade: 7 }, { min_years: 5, grade: 6 },
            { min_years: 3, grade: 5 }, { min_years: 0, grade: 4 },
        ],
    },
    gates: {
        grade_over_by_1_cap: 69,
        grade_over_by_2plus_cap: 54,
        loss_reaction_sell_grade_penalty: 1,
        min_allowed_grade: 4,
    },
    bands: [
        { code: "GREAT", min: 85, label: "Great fit" },
        { code: "GOOD", min: 70, label: "Good fit" },
        { code: "FAIR", min: 55, label: "Fair fit" },
        { code: "STRETCH", min: 40, label: "A stretch for you" },
        { code: "NOT", min: 0, label: "Not suited to you" },
    ],
    recommend_floor: 40,
    basket_min_score: 55,
    reasons: {
        max: 2,
        positive: { growth: { code: "STRONG_CLIMB", text: "Strong growth" } },
        negative: { growth: { code: "LAGGING", text: "Trailing peers" } },
        gate: {
            grade_over: { code: "RISKIER_THAN_YOU", text: "Riskier than your comfort zone" },
            capacity: { code: "SAFETY_FIRST", text: "Your commitments call for steadier funds" },
        },
    },
    willingness_by_persona: {
        LLL: 6, LHL: 6, HLL: 6, HHL: 6, LHH: 7, LLH: 7, HLH: 7, HHH: 7,
    },
};

const schemeMasterCsv = `AMC,Code,Scheme Name,Scheme Category,GOC_Category,Scheme NAV Name,ISIN Growth/Div Payout,Schemetype,GoChanakya Short Code
Alpha AMC Limited,100001,Alpha Fund,Large Cap Fund,Large Cap,Alpha Fund - Regular Growth,INF000A01001,Regular,EQS-LRG
Beta AMC Limited,100002,Beta Fund,Large Cap Fund,Large Cap,Beta Fund - Regular Growth,INF000B01002,Regular,EQS-LRG
Gamma AMC Limited,100003,Gamma Fund,Flexi Cap Fund,Flexi Cap,Gamma Fund - Regular Growth,INF000C01003,Regular,EQS-FLX
`;

function sourceCard(schemeCode, scores, overrides = {}) {
    return {
        scheme_code: schemeCode,
        meta: {
            scheme_name: `Source ${schemeCode}`,
            amc: "Source AMC",
            category: "Source Category",
            plan: "Regular",
            nav: 123.45,
            nav_date: "2026-07-13",
        },
        persona: {
            archetype: "The Steady Compounder",
            tagline: "Calm, consistent, low-drama growth",
            one_liner: "A measured fund personality.",
            ret_6m: 5.3,
            ret_1y: 9.9,
        },
        gopersona_match: { by_user_persona: scores },
        wealth_3y: { invested: 180000, value: 205362, months: 36, monthly_amount: 5000 },
        batting: { wins: 2, total: 3, win_pattern: [1, 0, 1] },
        recovery: { months_to_recover: 8, recovered: true },
        rank_momentum: { rank_now: 4, total_funds: 20, trail: [9, 7, 4] },
        ...overrides,
    };
}

test("resolves all supported persona forms", () => {
    assert.deepEqual(resolveUserPersona("LHL"), { code: "LHL", label: "Prudent Treasurer" });
    assert.deepEqual(resolveUserPersona("prudent_treasurer"), { code: "LHL", label: "Prudent Treasurer" });
    assert.deepEqual(resolveUserPersona("Prudent Treasurer"), { code: "LHL", label: "Prudent Treasurer" });
    assert.throws(() => resolveUserPersona("unknown"), RecommendationError);
});

test("parses the Scheme Master header and rows", () => {
    const rows = parseSchemeMaster(`\uFEFF${schemeMasterCsv}`);
    assert.equal(rows.length, 3);
    assert.equal(rows[0]["GoChanakya Short Code"], "EQS-LRG");
});

test("ranks by the selected user persona and returns contract-ready cards", () => {
    const cards = [
        sourceCard(100001, { "Prudent Treasurer": 88 }),
        sourceCard(100002, { "Prudent Treasurer": 94 }, { rank_momentum: { rank_now: 2, total_funds: 20, trail: [8, 5, 2] } }),
        sourceCard(100003, { "Prudent Treasurer": 70 }),
    ];

    const result = buildRankedCatalogue({ cards, schemeMasterCsv, personaCode: "LHL" });

    assert.equal(result.persona.label, "Prudent Treasurer");
    assert.deepEqual(result.cards.map((card) => card.scheme_code), ["100002", "100001", "100003"]);

    const first = result.cards[0];
    assert.equal(first.name, "Beta Fund - Regular Growth");
    assert.equal(first.isin, "INF000B01002");
    assert.equal(first.category.goc_short_code, "EQS-LRG");
    assert.equal(first.personality_match.score, 94);
    assert.deepEqual(first.personality_match.band, { code: "GREAT", label: "Great match" });
    assert.equal(first.batting_average.monthly.length, 3);
    assert.equal(first.rank_momentum.snapshots.at(-1).rank, 2);
    assert.equal(first.sip_3y.current_value, 205362);
    assert.deepEqual(first.alternates.map((alternate) => alternate.scheme_code), ["100001"]);
    assert.deepEqual(first.recovery.events, []);
});

test("uses deterministic tie breakers", () => {
    const scores = { "Realistic Guardian": 80 };
    const cards = [
        sourceCard(100001, scores, { rank_momentum: { rank_now: 5, total_funds: 20, trail: [5] } }),
        sourceCard(100002, scores, { rank_momentum: { rank_now: 2, total_funds: 20, trail: [2] } }),
    ];

    const result = buildRankedCatalogue({ cards, schemeMasterCsv, personaCode: "LLL" });
    assert.deepEqual(result.cards.map((card) => card.scheme_code), ["100002", "100001"]);
});

test("prefers calibrated Python-engine scores over legacy card scores", () => {
    const cards = [
        sourceCard(100001, { "Prudent Treasurer": 99 }),
        sourceCard(100002, { "Prudent Treasurer": 20 }),
    ];
    const scoreRows = [
        { scheme_code: "100001", status: "SCORED", auto_recommend: true, score_LHL: 70 },
        { scheme_code: "100002", status: "SCORED", auto_recommend: true, score_LHL: 94 },
    ];

    const result = buildRankedCatalogue({ cards, schemeMasterCsv, scoreRows, personaCode: "LHL" });
    assert.deepEqual(result.cards.map((card) => card.scheme_code), ["100002", "100001"]);
    assert.deepEqual(result.cards.map((card) => card.personality_match.score), [94, 70]);
});

test("adapts the combined v1.1 fund-card shape returned by the new GCS object", () => {
    const card = {
        scheme_code: "100001",
        isin: "INF000A01001",
        name: "Alpha Fund",
        plan: "Regular - Growth",
        amc: { code: "alpha", name: "Alpha AMC Limited", short_name: "Alpha MF" },
        category: { goc_short_code: "EQS-LRG", label: "Large Cap Fund" },
        hook: null,
        nav: { value: 101.25, date: "2026-09-25" },
        returns_pct: { m3: 2.1, m6: 5.2, y1: 11.4 },
        personality_match: null,
        persona: null,
        batting_average: {
            window_months: 2,
            months_beat: 1,
            monthly: [{ month: "2026-07", beat: 1 }, { month: "2026-08", beat: 0 }],
        },
        sip_3y: { monthly_amount: 5000, installments: 36, invested: 180000, current_value: 211000 },
        rank_momentum: {
            basis: "rolling_6m_return",
            snapshots: [{ date: "2026-08-31", rank: 2, total: 30 }],
        },
        recovery: {
            typical_months: 4,
            category_typical_months: 5,
            events: [{
                event_code: "COVID_2020", name: "Covid", start_date: "2020-02-15",
                end_date: "2020-04-10", status: "recovered", fall_pct: 25,
                recovery_months: 5, recovered_pct: 100, reason: null,
            }],
        },
        alternates: [],
    };
    const scoreRows = [
        { scheme_code: "100001", status: "SCORED", auto_recommend: true, score_LHL: 93 },
    ];

    const result = buildRankedCatalogue({ cards: [card], schemeMasterCsv, scoreRows, personaCode: "LHL" });
    const fund = result.cards[0];
    assert.equal(fund.personality_match.score, 93);
    assert.equal(fund.nav.date, "2026-09-25");
    assert.equal(fund.batting_average.monthly.length, 2);
    assert.equal(fund.recovery.events.length, 1);
    assert.equal(fund.recovery.events[0].reason, undefined);
    assert.equal(fund.persona.label, "Data-backed fund profile");
});

test("builds capacity from age, housing and optional financial factors", () => {
    const young = buildUserCapacityContext(
        { persona_code: "HHH", age: 24, living: "family" }, userAdjustment,
    );
    assert.deepEqual(
        [young.points, young.tier, young.allowed_grade, young.beta],
        [3, 4, 7, 0],
    );

    const commitments = buildUserCapacityContext({
        persona_code: "HHH",
        age: 35,
        living: "own_emi",
        emi_ratio_pct: 45,
        spouse_income: true,
        dependents_non_earning: 3,
        emergency_fund: "none",
        health_insurance: false,
    }, userAdjustment);
    assert.deepEqual(
        [commitments.points, commitments.tier, commitments.allowed_grade, commitments.beta],
        [-1, 2, 6, 0.35],
    );
});

test("age, capacity and crash reaction can cap a high persona match", () => {
    const row = {
        status: "SCORED",
        grade: 7,
        score_HHH: 93,
        score_LLL: 80,
        gate_HHH: null,
        pos_reasons_HHH: ["STRONG_CLIMB"],
        neg_reasons_HHH: ["LAGGING"],
    };
    const adventurous = adjustEngineMatch(
        row, { persona_code: "HHH", age: 24, living: "family" }, userAdjustment,
    );
    assert.equal(adventurous.score, 93);
    assert.equal(adventurous.context.allowed_grade, 7);

    const constrained = adjustEngineMatch(row, {
        persona_code: "HHH",
        age: 62,
        living: "renting",
        health_insurance: false,
        loss_reaction: "sell",
    }, userAdjustment);
    assert.equal(constrained.score, 54);
    assert.equal(constrained.context.allowed_grade, 5);
    assert.equal(constrained.reasons[0].code, "SAFETY_FIRST");
});

test("personalized catalogue uses adjusted scores and removes low-fit funds", () => {
    const cards = [
        sourceCard(100001, { "Bold Pioneer": 90 }),
        sourceCard(100002, { "Bold Pioneer": 90 }),
    ];
    const scoreRows = [
        {
            scheme_code: "100001", status: "SCORED", auto_recommend: true, grade: 7,
            score_HHH: 93, score_LLL: 80, pos_reasons_HHH: ["STRONG_CLIMB"], neg_reasons_HHH: ["LAGGING"],
        },
        {
            scheme_code: "100002", status: "SCORED", auto_recommend: true, grade: 5,
            score_HHH: 75, score_LLL: 72, pos_reasons_HHH: ["STRONG_CLIMB"], neg_reasons_HHH: ["LAGGING"],
        },
    ];
    const result = buildRankedCatalogue({
        cards,
        schemeMasterCsv,
        scoreRows,
        scoreMetadata: { userAdjustment },
        personaCode: "HHH",
        userProfile: {
            persona_code: "HHH", age: 70, living: "renting", health_insurance: false,
        },
    });

    assert.deepEqual(result.cards.map((card) => card.scheme_code), ["100002", "100001"]);
    assert.deepEqual(result.cards.map((card) => card.personality_match.score), [73, 54]);
});
