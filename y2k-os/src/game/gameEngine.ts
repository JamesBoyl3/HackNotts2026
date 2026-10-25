export const TICKERS = ["HCKSOC", "CAPONE", "TELLUV"] as const;
export type Ticker = (typeof TICKERS)[number];
export type OrderSide = "buy" | "sell";
export type GamePhase = "active" | "crashed" | "won" | "lost" | "exited";

export type Position = { ticker: Ticker; shares: number; averageCost: number };
export type StockQuote = { ticker: Ticker; name: string; price: number; change: number };
export type MarketEvent = { week: number; headline: string; description: string; ticker?: Ticker; multiplier?: number; confidenceDelta: number; crash?: boolean };
export type GameState = {
  sessionId: string; week: number; cash: number; positions: Record<Ticker, Position>;
  quotes: Record<Ticker, StockQuote>; history: Record<Ticker, number[]>; weeks: number[];
  lpConfidence: number; crashWeek: number; crashTriggered: boolean; eventsTriggered: number[];
  phase: GamePhase; lastMessage: string; events: MarketEvent[];
};
export type RandomSource = () => number;

const initialPrices: Record<Ticker, number> = { HCKSOC: 40, CAPONE: 70, TELLUV: 25 };
const names: Record<Ticker, string> = { HCKSOC: "Hacksoc Software", CAPONE: "Capone Credit", TELLUV: "Telluv Fibre" };
const eventPool: Record<number, MarketEvent> = {
  5: { week: 5, headline: "CAPONE announces record B2B credit surge", description: "Credit facility demand from venture-backed startups surges.", ticker: "CAPONE", multiplier: 1.25, confidenceDelta: 5 },
  9: { week: 9, headline: "DOJ launches antitrust probe into HCKSOC", description: "Federal regulators issue subpoenas regarding proprietary software tie-ins.", ticker: "HCKSOC", multiplier: 0.78, confidenceDelta: -5 },
  17: { week: 17, headline: "Institutional rotation boosts TELLUV", description: "Telecommunication syndication agreements attract defensive capital.", ticker: "TELLUV", multiplier: 1.2, confidenceDelta: 5 },
};

const round = (value: number) => Math.round(value * 100) / 100;
const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const holdingsValue = (state: GameState) => TICKERS.reduce((sum, ticker) => sum + state.positions[ticker].shares * state.quotes[ticker].price, 0);
export const nav = (state: GameState) => state.cash + holdingsValue(state);

export function createGame(random: RandomSource = Math.random, sessionId = makeId()): GameState {
  const positions = Object.fromEntries(TICKERS.map(ticker => [ticker, { ticker, shares: ticker === "HCKSOC" ? 35000 : ticker === "CAPONE" ? 20000 : 40000, averageCost: initialPrices[ticker] }])) as Record<Ticker, Position>;
  const quotes = Object.fromEntries(TICKERS.map(ticker => [ticker, { ticker, name: names[ticker], price: initialPrices[ticker], change: 0 }])) as Record<Ticker, StockQuote>;
  return { sessionId, week: 1, cash: 1_200_000, positions, quotes, history: { HCKSOC: [40], CAPONE: [70], TELLUV: [25] }, weeks: [1], lpConfidence: 75, crashWeek: 11 + Math.floor(random() * 4), crashTriggered: false, eventsTriggered: [], phase: "active", lastMessage: "Phoenix BIOS ready. Awaiting orders.", events: [] };
}

export function executeOrder(state: GameState, ticker: string, side: OrderSide, shares: number): GameState {
  if (state.phase !== "active" && state.phase !== "crashed") return { ...state, lastMessage: "Trading is closed for this session." };
  if (!TICKERS.includes(ticker as Ticker)) return { ...state, lastMessage: `Unknown ticker: ${ticker}.` };
  if (!Number.isInteger(shares) || shares <= 0) return { ...state, lastMessage: "Quantity must be a positive whole number." };
  const symbol = ticker as Ticker; const position = state.positions[symbol]; const price = state.quotes[symbol].price; const value = round(price * shares);
  if (side === "buy" && value > state.cash) return { ...state, lastMessage: "Insufficient liquidity for that order." };
  if (side === "sell" && shares > position.shares) return { ...state, lastMessage: "Not enough shares held to cover that order." };
  const nextShares = side === "buy" ? position.shares + shares : position.shares - shares;
  const averageCost = side === "buy" ? round(((position.shares * position.averageCost) + value) / nextShares) : position.averageCost;
  return { ...state, cash: round(state.cash + (side === "buy" ? -value : value)), positions: { ...state.positions, [symbol]: { ...position, shares: nextShares, averageCost } }, lastMessage: `${side === "buy" ? "Bought" : "Sold"} ${shares.toLocaleString()} ${symbol} for $${value.toLocaleString()}.` };
}

