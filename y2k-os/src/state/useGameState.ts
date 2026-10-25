import { useCallback, useEffect, useMemo, useState } from "react";
import { initialContacts, initialMail } from "../domain/mockData";
import type { Chat, Contacts, Mail } from "../domain/types";
import { createGame, executeOrder, advanceWeek, reassureLps, restartGame, nav, holdingsValue, type GameState, type OrderSide, type Ticker } from "../game/gameEngine";
import { fallbackMail, fallbackNews, fetchApiMail, generateNews, type GeneratedNews } from "../services/aiContent";

const STORAGE_KEY = "y2k-os-game-v2";
const load = (): GameState => { try { const saved = localStorage.getItem(STORAGE_KEY); if (!saved) return createGame(); const value = JSON.parse(saved) as Partial<GameState>; if (typeof value.sessionId !== "string" || typeof value.week !== "number" || typeof value.cash !== "number" || !value.positions || !value.quotes || !value.history) return createGame(); return value as GameState; } catch { return createGame(); } };

export function useGameState() {
  const [state, setState] = useState<GameState>(load);
  const [mails, setMails] = useState<Mail[]>(initialMail);
  const [contacts, setContacts] = useState<Contacts>(initialContacts);
  const [news, setNews] = useState<GeneratedNews[]>([]);

  // Fetch an AI-generated email from the API each new week, falling back to a canned one
  useEffect(() => {
    if (state.week <= 1) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000); // LLM calls are slow
    fetchApiMail(state, controller.signal).then(mail => {
      window.clearTimeout(timeout);
      if (cancelled) return;
      const next = mail ?? fallbackMail(state);
      setMails(value => value.some(m => m.id === next.id) ? value : [next, ...value]);
    });
    return () => { cancelled = true; window.clearTimeout(timeout); controller.abort(); };
  }, [state.week, state.sessionId]);

  useEffect(() => {
    if (news.some(item => item.week === state.week)) return;
    const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 4500);
    void generateNews(state, controller.signal).then(item => setNews(value => [...value.filter(existing => existing.week !== state.week), item ?? fallbackNews(state)])).catch(() => setNews(value => [...value, fallbackNews(state)]));
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [state.week, state.sessionId]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  const update = useCallback((next: GameState) => setState(next), []);
  const placeOrder = useCallback((symbol: string, side: OrderSide, amount: number) => update(executeOrder(state, symbol, side, amount)), [state, update]);
  const advance = useCallback(() => update(advanceWeek(state)), [state, update]);
  const reassure = useCallback(() => update(reassureLps(state)), [state, update]);
  const markMailRead = (index: number) => setMails(value => value.map((mail, item) => item === index ? { ...mail, unread: false } : mail));
  const sendMessage = (contact: string, text: string) => setContacts(value => ({ ...value, [contact]: { ...value[contact], chat: [...value[contact].chat, { from: "me", text, time: "now" } as Chat] } }));
  const restart = () => { localStorage.removeItem(STORAGE_KEY); setState(restartGame()); setMails(initialMail); setNews([]); setContacts(initialContacts); };

  return useMemo(() => ({ ...state, positions: Object.values(state.positions), totalValue: nav(state), portfolioValue: holdingsValue(state), session: { date: `Week ${state.week} · 1999`, phase: state.phase === "crashed" ? "crash-window" : "active" as const }, mails, news, contacts, placeOrder, advance, reassure, markMailRead, sendMessage, restart }), [state, mails, news, contacts, placeOrder, advance, reassure]);
}

export type GameHook = ReturnType<typeof useGameState>;
export type { Ticker };