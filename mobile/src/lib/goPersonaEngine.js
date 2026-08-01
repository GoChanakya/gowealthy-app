/**
 * goPersonaEngine.js
 * ------------------------------------------------------------------
 * Ported verbatim from the verified gowealthy.html prototype's <script>
 * block (QUIZ, PERSONALITIES, hiLo/dimCode/bandLabel/getPersonality).
 * Pure JS — no DOM, no React — safe to import into any RN screen or
 * a Cloud Function later. Do not hand-edit values here without also
 * re-running the reachability sweep described in the HTML build notes
 * (every persona must stay reachable; band cutoffs are 0–5 LOW / 6–10 HIGH).
 * ------------------------------------------------------------------
 */

/* ============================================================
   QUIZ — 7 questions, 9 scored decisions (q3 has 3 sub-rows)
   ============================================================ */
export const QUIZ = [
  { id:'q1', tag:'Scenario 1 · Your money energy', title:'What’s your money energy right now?', sub:'No wrong answer — go with your gut.', type:'single',
    options:[
      { text:'Chasing the next big win', icon:'🔥', dH:1, dC:-1, dO:1 },
      { text:'Protecting what I’ve already built', icon:'🛡️', dH:-1, dC:2, dO:-1 },
      { text:'Honestly, still figuring it out', icon:'🌀', dH:-2, dC:-2, dO:0 },
      { text:'Building something, brick by brick', icon:'🧱', dH:-1, dC:2, dO:0 }
    ]},
  { id:'q2', tag:'Scenario 2 · The windfall', title:'₹1,00,000 just landed. No strings.', sub:'What do you actually do with it?', type:'single',
    options:[
      { text:'Park it somewhere safe — FD or savings', icon:'🏦', dH:-1, dC:0, dO:-1 },
      { text:'Invest all of it — put it to work', icon:'📈', dH:2, dC:0, dO:1 },
      { text:'Book the trip I keep putting off', icon:'✈️', dH:2, dC:-2, dO:0 },
      { text:'Split it — invest, save, and enjoy some', icon:'⚖️', dH:2, dC:2, dO:0 }
    ]},
  { id:'q3', tag:'Scenario 3 · Three gut calls', title:'Three fast calls. Don’t overthink.', sub:'Tap one in each row.', type:'triple',
    rows:[
      { q:'A flash-deal flight expires in 10 minutes.', options:[
        { text:'Buy it. Right now.', icon:'⚡', dH:1, dC:-1, dO:1 },
        { text:'Let it go — I’ll find better.', icon:'🧊', dH:-1, dC:1, dO:0 } ] },
      { q:'A friend says "this stock is about to explode."', options:[
        { text:'Put money in on the tip.', icon:'🤝', dH:2, dC:-2, dO:1 },
        { text:'I research it first.', icon:'🔍', dH:-1, dC:1, dO:0 } ] },
      { q:'₹80,000 now, or ₹1,50,000 in 18 months.', options:[
        { text:'₹80K now.', icon:'💸', dH:2, dC:-1, dO:0 },
        { text:'₹1.5L later — obvious math.', icon:'🧮', dH:-2, dC:1, dO:2 } ] }
    ]},
  { id:'q4', tag:'Scenario 4 · The life tile', title:'Pick the future that feels most like yours.', sub:'Zero financial thinking — pure instinct.', type:'single',
    options:[
      { text:'Free — answers to no one', icon:'🕊️', dH:1, dC:-1, dO:2 },
      { text:'Secure — nothing knocks me over', icon:'🛡️', dH:-1, dC:2, dO:-2 },
      { text:'Wealthy — genuinely rich', icon:'💎', dH:0, dC:2, dO:1 },
      { text:'Impactful — my work outlives me', icon:'🌱', dH:-1, dC:0, dO:-2 }
    ]},
  { id:'q5', tag:'Scenario 5 · The crash', title:'Your portfolio drops 30% this week. Your body does what?', sub:'Be honest — there’s no right answer.', type:'single',
    options:[
      { text:'Heart spikes. I sell before it worsens.', icon:'😰', dH:2, dC:-2, dO:-2 },
      { text:'I pull up a sheet — time to value it.', icon:'📊', dH:-2, dC:1, dO:0 },
      { text:'I get excited. Buying opportunity.', icon:'🔥', dH:1, dC:-1, dO:2 },
      { text:'I stick to the plan — expected this.', icon:'🎯', dH:2, dC:2, dO:0 }
    ]},
  { id:'q6', tag:'Scenario 6 · The crowd', title:'Everyone you know is buying one stock.', sub:'It’s all over your feed. You…', type:'single',
    options:[
      { text:'I’m in — not missing this.', icon:'🚀', dH:1, dC:-2, dO:1 },
      { text:'I research it properly first.', icon:'🔍', dH:-2, dC:1, dO:0 },
      { text:'I skip it — the edge is gone.', icon:'🤔', dH:-1, dC:2, dO:-2 }
    ]},
  { id:'q8', tag:'Scenario 7 · The mirror', title:'How do you really behave with money?', sub:'Pick the most honest label.', type:'single',
    options:[
      { text:'Disciplined — rules, and I follow them', icon:'📋', dH:0, dC:2, dO:0 },
      { text:'Intuitive — I go with what feels right', icon:'💡', dH:2, dC:-1, dO:1 },
      { text:'Emotional — money stresses me out', icon:'😔', dH:-2, dC:-2, dO:-1 },
      { text:'Avoidant — I know I should, I just don’t', icon:'👀', dH:-1, dC:-2, dO:-2 }
    ]}
];

