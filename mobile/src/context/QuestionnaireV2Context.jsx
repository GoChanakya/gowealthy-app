import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * QuestionnaireV2Context
 * ------------------------------------------------------------------
 * State for the NEW (redesigned) GoPersona questionnaire flow only.
 * Completely separate from the existing `QuestionnaireContext`
 * (src/context/QuestionnaireContext.jsx) — that one holds the old
 * financial-planning questionnaire's data shape (income/loans/
 * insurance/psychology scores/goal_allocations) which has no overlap
 * with this flow's persona/priority-goal model. Do not merge them.
 *
 * Lives entirely in memory for the whole section1→section5 journey.
 * Nothing is written to Firestore until the final step of section5 —
 * see build notes for the questionnaire_submissions/{phone} write.
 *
 * Mount this by wrapping ONLY the v2 questionnaire's own layout:
 *   app/(gowealthy)/questionnaire-v2/_layout.jsx
 *     <QuestionnaireV2Provider><Stack>...</Stack></QuestionnaireV2Provider>
 * This keeps the rest of the app (including the old questionnaire)
 * completely untouched.
 * ------------------------------------------------------------------
 */

const QuestionnaireV2Context = createContext(undefined);

export const useQuestionnaireV2 = () => {
  const ctx = useContext(QuestionnaireV2Context);
  if (!ctx) {
    throw new Error("useQuestionnaireV2 must be used within QuestionnaireV2Provider");
  }
  return ctx;
};

/* ---------------- initial shape ---------------- */

const initialState = {
  // ---- section1: persona quiz ----
  quizIdx: 0,
  answers: [],              // [{ tag, label, dH, dC, dO }]
  scores: { h: 5, c: 5, o: 5 },
  personaCode: null,        // e.g. 'HLH'
  personaKey: null,         // e.g. 'supreme_ruler' — look up full persona object from goPersonaEngine

  // ---- section2: bridge / age / monthly / living ----
  age: 23,
  monthlyInvestment: 6000,
  living: null,             // { index, label, monthlyExpense }

  // ---- section3: goal ranking ----
  selectedGoals: [],        // [{ key, years }], ARRAY ORDER = priority order (index 0 = Priority 1)

  // ---- section4: horizons are set directly on selectedGoals[i].years ----
  // (no separate field — horizon screen edits selectedGoals in place)

  // ---- section5: computed allocation + projection (see engine's buildAllocation/simulateJourney) ----
  allocation: null,         // output of buildAllocation()
  projection: null,         // output of simulateJourney()

  // ---- meta ----
  startedAt: null,
  completedAt: null,
};

/* ---------------- provider ---------------- */

export const QuestionnaireV2Provider = ({ children }) => {
  const [state, setState] = useState(initialState);

  /** Generic path-based updater, mirrors the old context's updateField shape
   *  for familiarity, but this flow mostly uses the typed helpers below. */
  const updateField = useCallback((path, value) => {
    setState(prev => {
      const keys = path.split(".");
      const next = { ...prev };
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  /** Record one quiz answer: pushes to `answers`, applies deltas to `scores`. */
  const recordAnswer = useCallback((tag, label, delta) => {
    setState(prev => {
      const clamp = v => Math.max(0, Math.min(10, v));
      const scores = {
        h: clamp(prev.scores.h + (delta.dH || 0)),
        c: clamp(prev.scores.c + (delta.dC || 0)),
        o: clamp(prev.scores.o + (delta.dO || 0)),
      };
      return {
        ...prev,
        answers: [...prev.answers, { tag, label, dH: delta.dH || 0, dC: delta.dC || 0, dO: delta.dO || 0 }],
        scores,
      };
    });
  }, []);

  const setQuizIdx = useCallback((idx) => setState(prev => ({ ...prev, quizIdx: idx })), []);

  /** Call once scoring is complete, with the result from getPersonality(). */
  const setPersonaResult = useCallback((code, key) => {
    setState(prev => ({ ...prev, personaCode: code, personaKey: key }));
  }, []);

  const setAge = useCallback((age) => setState(prev => ({ ...prev, age })), []);
  const setMonthlyInvestment = useCallback((monthlyInvestment) => setState(prev => ({ ...prev, monthlyInvestment })), []);
  const setLiving = useCallback((living) => setState(prev => ({ ...prev, living })), []);

  const setSelectedGoals = useCallback((selectedGoals) => setState(prev => ({ ...prev, selectedGoals })), []);

  /** Update a single goal's horizon (years) by key, used on the horizon screen (section4). */
  const setGoalYears = useCallback((key, years) => {
    setState(prev => ({
      ...prev,
      selectedGoals: prev.selectedGoals.map(g => (g.key === key ? { ...g, years } : g)),
    }));
  }, []);

  const setAllocation = useCallback((allocation) => setState(prev => ({ ...prev, allocation })), []);
  const setProjection = useCallback((projection) => setState(prev => ({ ...prev, projection })), []);

  const markStarted = useCallback(() => setState(prev => (prev.startedAt ? prev : { ...prev, startedAt: Date.now() })), []);
  const markCompleted = useCallback(() => setState(prev => ({ ...prev, completedAt: Date.now() })), []);

  const resetAll = useCallback(() => setState(initialState), []);

  return (
    <QuestionnaireV2Context.Provider
      value={{
        state,
        updateField,
        recordAnswer,
        setQuizIdx,
        setPersonaResult,
        setAge,
        setMonthlyInvestment,
        setLiving,
        setSelectedGoals,
        setGoalYears,
        setAllocation,
        setProjection,
        markStarted,
        markCompleted,
        resetAll,
      }}
    >
      {children}
    </QuestionnaireV2Context.Provider>
  );
};