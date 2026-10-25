import { useState } from "react";
import type { GameHook } from "../../state/useGameState";
import { TICKERS, type OrderSide } from "../../game/gameEngine";

const money = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
type Props = { game: GameHook };

export default function MarketTerminal({ game }: Props) {
  const [ticker, setTicker] = useState<typeof TICKERS[number]>("HCKSOC"); const [side, setSide] = useState<OrderSide>("buy"); const [quantity, setQuantity] = useState("1000");
  const quote = game.quotes[ticker]; const selectedHistory = game.history[ticker];
  const submit = () => game.placeOrder(ticker, side, Number(quantity));
  return <div className="market-terminal">
    <div className="terminal-header"><strong>BLEEMBORG INTELLIGENCE TERMINAL v2.4</strong><span>WEEK {String(game.week).padStart(2, "0")} / 24</span></div>
    <div className="terminal-summary"><span>NAV <b>{money(game.totalValue)}</b></span><span>CASH <b>{money(game.cash)}</b></span><span>LP CONFIDENCE <b>{game.lpConfidence}%</b></span><span>OVERHEAD <b>-$35,000 / WEEK</b></span></div>
    <div className="terminal-grid"><section><h3>MARKET QUOTES</h3>{TICKERS.map(symbol => <button className={`quote-row ${symbol === ticker ? "selected" : ""}`} key={symbol} onClick={() => setTicker(symbol)}><b>{symbol}</b><span>{money(game.quotes[symbol].price)}</span><em>{game.quotes[symbol].change >= 0 ? "+" : ""}{game.quotes[symbol].change.toFixed(2)}</em><small>{(game.positions.find(position => position.ticker === symbol)?.shares ?? 0).toLocaleString()} shares</small></button>)}</section>
      <section className="stock-viewer"><h3>{ticker} // PRICE HISTORY</h3><div className="ascii-chart">{selectedHistory.map((price, index) => <i key={`${price}-${index}`} style={{ height: `${Math.max(8, Math.min(100, price / Math.max(...selectedHistory) * 100))}%` }} title={`Week ${game.weeks[index]}: ${money(price)}`} />)}</div><p>{quote.name} · Week {game.week} · Current {money(quote.price)}</p></section>
      <section><h3>ORDER ENTRY</h3><select value={side} onChange={event => setSide(event.target.value as OrderSide)}><option value="buy">BUY</option><option value="sell">SELL</option></select><select value={ticker} onChange={event => setTicker(event.target.value as typeof ticker)}>{TICKERS.map(symbol => <option key={symbol}>{symbol}</option>)}</select><input type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} /><button className="terminal-action" onClick={submit}>EXECUTE ORDER</button><button className="terminal-action" onClick={game.reassure}>REASSURE LPs ($150K)</button><button className="terminal-action advance" onClick={game.advance} disabled={game.phase !== "active"}>ADVANCE WEEK</button></section></div>
    <div className={`terminal-log ${game.phase === "lost" ? "error" : ""}`}>{game.lastMessage}<span>Phase: {game.phase.toUpperCase()} · Crash window: week {game.crashWeek}</span></div>
    {(game.phase === "won" || game.phase === "lost") && <div className="game-over"><h2>{game.phase === "won" ? "SURVIVOR & ALPHA PRODUCER" : "FUND LIQUIDATED"}</h2><p>Final NAV: {money(game.totalValue)}</p><button onClick={game.restart}>START NEW GAME</button></div>}
  </div>;
}