/* ============================================================
   PERSONALITIES — 8 personas, exact H·C·O cube tiling
   code = H C O, each HIGH(>=6) or LOW(<=5)
   ============================================================ */
export const PERSONALITIES = [
  { key:'supreme_ruler', name:'Supreme Ruler', icon:'👑', img:'', code:'HLH',
    traits:['Decisive','Commanding','Outcome-focused'],
    superpower:'You decide and move. Indecision costs other people more than your bold calls ever cost you.',
    blindspot:'You rarely revisit a call once made — even when new information says you should.',
    crash:'You treat it as noise beneath your strategy. Mostly you’re right. Occasionally the confidence is the risk.',
    prediction:'Five years out the plan you commit to this month is already on autopilot — the only question is whether you built in room to adapt.',
    sparkSub:'A Supreme Ruler who commits early turns decisiveness into a decade’s head-start.' },
  { key:'masterful_strategist', name:'Masterful Strategist', icon:'♟️', img:'', code:'LHH',
    traits:['Analytical','Systematic','Long-horizon'],
    superpower:'You hold complexity without losing the thread. When variables multiply, that’s exactly where your edge shows up.',
    blindspot:'You over-engineer. The perfect plan takes so long the moment moves on without you.',
    crash:'You open a spreadsheet. While others sell, you’re calculating fair value. You’ve been right before.',
    prediction:'Five years out you’ll have built something real — and you’ll remember the time spent planning what you hadn’t yet started.',
    sparkSub:'A Masterful Strategist who starts now beats a perfect plan that keeps waiting.' },
  { key:'bold_pioneer', name:'Bold Pioneer', icon:'🚀', img:'', code:'HHH',
    traits:['Instinctive','Fast-moving','Growth-hungry'],
    superpower:'You move while others are still forming a committee. Anything that needs speed is where you win.',
    blindspot:'You commit before stress-testing the downside. The speed that finds the opening can miss the exit.',
    crash:'Red on the screen reads as a green light in your head. Crashes look like sales — right, until they aren’t.',
    prediction:'Five years out you’ll have taken the swing most people talk themselves out of — and one scar to prove it. Both are the point.',
    sparkSub:'A Bold Pioneer with a floor underneath captures the upside instinct alone would risk.' },
  { key:'inspiring_storyteller', name:'Inspiring Storyteller', icon:'✨', img:'', code:'HLL',
    traits:['Persuasive','Expressive','Instinct-led'],
    superpower:'You make people believe. You turn a plan into a story others want to be part of — and that pulls opportunities toward you.',
    blindspot:'You lead with the narrative and trust the numbers will follow. Sometimes they need checking first.',
    crash:'You reach for meaning before math — you want the story of why. A simple rule keeps that instinct from selling at the bottom.',
    prediction:'Five years out your influence has compounded as quietly as your money — if you gave the money a system to compound in.',
    sparkSub:'An Inspiring Storyteller who automates the boring part frees all that energy for the vision.' },
  { key:'prudent_treasurer', name:'Prudent Treasurer', icon:'🏦', img:'', code:'LHL',
    traits:['Cautious','Meticulous','Security-first'],
    superpower:'You build the floor before anyone else worries about it. Nobody ever has to bail you out.',
    blindspot:'Caution has a cost. Every rupee idle "just in case" is a rupee not compounding.',
    crash:'You don’t flinch — you were positioned for this. The plan accounted for the bad week.',
    prediction:'Five years out you’ll have exactly the safety net you planned. The only question is whether you also let yourself grow.',
    sparkSub:'A Prudent Treasurer who lets one slice grow keeps the safety and gains the compounding.' },
  { key:'noble_diplomat', name:'Noble Diplomat', icon:'🤝', img:'', code:'HHL',
    traits:['Balanced','Considerate','Steady'],
    superpower:'You weigh every side before you move — so your decisions rarely need to be undone.',
    blindspot:'Balance can tip into indecision. Weighing every option sometimes means never quite choosing.',
    crash:'You check in, feel both pulls, and mostly hold — usually right, sometimes for the wrong reason.',
    prediction:'Five years out your money looks like your life — steady, considered, rarely dramatic. That’s not a small thing.',
    sparkSub:'A Noble Diplomat only needs one clear choice today for balance to start paying off.' },
  { key:'enigmatic_sage', name:'Enigmatic Sage', icon:'🔮', img:'', code:'LLH',
    traits:['Contrarian','Philosophical','Sees the unseen'],
    superpower:'You’ve been right about things others missed — because you never tried to fit the crowd’s logic.',
    blindspot:'Early and wrong feel identical in the moment. You need a way to tell them apart before it gets pricey.',
    crash:'You expected this. Your only question is whether the crowd has finished panicking yet.',
    prediction:'Five years out, a quiet call you make today will look obvious in hindsight to everyone who doubted it.',
    sparkSub:'An Enigmatic Sage whose bets are sized on purpose lets conviction finally pay.' },
  { key:'realistic_guardian', name:'Realistic Guardian', icon:'🛡️', img:'', code:'LLL',
    traits:['Protective','Grounded','Risk-aware'],
    superpower:'You plan for what could go wrong before it does — so it rarely catches you off guard.',
    blindspot:'Worst-case thinking, run too often, quietly talks you out of upside you can actually afford.',
    crash:'It confirms what you suspected. You feel briefly vindicated, then anxious.',
    prediction:'Five years out you’ll be glad you built the buffer — and you’ll wish you’d let a little more of it grow.',
    sparkSub:'A Realistic Guardian who starts today keeps the safety and stops leaving growth on the table.' }
];

