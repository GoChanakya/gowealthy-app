import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchFundPicks, fetchFundCard, USE_MOCK } from '../api/fundCards';

/**
 * Screen state for fund picks.
 *
 * Each recommended fund owns a "slot". A slot remembers the fund the backend
 * picked (`original`) and what's on screen now (`current`), which differ after
 * a Switch or Swap in — that's what makes Undo a one-step restore.
 */
export default function useFundPicks() {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [asOfDate, setAsOfDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Bumped by reload(); the effect below refetches whenever it changes.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchFundPicks().then(
      ({ asOfDate: asOf, funds }) => {
        if (!alive) return;
        setAsOfDate(asOf);
        setSlots(funds.map((f) => ({ id: f.scheme_code, original: f, current: f })));
        setOpenId(funds[0]?.scheme_code ?? null); // first card starts open
        setStatus('ready');
      },
      (e) => {
        if (!alive) return;
        if (__DEV__) console.warn('[fundPicks] load failed', e);
        setError(e);
        setStatus('error');
      },
    );
    return () => { alive = false; };
  }, [attempt]);

  const reload = useCallback(() => {
    setStatus('loading');
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  const toggleOpen = useCallback((id) => setOpenId((cur) => (cur === id ? null : id)), []);

  /** Replace a slot's card with an alternate. Throws so the caller can show a message. */
  const switchTo = useCallback(async (slotId, alt) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    setBusyId(slotId);
    try {
      const card = await fetchFundCard(alt.scheme_code, { alt, parent: slot.current });
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, current: card } : s)));
    } finally {
      setBusyId(null);
    }
  }, [slots]);

  const undo = useCallback((slotId) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, current: s.original } : s)));
  }, []);

  /**
   * Everything searchable: each slot's original and current card, plus their
   * alternates. Alternates inherit the category of the card that lists them.
   */
  const searchIndex = useMemo(() => {
    const seen = new Map();
    const add = (entry) => { if (!seen.has(entry.scheme_code)) seen.set(entry.scheme_code, entry); };

    for (const slot of slots) {
      for (const card of [slot.current, slot.original]) {
        add({
          scheme_code: card.scheme_code, name: card.name, amc: card.amc.short_name,
          category: card.category.label, match: card.personality_match.score,
          slotId: slot.id, isOriginal: card === slot.original, alt: null,
        });
        for (const alt of card.alternates) {
          add({
            scheme_code: alt.scheme_code, name: alt.name, amc: alt.amc_short_name,
            category: card.category.label, match: alt.personality_match,
            slotId: slot.id, isOriginal: false, alt,
          });
        }
      }
    }
    return [...seen.values()];
  }, [slots]);

  const onScreen = useMemo(() => new Set(slots.map((s) => s.current.scheme_code)), [slots]);

  const search = useCallback((query) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter((e) => `${e.name} ${e.amc} ${e.category}`.toLowerCase().includes(q))
      .sort((a, b) => b.match - a.match)
      .map((e) => ({ ...e, listed: onScreen.has(e.scheme_code) }));
  }, [searchIndex, onScreen]);

  /** Swap in a search result, replacing the card it belongs with. */
  const swapIn = useCallback(async (entry) => {
    if (entry.isOriginal) undo(entry.slotId);
    else await switchTo(entry.slotId, entry.alt);
    setOpenId(entry.slotId);
  }, [switchTo, undo]);

  return {
    status, error, asOfDate, slots, openId, busyId, isSample: USE_MOCK,
    reload, toggleOpen, switchTo, undo, search, swapIn,
  };
}
