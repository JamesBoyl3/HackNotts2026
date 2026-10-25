import type { OrderResult, OrderSide, Position, Stock } from "../domain/types";

export function calculatePortfolioValue(positions: Position[], market: Stock[]): number {
  return positions.reduce((sum, position) => sum + position.shares * (market.find(stock => stock.symbol === position.symbol)?.price ?? position.average), 0);
}

export function placeMockOrder(positions: Position[], cash: number, market: Stock[], symbol: string, side: OrderSide, amount: number): { positions: Position[]; cash: number; result: OrderResult } {
  const stock = market.find(item => item.symbol === symbol);
  if (!stock || !Number.isInteger(amount) || amount <= 0) return { positions, cash, result: { ok: false, message: "Order rejected: enter a whole number of shares." } };
  const cost = stock.price * amount;
  const current = positions.find(position => position.symbol === symbol);
  if (side === "buy" && cost > cash) return { positions, cash, result: { ok: false, message: `Order rejected: insufficient cash for ${amount} shares of ${symbol}.` } };
  if (side === "sell" && (!current || current.shares < amount)) return { positions, cash, result: { ok: false, message: `Order rejected: you do not own ${amount} shares of ${symbol}.` } };
  const nextPositions = side === "buy"
    ? current
      ? positions.map(position => position.symbol === symbol ? { ...position, shares: position.shares + amount, average: (position.average * position.shares + cost) / (position.shares + amount) } : position)
      : [...positions, { symbol, shares: amount, average: stock.price }]
    : positions.map(position => position.symbol === symbol ? { ...position, shares: position.shares - amount } : position).filter(position => position.shares > 0);
  return { positions: nextPositions, cash: cash + (side === "buy" ? -cost : cost), result: { ok: true, message: `${side === "buy" ? "Bought" : "Sold"} ${amount} ${symbol} @ £${stock.price.toFixed(2)} — simulated execution complete.` } };
}