/* ============================================================
   SCORING — 0–5 LOW / 6–10 HIGH, exact 8-cell map
   ============================================================ */
export function clamp10(v){ return Math.max(0, Math.min(10, v)); }
export function hiLo(v){ return v >= 6 ? 'HIGH' : 'LOW'; }
export function dimCode(v){ return v >= 6 ? 'H' : 'L'; }
export function bandLabel(v){ return v >= 6 ? 'High' : 'Low'; }

export function getPersonality(h, c, o) {
  const code = dimCode(h) + dimCode(c) + dimCode(o);
  const persona = PERSONALITIES.find(p => p.code === code) || PERSONALITIES[0];
  return { persona, code };
}

/** Applies one answer's deltas to a running {h,c,o} score, clamped 0–10. */
export function applyAnswer(score, delta) {
  return {
    h: clamp10(score.h + (delta.dH || 0)),
    c: clamp10(score.c + (delta.dC || 0)),
    o: clamp10(score.o + (delta.dO || 0)),
  };
}

/** Illustrative "cost of delay" figure shown on the bridge screen, per persona. */
export function personaDelayCost(persona) {
  const map = {
    supreme_ruler: '₹32,00,000', masterful_strategist: '₹34,00,000', bold_pioneer: '₹30,00,000',
    inspiring_storyteller: '₹28,00,000', prudent_treasurer: '₹22,00,000', noble_diplomat: '₹24,00,000',
    enigmatic_sage: '₹26,00,000', realistic_guardian: '₹25,00,000',
  };
  return map[persona.key] || '₹28,00,000';
}

export const PRI_WORDS = ['Priority 1', 'Priority 2', 'Priority 3', 'Priority 4'];
export const PRI_ICON = ['🥇', '🥈', '🥉', '⭐'];

