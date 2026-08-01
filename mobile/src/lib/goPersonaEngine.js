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