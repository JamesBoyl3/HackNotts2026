import { useState } from "react";
import { initialContacts, initialMail, sessionDates, stocks } from "../domain/mockData";
import type { Chat, Contacts, Mail, OrderSide, Position } from "../domain/types";
import { advanceMockSession, createMockSession } from "../services/mockGame";
import { calculatePortfolioValue, placeMockOrder } from "../services/mockMarket";

export function useGameState() {
  const [cash, setCash] = useState(100000);
  const [positions, setPositions] = useState<Position[]>([{ symbol: "NOVA", shares: 120, average: 68.2 }, { symbol: "GRN", shares: 300, average: 35.1 }]);
  const [session, setSession] = useState(createMockSession());
  const [lastOrder, setLastOrder] = useState("Ready for orders. Prices are simulated locally.");
  const [mails, setMails] = useState<Mail[]>(initialMail);
  const [contacts, setContacts] = useState<Contacts>(initialContacts);
  const portfolioValue = calculatePortfolioValue(positions, stocks);
  const placeOrder = (symbol: string, side: OrderSide, amount: number) => {
    const result = placeMockOrder(positions, cash, stocks, symbol, side, amount);
    setPositions(result.positions); setCash(result.cash); setLastOrder(result.result.message);
  };
  const advance = () => { const next = advanceMockSession(session); setSession(next); setLastOrder(next.dateIndex === sessionDates.length - 1 ? "The crash window has arrived. Consider exiting and lock in your result." : "New Monday session loaded. Market prices have moved."); };
  const markMailRead = (index: number) => setMails(value => value.map((mail, itemIndex) => itemIndex === index ? { ...mail, unread: false } : mail));
  const sendMessage = (contact: string, text: string) => setContacts(value => ({ ...value, [contact]: { ...value[contact], chat: [...value[contact].chat, { from: "me", text, time: "now" } as Chat] } }));
  const restart = () => { setCash(100000); setPositions([{ symbol: "NOVA", shares: 120, average: 68.2 }, { symbol: "GRN", shares: 300, average: 35.1 }]); setSession(createMockSession()); setLastOrder("Ready for orders. Prices are simulated locally."); setMails(initialMail); setContacts(initialContacts); };
  return { cash, positions, portfolioValue, totalValue: cash + portfolioValue, session, lastOrder, mails, contacts, placeOrder, advance, markMailRead, sendMessage, restart };
}