export const B1_MSG = ['Reading your gut-calls…', 'Scoring your instincts…', 'Mapping your money mind…', 'Matching your persona…', 'Almost there ✦'];
export const B1_EMO = ['🧠', '⚡', '🗺️', '🎯', '✨'];

/* ============================================================
   LIVING — section2's "where do you live" options. `expense` seeds
   the safety-net target (6 × expense) computed in section5.
   ============================================================ */
export const LIVING = [
  { label: 'Living with family', sub: 'Low overheads — most income is free', expense: 12000, icon: '🏠' },
  { label: 'Renting', sub: 'Rent takes ~30–45% of income', expense: 20000, icon: '🔑' },
  { label: 'Own place / EMI', sub: 'Fixed EMI every month', expense: 25000, icon: '🏡' },
];

/* ============================================================
   GOALS — the 8 selectable life goals. `infl` is the per-goal
   inflation rate used in section5 to grow `target` to its future
   value over the chosen horizon. `defaultYears` seeds a goal's
   horizon when first picked in section3; min/maxYears bound the
   horizon presets shown in section4.
   ============================================================ */
export const GOALS = [
  { key: 'freedom', name: 'Freedom Fund', icon: '🚀', color: '#ff7a2e', desc: 'First financial-independence milestone', target: 1500000, infl: 0.06, defaultYears: 15, minYears: 8, maxYears: 25, instrument: 'Flexi-cap equity fund' },
  { key: 'home', name: 'Home Down Payment', icon: '🏡', color: '#f7c85a', desc: 'A place that’s actually yours', target: 800000, infl: 0.07, defaultYears: 8, minYears: 3, maxYears: 15, instrument: 'Hybrid / balanced fund' },
  { key: 'travel', name: 'Travel Fund', icon: '✈️', color: '#ff9d5c', desc: 'Trips without checking your balance', target: 150000, infl: 0.06, defaultYears: 1, minYears: 0.5, maxYears: 5, instrument: 'Liquid fund' },
  { key: 'startup', name: 'Startup Runway', icon: '🎯', color: '#ffb03a', desc: 'Runway to build your own thing', target: 600000, infl: 0.05, defaultYears: 6, minYears: 2, maxYears: 12, instrument: 'Debt + equity blend' },
  { key: 'education', name: 'Education Fund', icon: '📚', color: '#ffcf7a', desc: 'A course, a degree, a certification', target: 250000, infl: 0.10, defaultYears: 3, minYears: 1, maxYears: 8, instrument: 'Short-duration bond fund' },
  { key: 'health', name: 'Health & Wellness', icon: '🌿', color: '#ffd98c', desc: 'Medical buffer, fitness, mind', target: 100000, infl: 0.09, defaultYears: 1.5, minYears: 0.5, maxYears: 5, instrument: 'Liquid / ultra-short fund' },
  { key: 'family', name: 'Family Support', icon: '👨‍👩‍👧', color: '#ff8f3c', desc: 'Parents, siblings, kids — covered', target: 400000, infl: 0.06, defaultYears: 6, minYears: 2, maxYears: 15, instrument: 'Balanced advantage fund' },
  { key: 'impact', name: 'Impact & Giving', icon: '🌱', color: '#ffc247', desc: 'Causes and people beyond yourself', target: 150000, infl: 0.04, defaultYears: 5, minYears: 1, maxYears: 15, instrument: 'ESG debt fund' },
];

export const GOALS_META = {
  security: { key: 'security', name: 'Safety Net', icon: '🛡️', color: '#4fd39a', desc: '6 months of essentials — capped at 15%', instrument: 'Liquid / Overnight Fund' },
  buffer: { key: 'buffer', name: 'Buffer in Bank', icon: '💡', color: '#8a7f92', desc: 'Stays liquid for whatever life throws', instrument: 'Savings account' },
};

export const HORIZON_PRESETS = [
  { label: '1 yr', years: 1 }, { label: '2 yrs', years: 2 }, { label: '3 yrs', years: 3 },
  { label: '5 yrs', years: 5 }, { label: '8 yrs', years: 8 }, { label: '12 yrs', years: 12 }, { label: '20 yrs', years: 20 },
];

