import { sessionDates } from "../domain/mockData";
import type { GameSession } from "../domain/types";

export function createMockSession(dateIndex = 0): GameSession {
  return { dateIndex, date: sessionDates[dateIndex], phase: dateIndex > 4 ? "crash-window" : "active" };
}

export function advanceMockSession(session: GameSession): GameSession {
  const dateIndex = Math.min(session.dateIndex + 1, sessionDates.length - 1);
  return createMockSession(dateIndex);
}