export function reassureLps(state: GameState): GameState {
  if (state.phase !== "active" && state.phase !== "crashed") return state;
  if (state.cash < 150_000) return { ...state, lastMessage: "Insufficient funds for the investor roadshow." };
  return { ...state, cash: state.cash - 150_000, lpConfidence: Math.min(100, state.lpConfidence + 18), lastMessage: "Investor roadshow hosted. LP confidence improved by 18%." };
}

function setQuote(state: GameState, ticker: Ticker, price: number): GameState {
  const previous = state.quotes[ticker].price;
  return { ...state, quotes: { ...state.quotes, [ticker]: { ...state.quotes[ticker], price: round(price), change: round(price - previous) } } };
}

export function advanceWeek(state: GameState, random: RandomSource = Math.random): GameState {
  if (state.phase !== "active") return { ...state, lastMessage: "This game has ended. Start a new game to continue." };
  const week = state.week + 1;
  let next: GameState = { ...state, week, cash: round(state.cash - 35_000), weeks: [...state.weeks, week], history: { ...state.history }, events: [...state.events] };
  for (const ticker of TICKERS) {
    const ranges = next.crashTriggered ? { HCKSOC: [-0.1, 0.22], CAPONE: [-0.07, 0.14], TELLUV: [-0.02, 0.05] } : { HCKSOC: [-0.06, 0.22], CAPONE: [-0.04, 0.15], TELLUV: [-0.01, 0.04] };
    const [low, high] = ranges[ticker]; next = setQuote(next, ticker, Math.max(ticker === "TELLUV" ? 5 : 0.5, next.quotes[ticker].price * (1 + low + random() * (high - low))));
  }
  const nextHistory = { ...next.history }; for (const ticker of TICKERS) nextHistory[ticker] = [...nextHistory[ticker], next.quotes[ticker].price]; next = { ...next, history: nextHistory };
  if (next.cash < 0) next = { ...next, lpConfidence: Math.max(0, next.lpConfidence - 8) };
  let event: MarketEvent | undefined;
  if (week === next.crashWeek && !next.crashTriggered) {
    next = { ...next, crashTriggered: true, lpConfidence: Math.max(0, next.lpConfidence - 25) };
    next = setQuote(setQuote(setQuote(next, "HCKSOC", next.quotes.HCKSOC.price * 0.28), "CAPONE", next.quotes.CAPONE.price * 0.38), "TELLUV", next.quotes.TELLUV.price * 0.8);
    event = { week, headline: "Federal Reserve warns of irrational exuberance", description: "Speculative technology shares collapse as liquidity seizes up.", confidenceDelta: -25, crash: true };
  } else if (eventPool[week] && !next.eventsTriggered.includes(week)) {
    event = eventPool[week]; next = { ...next, eventsTriggered: [...next.eventsTriggered, week], lpConfidence: Math.max(0, Math.min(100, next.lpConfidence + event.confidenceDelta)) };
    if (event.ticker && event.multiplier) next = setQuote(next, event.ticker, next.quotes[event.ticker].price * event.multiplier);
    if (event.ticker) { const history = { ...next.history }; history[event.ticker] = [...history[event.ticker].slice(0, -1), next.quotes[event.ticker].price]; next = { ...next, history }; }
  }
  if (event) next = { ...next, events: [...next.events, event] };
  const currentNav = nav(next); let phase: GamePhase = next.phase;
  if (next.lpConfidence <= 0 || currentNav <= 1_200_000) phase = "lost"; else if (week > 24) phase = currentNav >= 7_500_000 ? "won" : "lost";
  return { ...next, phase, lastMessage: event ? `${event.headline}. ${event.description}` : `Week ${week} opened. $35,000 overhead deducted.` };
}

export const restartGame = (random: RandomSource = Math.random) => createGame(random);