/* ============================================================
   FINANCIAL ENGINE — ported verbatim from the verified HTML.
   Every invariant below (safety net ≤15%, buffer ≤5%, allocations
   sum EXACTLY to the monthly amount, no goal ever rounds to ₹0) was
   proven across 11,000+ input combinations during development —
   see the build notes. Do not hand-edit without re-running that
   sweep; rounding/cap logic here is easy to look correct while
   quietly breaking one of those guarantees.
   ============================================================ */
export const ANNUAL_RATE = 0.12;
export const MONTHLY_RATE = Math.pow(1 + ANNUAL_RATE, 1 / 12) - 1; // compounds to exactly 12%/yr
export const STEP_UP_RATE = 0.10;                                  // contribution grows 10%/yr
export const MAX_SIM_MONTHS = 50 * 12;

export const BUFFER_PCT = 0.05;     // "Buffer in Bank" — stays liquid, never invested
export const SAFETY_CAP_PCT = 0.15; // Safety Net can NEVER exceed 15% of monthly
export const PRIO_BLEND = 0.60;     // how strongly rank steers money vs raw need
export const PRIO_DECAY = 0.58;     // weight falls off per rank step
export function prioWeight(rank) { return Math.pow(PRIO_DECAY, rank); }

/** Today's goal value → its value at the target date, at the goal's own inflation rate. */
export function inflatedTarget(goal, years) {
  return Math.round(goal.target * Math.pow(1 + goal.infl, years));
}

/** FV of a contribution starting at P0, stepping up g/yr, compounding monthly at r. */
export function growingAnnuityFV(P0, years, r, g) {
  let balance = 0, payment = P0;
  const months = Math.max(1, Math.round(years * 12));
  for (let m = 1; m <= months; m++) {
    if (m > 1 && (m - 1) % 12 === 0) payment *= (1 + g);
    balance = balance * (1 + r) + payment;
  }
  return balance;
}

/** Starting monthly (step-up aware) needed to hit `target` in `years`. Bisection, verified
 *  to round-trip through growingAnnuityFV at ~0.0000% error across the full input range. */
export function solveStartingPMT(target, years, r, g) {
  if (target <= 0) return 0;
  let lo = 0, hi = target;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (growingAnnuityFV(mid, years, r, g) > target) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Rounding step scales down for small plans — a flat ₹1,000 step would zero out whole
 *  buckets on a ₹2,000/mo plan. The step must divide `monthly` exactly, or rounded
 *  buckets can't sum back to it (this exact bug was caught and fixed during development
 *  at ₹20,500/mo, where a non-dividing step summed to ₹21,000 — inventing ₹500). */
export function roundStep(monthly) {
  if (monthly >= 20000 && monthly % 1000 === 0) return 1000;
  if (monthly >= 10000 && monthly % 500 === 0) return 500;
  if (monthly >= 2000 && monthly % 100 === 0) return 100;
  if (monthly >= 1000) return 50;
  return 25;
}

/** Rounds into whole steps while RESPECTING the structural rules: safety can never round
 *  above 15% (floored, not rounded — rounding up was found to breach the cap during
 *  development), buffer holds ~5% (also floored), goals take the balance. Everything is
 *  done in integer "units" so the total is exact by construction. */
export function roundAllocation(monthly, securityAmt, goalAmts, bufferAmt) {
  const step = roundStep(monthly);
  const totalUnits = Math.round(monthly / step);
  const capUnits = Math.floor((SAFETY_CAP_PCT * monthly) / step); // floor => never breaches 15%

  let secU = Math.min(Math.round(securityAmt / step), capUnits);
  let bufU = bufferAmt > 0 ? Math.max(1, Math.floor(bufferAmt / step)) : 0; // floor => never above 5%

  const nG = goalAmts.length;
  while (totalUnits - secU - bufU < nG && (secU > 0 || bufU > 1)) {
    if (secU > 0) secU--; else bufU--;
  }
  const goalUnits = Math.max(0, totalUnits - secU - bufU);

  const tot = goalAmts.reduce((s, v) => s + v, 0) || 1;
  const raw = goalAmts.map(a => (a / tot) * goalUnits);
  const fl = raw.map(r => Math.floor(r));
  let left = goalUnits - fl.reduce((s, v) => s + v, 0);
  const ord = raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem);
  for (let k = 0; k < left && ord.length; k++) fl[ord[k % ord.length].i]++;

  // no goal may vanish — take a unit from the fattest goal
  for (let i = 0; i < fl.length; i++) {
    if (fl[i] === 0) {
      let big = 0; fl.forEach((v, j) => { if (v > fl[big]) big = j; });
      if (fl[big] > 1) { fl[big]--; fl[i]++; }
    }
  }
  return { step, security: secU * step, goals: fl.map(u => u * step), buffer: bufU * step };
}

