import type { Mail } from "../domain/types";
import type { GameState } from "../game/gameEngine";

export type GeneratedNews = { id: string; week: number; headline: string; summary: string; body: string; publishedAt: string; relatedTickers: string[] };
const endpoint = "http://127.0.0.1:8889/v1/chat/completions";
const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 1200;
export function validateNews(value: unknown, week: number): GeneratedNews | null {
  if (!value || typeof value !== "object") return null; const item = value as Record<string, unknown>;
  if (!isText(item.headline) || !isText(item.summary) || !isText(item.body)) return null;
  return { id: `news-${week}`, week, headline: item.headline, summary: item.summary, body: item.body, publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : `Week ${week}, 1999`, relatedTickers: Array.isArray(item.relatedTickers) ? item.relatedTickers.filter((ticker): ticker is string => typeof ticker === "string") : [] };
}
export async function generateNews(state: GameState, signal?: AbortSignal): Promise<GeneratedNews | null> {
  const response = await fetch(endpoint, { method: "POST", signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ model: "local", temperature: 0.7, top_p: 0.9, stream: false, messages: [{ role: "system", content: "Write concise, plain-text late-1990s financial news as JSON with headline, summary, body, publishedAt, relatedTickers. Never change game state." }, { role: "user", content: `Week ${state.week}; NAV ${state.cash}; prices ${JSON.stringify(state.quotes)}; events ${JSON.stringify(state.events.slice(-1))}` }] }) });
  if (!response.ok) return null; const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }; const raw = payload.choices?.[0]?.message?.content; if (!raw) return null;
  try { return validateNews(JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")), state.week); } catch { return null; }
}
export const fallbackNews = (state: GameState): GeneratedNews => ({ id: `fallback-news-${state.week}`, week: state.week, headline: state.events.at(-1)?.headline ?? `Markets open for week ${state.week}`, summary: "The Nottingham desk reviews the latest movements.", body: `HCKSOC, CAPONE and TELLUV were reviewed by the investment desk in week ${state.week}. The engine recorded prices independently of this bulletin.`, publishedAt: `Week ${state.week}, 1999`, relatedTickers: ["HCKSOC", "CAPONE", "TELLUV"] });
export const fallbackMail = (state: GameState): Mail => ({ id: 1000 + state.week, sender: "Nottingham Financial", subject: `Week ${state.week} market bulletin`, time: "09:00", body: fallbackNews(state).body, unread: true, tag: "News" });

export async function fetchApiMail(state: GameState, signal?: AbortSignal): Promise<Mail | null> {
  try {
    const response = await fetch("https://hacknotts.jimpip.uk/email", { signal });
    console.log("email status:", response.status);
    if (!response.ok) return null;
    const data = await response.json();
    console.log("email data:", data);
    if (typeof data.title !== "string" || typeof data.content !== "string") return null;
    return {
      id: 1000 + state.week,
      sender: "Anonymous Tip",
      subject: data.title.replace(/^"|"$/g, "").trim(),
      time: "now",
      body: data.content.trim(),
      unread: true,
      tag: "Research",
    };
  } catch (err) {
    console.error("fetchApiMail failed:", err);
    return null;
  }
}