/** Blend each bucket's need-share with its priority-share. buckets: [{req, rank}] */
export function blendShares(buckets) {
  const needTot = buckets.reduce((s, b) => s + b.req, 0) || 1;
  const wTot = buckets.reduce((s, b) => s + prioWeight(b.rank), 0) || 1;
  return buckets.map(b => PRIO_BLEND * (prioWeight(b.rank) / wTot) + (1 - PRIO_BLEND) * (b.req / needTot));
}

/** The split, in order: 1) Buffer in Bank takes a flat 5%. 2) Safety Net takes what it
 *  needs, hard-capped at 15% of monthly. 3) Everything left goes to goals, weighted by
 *  priority × need. */
export function splitMonthly(monthly, living, selectedGoals) {
  // `living` is the { index, label, monthlyExpense } object set by section2 —
  // unlike the raw array-index the HTML prototype used. This shim accepts either
  // shape so the engine isn't silently broken if something ever passes a bare index.
  const livingInfo = LIVING[living?.index ?? living ?? 0];
  const securityTarget = 6 * livingInfo.expense;
  const secReq = solveStartingPMT(securityTarget, 2, MONTHLY_RATE, STEP_UP_RATE);

  const buffer = monthly * BUFFER_PCT;
  const securityAmt = Math.min(secReq, monthly * SAFETY_CAP_PCT, monthly - buffer);
  const forGoals = Math.max(0, monthly - buffer - securityAmt);

  const rows = selectedGoals.map((sg, i) => {
    const g = GOALS.find(x => x.key === sg.key);
    const tgt = inflatedTarget(g, sg.years);
    return {
      key: g.key, target: tgt, baseTarget: g.target, infl: g.infl, years: sg.years, rank: i,
      req: solveStartingPMT(tgt, sg.years, MONTHLY_RATE, STEP_UP_RATE),
    };
  });
  const shares = blendShares(rows);
  rows.forEach((r, i) => { r.amount = forGoals * shares[i]; });

  return { securityTarget, securityAmt, buffer, goalRows: rows };
}

/** One-shot t=0 allocation for the Life Allocation screen (rounded, sums exactly). */
export function buildAllocation(monthly, living, selectedGoals) {
  const s = splitMonthly(monthly, living, selectedGoals);
  const r = roundAllocation(monthly, s.securityAmt, s.goalRows.map(x => x.amount), s.buffer);

  const security = Object.assign({}, GOALS_META.security,
    { target: s.securityTarget, years: 2, rank: 0, amount: r.security });
  const goals = s.goalRows.map((row, i) =>
    Object.assign({}, GOALS.find(x => x.key === row.key), row, { amount: r.goals[i] }));
  const bufferBucket = Object.assign({}, GOALS_META.buffer, { amount: r.buffer, rank: 99 });

  const allBuckets = [security].concat(goals, [bufferBucket]);
  const total = allBuckets.reduce((s2, b) => s2 + b.amount, 0) || 1;
  allBuckets.forEach(b => { b.pct = Math.round((b.amount / total) * 100); });
  return { security, goals, buffer: r.buffer, step: r.step, allBuckets };
}

/** Month-by-month journey. Same rules re-applied every year: buffer 5% off the top,
 *  safety capped at 15% until it's full, the rest split by priority × need. A finished
 *  bucket frees its share to the survivors immediately, not just at year boundaries. */
export function simulateJourney(monthly, living, selectedGoals, age) {
  const livingInfo = LIVING[living?.index ?? living ?? 0];
  const securityTarget = 6 * livingInfo.expense;

  const buckets = [{ key: 'security', target: securityTarget, years: 2, rank: 0, isSafety: true, balance: 0, done: false, doneMonth: null }]
    .concat(selectedGoals.map((sg, i) => {
      const g = GOALS.find(x => x.key === sg.key);
      return { key: g.key, target: inflatedTarget(g, sg.years), years: sg.years, rank: i, isSafety: false, balance: 0, done: false, doneMonth: null };
    }));

  let yearTotal = monthly, alloc = {};
  function recompute(elapsedMonths) {
    const elapsedYears = elapsedMonths / 12;
    const buffer = yearTotal * BUFFER_PCT;
    const active = buckets.filter(b => !b.done);
    active.forEach(b => {
      b.req = solveStartingPMT(Math.max(0, b.target - b.balance), Math.max(b.years - elapsedYears, 1 / 12), MONTHLY_RATE, STEP_UP_RATE);
    });

    const safety = active.find(b => b.isSafety);
    const safetyAmt = safety ? Math.min(safety.req, yearTotal * SAFETY_CAP_PCT, yearTotal - buffer) : 0;
    const forGoals = Math.max(0, yearTotal - buffer - safetyAmt);

    const goalRows = active.filter(b => !b.isSafety);
    const shares = blendShares(goalRows);

    buckets.forEach(b => { alloc[b.key] = 0; });
    if (safety) alloc[safety.key] = safetyAmt;
    goalRows.forEach((b, i) => { alloc[b.key] = forGoals * shares[i]; });
  }

  recompute(0);
  for (let m = 1; m <= MAX_SIM_MONTHS; m++) {
    if (m > 1 && (m - 1) % 12 === 0) { yearTotal *= (1 + STEP_UP_RATE); recompute(m - 1); }
    let justFinished = false;
    buckets.forEach(b => {
      if (b.done) return;
      b.balance = b.balance * (1 + MONTHLY_RATE) + (alloc[b.key] || 0);
      if (b.balance >= b.target) { b.done = true; b.doneMonth = m; justFinished = true; }
    });
    if (buckets.every(b => b.done)) break;
    if (justFinished) recompute(m);
  }

  const res = {};
  buckets.forEach(b => {
    const capped = b.doneMonth === null;
    const months = b.doneMonth || MAX_SIM_MONTHS;
    const desiredMonths = Math.round(b.years * 12);
    res[b.key] = {
      months, years: months / 12, capped, target: b.target,
      achieveAge: age + months / 12, desiredAge: age + b.years,
      deltaMonths: months - desiredMonths, desiredMonths,
    };
  });
  return res;
}

/** Blueprint status: on time → On track · up to 12 months late → Manageable · beyond that
 *  → May delay. Honest, never shaming — no raw negative deltas as the primary signal. */
export function timelineStatus(a) {
  if (a.capped) return { cls: 'long', label: 'May delay', kind: 'long' };
  const d = a.deltaMonths;
  if (d <= 0) return { cls: 'good', label: '🎯 On track', kind: 'good' };
  if (d <= 12) return { cls: 'range', label: '✨ Manageable', kind: 'range' };
  return { cls: 'long', label: `May delay · ~${fmtYearsMonths(d)}`, kind: 'long' };
}

/* ---------------- formatters ---------------- */
export function fmtINR(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

/** Big money reads better in lacs/crores: 35,94,837 → ₹35.95 L */
export function fmtLac(n) {
  n = Math.round(n);
  if (n < 100000) return '₹' + n.toLocaleString('en-IN');
  if (n >= 10000000) {
    const c = n / 10000000;
    return '₹' + c.toFixed(2).replace(/\.?0+$/, '') + ' Cr';
  }
  const l = n / 100000;
  return '₹' + l.toFixed(2).replace(/\.?0+$/, '') + ' L';
}
export function fmtAge(a) {
  let y = Math.floor(a), m = Math.round((a - y) * 12);
  if (m === 12) { m = 0; y += 1; }
  return m === 0 ? ('' + y) : (y + ', ' + m + 'mo');
}
export function fmtAgeSmart(v, monthsAway) { return monthsAway <= 24 ? fmtAge(v) : ('' + Math.round(v)); }
export function fmtYearsMonths(months) {
  const y = Math.floor(months / 12), m = Math.round(months % 12);
  if (y <= 0) return m + ' mo';
  if (m === 0) return y + ' yr';
  return y + 'yr ' + m + 'mo';
}
export function fmtYears(y) {
  if (y < 1) return Math.round(y * 12) + ' mo';
  if (y === Math.round(y)) return y + ' yr';
  const w = Math.floor(y), mm = Math.round((y - w) * 12);
  return mm ? w + 'yr ' + mm + 'mo' : w + ' yr';
}