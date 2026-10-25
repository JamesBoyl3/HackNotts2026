import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import "./App.css";

type AppId = "terminal" | "mail" | "browser" | "messenger" | "files";
type WindowState = { id: AppId; title: string; x: number; y: number; w: number; h: number; minimized: boolean; maximized: boolean; z: number };
type Stock = { symbol: string; name: string; sector: string; price: number; change: number; spark: number[]; blurb: string };
type Position = { symbol: string; shares: number; average: number };
type Mail = { id: number; sender: string; subject: string; time: string; body: string; unread: boolean; tag: string };
type Chat = { from: "them" | "me"; text: string; time: string };

const stocks: Stock[] = [
  { symbol: "NOVA", name: "Novacore Systems", sector: "Technology", price: 82.4, change: 4.8, spark: [55, 61, 59, 67, 64, 76, 82], blurb: "Enterprise networking hardware. Orders are accelerating ahead of its Y2K-proof launch." },
  { symbol: "PXL", name: "PixelForge Online", sector: "Internet", price: 146.2, change: -2.1, spark: [160, 156, 162, 151, 157, 149, 146], blurb: "A fashionable online marketplace with more page views than revenue." },
  { symbol: "GRN", name: "Greenlight Energy", sector: "Utilities", price: 38.75, change: 1.2, spark: [34, 35, 33, 36, 35, 37, 38], blurb: "Steady regional utility with a surprisingly exciting fibre subsidiary." },
  { symbol: "MTRX", name: "Matrix Microdevices", sector: "Semiconductors", price: 61.15, change: 7.4, spark: [42, 45, 43, 49, 52, 57, 61], blurb: "Chip designer claiming it has solved every computer problem at once." },
  { symbol: "BELL", name: "Bellwether Telecom", sector: "Telecoms", price: 24.9, change: -5.6, spark: [31, 29, 30, 27, 28, 26, 24], blurb: "Long-distance calls, short-term debt, and an optimistic annual report." },
];

const initialMail: Mail[] = [
  { id: 1, sender: "M. Patel — Research", subject: "NOVA: the order book is real", time: "08:42", tag: "Research", unread: true, body: "Morning.\n\nThe Novacore order book is not just conference-room vapour. Two European carriers have quietly pulled their December installs forward. I would not chase the price, but a small position before the next filing looks defensible.\n\n— Mira" },
  { id: 2, sender: "R. Finch — CFO", subject: "RE: Monday positions", time: "07:58", tag: "Internal", unread: true, body: "Team,\n\nRemember that we are paid to remain solvent. The internet is not a business model until somebody can explain the business part.\n\nPlease have exposure and exit levels on my desk before lunch." },
  { id: 3, sender: "The Daily Byte", subject: "Dot-coms discover the concept of gravity", time: "Fri 16:10", tag: "News", unread: false, body: "SAN FRANCISCO — A leading web concern has announced it will monetise its homepage by selling pixels individually. Analysts called the plan 'visionary' and immediately bought more pixels." },
  { id: 4, sender: "unknown@free-cash.net", subject: "URGENT: guaranteed 400% return", time: "Fri 02:13", tag: "Junk", unread: false, body: "Dear respected investor,\n\nYou have been selected to participate in an extremely legitimate opportunity. Please send your account details and a small processing fee." },
  { id: 5, sender: "Helen — London Office", subject: "RE: tea rota / mysterious attachment", time: "Thu 11:24", tag: "Personal", unread: false, body: "I found the strange disk in the printer room. It is labelled 'Q4 projections — do not open'. Naturally, I opened it. The spreadsheet contains three tabs and one very rude macro." },
];

const contacts: Record<string, { status: string; colour: string; chat: Chat[] }> = {
  "Mira Patel": { status: "Online — Research", colour: "#52a447", chat: [{ from: "them", text: "Have you seen NOVA this morning?", time: "08:47" }, { from: "me", text: "Watching it. The order book sounds promising.", time: "08:49" }, { from: "them", text: "Promising is a dangerous word before coffee.", time: "08:50" }] },
  "Helen Finch": { status: "Away — Boardroom", colour: "#e0a42b", chat: [{ from: "them", text: "The board is discussing a 'web strategy'. Send help.", time: "08:15" }] },
  "Dave from IT": { status: "Busy — Y2K bunker", colour: "#d75c3b", chat: [{ from: "them", text: "Please stop opening suspicious attachments.", time: "Yesterday" }] },
  "Alan Greensocks": { status: "Offline", colour: "#888", chat: [] },
};

const fmt = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const appNames: Record<AppId, string> = { terminal: "Market Terminal", mail: "Outlook Express", browser: "Internet Explorer", messenger: "MSN Messenger", files: "My Computer" };

function App() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [top, setTop] = useState(1);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [cash, setCash] = useState(100000);
  const [positions, setPositions] = useState<Position[]>([{ symbol: "NOVA", shares: 120, average: 68.2 }, { symbol: "GRN", shares: 300, average: 35.1 }]);
  const [dateIndex, setDateIndex] = useState(0);
  const [lastOrder, setLastOrder] = useState("Ready for orders. Prices are simulated locally.");
  const [mails, setMails] = useState(initialMail);
  const [selectedMail, setSelectedMail] = useState(0);
  const [selectedContact, setSelectedContact] = useState("Mira Patel");
  const [chats, setChats] = useState(contacts);
  const [browserPage, setBrowserPage] = useState("home");
  const [browserHistory, setBrowserHistory] = useState<string[]>(["home"]);
  const [chatDraft, setChatDraft] = useState("");
  const [wallpaper, setWallpaper] = useState("desktop-image.jpg");

  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const portfolioValue = positions.reduce((sum, p) => sum + p.shares * (stocks.find(s => s.symbol === p.symbol)?.price ?? p.average), 0);
  const totalValue = cash + portfolioValue;
  const dates = ["15 Nov 1999", "22 Nov 1999", "06 Dec 1999", "10 Jan 2000", "07 Feb 2000", "13 Mar 2000", "17 Apr 2000", "15 May 2000"];
  const openApp = (id: AppId) => {
    setStartOpen(false);
    setWindows(current => {
      const existing = current.find(w => w.id === id);
      if (existing) return current.map(w => w.id === id ? { ...w, minimized: false, z: top + 1 } : w);
      const offset = current.length * 24;
      return [...current, { id, title: appNames[id], x: 100 + offset, y: 44 + offset, w: id === "terminal" ? 820 : 700, h: id === "terminal" ? 540 : 470, minimized: false, maximized: false, z: top + 1 }];
    });
    setTop(value => value + 1);
  };
  const focus = (id: AppId) => { setTop(value => value + 1); setWindows(current => current.map(w => w.id === id ? { ...w, minimized: false, z: top + 1 } : w)); };
  const close = (id: AppId) => setWindows(current => current.filter(w => w.id !== id));
  const changeWindow = (id: AppId, changes: Partial<WindowState>) => setWindows(current => current.map(w => w.id === id ? { ...w, ...changes } : w));
  const buySell = (symbol: string, side: "buy" | "sell", amount: number) => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock || !Number.isInteger(amount) || amount <= 0) { setLastOrder("Order rejected: enter a whole number of shares."); return; }
    const cost = stock.price * amount;
    const current = positions.find(p => p.symbol === symbol);
    if (side === "buy" && cost > cash) { setLastOrder(`Order rejected: insufficient cash for ${amount} shares of ${symbol}.`); return; }
    if (side === "sell" && (!current || current.shares < amount)) { setLastOrder(`Order rejected: you do not own ${amount} shares of ${symbol}.`); return; }
    setCash(value => value + (side === "buy" ? -cost : cost));
    setPositions(value => {
      if (side === "buy") {
        return current
          ? value.map(p => p.symbol === symbol ? { ...p, shares: p.shares + amount, average: (p.average * p.shares + cost) / (p.shares + amount) } : p)
          : [...value, { symbol, shares: amount, average: stock.price }];
      }
      return value.map(p => p.symbol === symbol ? { ...p, shares: p.shares - amount } : p).filter(p => p.shares > 0);
    });
    setLastOrder(`${side === "buy" ? "Bought" : "Sold"} ${amount} ${symbol} @ ${fmt(stock.price)} — simulated execution complete.`);
  };
  const advance = () => { if (dateIndex < dates.length - 1) { setDateIndex(value => value + 1); setLastOrder("New Monday session loaded. Market prices have moved."); } else setLastOrder("The crash window has arrived. Consider exiting and lock in your result."); };
  const navigate = (page: string) => { setBrowserPage(page); setBrowserHistory(value => [...value, page]); };

  return <main className="desktop" style={{ backgroundImage: `url("/src/assets/${wallpaper}")` }} onClick={() => startOpen && setStartOpen(false)}>
    <div className="desktop-shade" />
    <div className="desktop-icons">
      <DesktopIcon image="/src/assets/my-computer.svg" label="My Computer" onDoubleClick={() => openApp("files")} />
      <DesktopIcon image="/src/assets/internet-explorer.svg" label="Internet Explorer" onDoubleClick={() => openApp("browser")} />
      <DesktopIcon image="/src/assets/messenger.svg" label="MSN Messenger" onDoubleClick={() => openApp("messenger")} />
      <DesktopIcon image="/src/assets/Folder Open Fill.svg" label="Outlook Express" onDoubleClick={() => openApp("mail")} />
      <DesktopIcon image="/src/assets/Y2K-os-Logo.svg" label="Market Terminal" onDoubleClick={() => openApp("terminal")} />
    </div>
    <div className="mission"><strong>Y2K OS // TRADING DESK</strong><span>Objective: grow the fund before the crash window</span><em className={dateIndex > 4 ? "danger" : ""}>{dates[dateIndex]} · London 09:00</em></div>
    {windows.map(windowState => !windowState.minimized && <Window key={windowState.id} state={windowState} onFocus={() => focus(windowState.id)} onClose={() => close(windowState.id)} onChange={changes => changeWindow(windowState.id, changes)}>{windowState.id === "terminal" && <MarketTerminal cash={cash} positions={positions} value={totalValue} date={dates[dateIndex]} lastOrder={lastOrder} onOrder={buySell} onAdvance={advance} />}{windowState.id === "mail" && <MailApp mails={mails} selected={selectedMail} onSelect={index => { setSelectedMail(index); setMails(value => value.map((mail, i) => i === index ? { ...mail, unread: false } : mail)); }} />}{windowState.id === "browser" && <Browser page={browserPage} history={browserHistory} onNavigate={navigate} onBack={() => setBrowserPage(browserHistory.at(-2) ?? "home")} />}{windowState.id === "messenger" && <Messenger selected={selectedContact} contacts={chats} draft={chatDraft} onDraft={setChatDraft} onSelect={setSelectedContact} onSend={() => { if (!chatDraft.trim()) return; setChats(value => ({ ...value, [selectedContact]: { ...value[selectedContact], chat: [...value[selectedContact].chat, { from: "me", text: chatDraft.trim(), time: "now" }] } })); setChatDraft(""); }} />}{windowState.id === "files" && <FileExplorer onOpen={file => navigate(file === "research.txt" ? "forum" : "report")} />}</Window>)}
    {startOpen && <StartMenu onOpen={openApp} onWallpaper={setWallpaper} />}
    <footer className="taskbar"><button className="start-button" onClick={event => { event.stopPropagation(); setStartOpen(value => !value); }}><span className="windows-mark">▦</span> Start</button>{windows.map(w => <button key={w.id} className={`task-button ${w.minimized ? "" : "active"}`} onClick={() => w.minimized ? focus(w.id) : changeWindow(w.id, { minimized: true })}>▣ {w.title}</button>)}<div className="tray"><span className="mock-badge">MOCK ENGINE</span><span>🔊</span><time>{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></footer>
  </main>;
}

function DesktopIcon({ image, label, onDoubleClick }: { image: string; label: string; onDoubleClick: () => void }) { return <button className="desktop-icon" onDoubleClick={onDoubleClick}><img src={image} alt="" /><span>{label}</span></button>; }

function Window({ state, onFocus, onClose, onChange, children }: { state: WindowState; onFocus: () => void; onClose: () => void; onChange: (changes: Partial<WindowState>) => void; children: ReactNode }) {
  const style = state.maximized ? { left: 0, top: 0, width: "100%", height: "calc(100% - 34px)", zIndex: state.z } : { left: state.x, top: state.y, width: state.w, height: state.h, zIndex: state.z };
  const beginDrag = (event: ReactMouseEvent<HTMLElement>) => {
    if (state.maximized || (event.target as HTMLElement).closest("button")) return;
    onFocus();
    const startX = event.clientX;
    const startY = event.clientY;
    const move = (moveEvent: globalThis.MouseEvent) => onChange({ x: Math.max(0, state.x + moveEvent.clientX - startX), y: Math.max(0, state.y + moveEvent.clientY - startY) });
    const stop = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", stop); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  };
  return <section className="app-window" style={style} onMouseDown={onFocus}><header className="titlebar" onMouseDown={beginDrag} onDoubleClick={() => onChange({ maximized: !state.maximized })}><span className="title-icon">▣</span><strong>{state.title}</strong><div className="window-controls"><button aria-label="Minimize" onClick={() => onChange({ minimized: true })}>_</button><button aria-label="Maximize" onClick={() => onChange({ maximized: !state.maximized })}>□</button><button aria-label="Close" onClick={onClose}>×</button></div></header><div className="window-body">{children}</div></section>;
}

function MarketTerminal({ cash, positions, value, date, lastOrder, onOrder, onAdvance }: { cash: number; positions: Position[]; value: number; date: string; lastOrder: string; onOrder: (symbol: string, side: "buy" | "sell", amount: number) => void; onAdvance: () => void }) {
  const [selected, setSelected] = useState("NOVA"); const [qty, setQty] = useState("10"); const stock = stocks.find(s => s.symbol === selected)!; const [query, setQuery] = useState("");
  const visible = stocks.filter(s => `${s.symbol} ${s.name}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="terminal-app"><div className="app-toolbar"><span className="led green" /> LIVE SIMULATION <span className="toolbar-spacer" /><button onClick={onAdvance}>▸ Advance Monday</button></div><div className="terminal-grid"><aside className="watchlist"><label>MARKET WATCH</label><input placeholder="Find security..." value={query} onChange={e => setQuery(e.target.value)} />{visible.map(s => <button className={selected === s.symbol ? "selected" : ""} key={s.symbol} onClick={() => setSelected(s.symbol)}><strong>{s.symbol}</strong><span>{fmt(s.price)}</span><em className={s.change > 0 ? "up" : "down"}>{s.change > 0 ? "+" : ""}{s.change}%</em></button>)}</aside><div className="terminal-main"><div className="terminal-heading"><div><small>SELECTED SECURITY</small><h2>{stock.symbol} <span>{stock.name}</span></h2><p>{stock.blurb}</p></div><div className="quote"><strong>{fmt(stock.price)}</strong><em className={stock.change > 0 ? "up" : "down"}>{stock.change > 0 ? "▲" : "▼"} {Math.abs(stock.change)}%</em></div></div><div className="chart">{stock.spark.map((point, i) => <i key={i} style={{ height: `${point / 1.7}%` }} />)}</div><div className="trade-row"><div className="order-ticket"><label>ORDER TICKET <select value={selected} onChange={e => setSelected(e.target.value)}>{stocks.map(s => <option key={s.symbol}>{s.symbol}</option>)}</select></label><label>QUANTITY <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} /></label><button className="buy" onClick={() => onOrder(selected, "buy", Number(qty))}>BUY</button><button className="sell" onClick={() => onOrder(selected, "sell", Number(qty))}>SELL</button></div><div className="order-feedback">{lastOrder}</div></div><div className="portfolio-strip"><div><small>AVAILABLE CASH</small><strong>{fmt(cash)}</strong></div><div><small>PORTFOLIO VALUE</small><strong>{fmt(value)}</strong></div><div><small>SESSION</small><strong>{date}</strong></div></div><table className="positions"><caption>OPEN POSITIONS</caption><thead><tr><th>SYMBOL</th><th>SHARES</th><th>AVG COST</th><th>MARKET VALUE</th><th>P/L</th></tr></thead><tbody>{positions.map(p => { const s = stocks.find(x => x.symbol === p.symbol)!; const pl = (s.price - p.average) * p.shares; return <tr key={p.symbol}><td><strong>{p.symbol}</strong></td><td>{p.shares}</td><td>{fmt(p.average)}</td><td>{fmt(s.price * p.shares)}</td><td className={pl >= 0 ? "up" : "down"}>{pl >= 0 ? "+" : ""}{fmt(pl)}</td></tr>; })}</tbody></table></div></div></div>;
}

function MailApp({ mails, selected, onSelect }: { mails: Mail[]; selected: number; onSelect: (index: number) => void }) { const mail = mails[selected]; return <div className="mail-app"><aside className="mail-sidebar"><div className="account">✉ <strong>James@HedgeCo</strong></div><button className="folder active">▾ Inbox <b>{mails.filter(m => m.unread).length}</b></button><button className="folder">▸ Sent Items</button><button className="folder">▸ Deleted Items</button><hr /><small>FOLDERS</small><p>📌 Research</p><p>📌 Internal</p><p>📌 Junk Mail</p></aside><div className="mail-list"><div className="list-head">Inbox <span>{mails.length} messages</span></div>{mails.map((m, i) => <button className={`mail-row ${i === selected ? "selected" : ""} ${m.unread ? "unread" : ""}`} key={m.id} onClick={() => onSelect(i)}><span className="mail-dot">{m.unread ? "●" : "○"}</span><div><strong>{m.sender}</strong><span>{m.subject}</span></div><time>{m.time}</time></button>)}</div><article className="mail-reader"><div className="reader-tools"><button>↩ Reply</button><button>↗ Forward</button><button>⌫ Delete</button></div><h2>{mail.subject}</h2><div className="mail-meta"><strong>{mail.sender}</strong><span>To: James &lt;james@hedgeco.co.uk&gt;</span><time>{mail.time} · {mail.tag}</time></div><div className="mail-body">{mail.body.split("\n").map((line, i) => <p key={i}>{line || "\u00a0"}</p>)}</div></article></div>; }

function Browser({ page, history, onNavigate, onBack }: { page: string; history: string[]; onNavigate: (page: string) => void; onBack: () => void }) { const pages: Record<string, { title: string; content: ReactNode }> = { home: { title: "AltaVista — Welcome", content: <div className="web-home"><div className="altavista">Alta<span>Vista</span></div><p>Search the web, or try one of our recommended places:</p><input placeholder="Ask Jeeves? No, ask AltaVista." /><div className="web-links"><button onClick={() => onNavigate("finwire")}>FinWire Markets</button><button onClick={() => onNavigate("byte")}>The Daily Byte</button><button onClick={() => onNavigate("auction")}>BidBucket Auctions</button><button onClick={() => onNavigate("nova")}>Novacore corporate</button></div></div> }, finwire: { title: "FinWire Markets", content: <WebPage brand="FINWIRE" colour="#0b5170" heading="Markets are nervous. Analysts are not." text="The FTSE closed higher as technology stocks continued to attract capital from traditional industries. FinWire's anonymous source at a major networking supplier says NOVA has a 'very interesting' December." /> }, byte: { title: "The Daily Byte", content: <WebPage brand="THE DAILY BYTE" colour="#b40000" heading="Internet company rents office, calls it a campus" text="In today's news: a startup with no revenue has hired a poet-in-residence. Its stock climbed 12% after the CEO used the word synergy seven times." /> }, auction: { title: "BidBucket — Everything must go!", content: <WebPage brand="bidbucket" colour="#ed7b19" heading="Featured: one (1) slightly used dot-com" text="Bid now on domain names, beanie babies, and a working modem. Seller accepts cheque, money order, or a sincere promise." /> }, nova: { title: "Novacore Systems — corporate", content: <WebPage brand="NOVACORE" colour="#145ca8" heading="Building the connected future" text="Novacore supplies carrier-grade networking equipment to people who insist the millennium will not break their routers. Investor relations: ir@novacore.example." /> }, forum: { title: "The Money Pit message board", content: <WebPage brand="THE MONEY PIT" colour="#44516f" heading="Thread: Is NOVA the next big thing?" text="user:bullmarket99: My cousin's barber's accountant says buy. user:reasonable: That is not research. user:bullmarket99: It is on the internet, so it is research." /> }, report: { title: "Quarterly report viewer", content: <WebPage brand="HEDGECO ARCHIVE" colour="#555" heading="Q4 projections — internal" text="Projected technology exposure: 18%. Risk note: enthusiasm is not a hedging strategy. This document is a simulated file from the Y2K OS." /> } }; const current = pages[page] ?? pages.home; return <div className="browser-app"><div className="browser-tabs"><button className="tab active">🌐 {current.title} ×</button><button onClick={() => onNavigate("home")}>＋</button></div><div className="browser-toolbar"><button onClick={onBack} disabled={history.length < 2}>←</button><button disabled>→</button><button onClick={() => onNavigate(page)}>↻</button><button onClick={() => onNavigate("home")}>⌂</button><input value={`http://${page === "home" ? "altavista.example" : `${page}.y2k`}`} readOnly /><button>★</button></div><div className="browser-content">{current.content}</div><div className="browser-status">Done · Simulated web page · History: {history.length} visits</div></div>; }
function WebPage({ brand, colour, heading, text }: { brand: string; colour: string; heading: string; text: string }) { return <article className="web-page" style={{ borderTopColor: colour }}><div className="web-brand" style={{ background: colour }}>{brand}</div><div className="web-rule" /><h1>{heading}</h1><p>{text}</p><a href="#more">Read the full story →</a><div className="fake-ad">[ This page best viewed at 800 × 600 ]</div></article>; }

function Messenger({ selected, contacts: people, draft, onDraft, onSelect, onSend }: { selected: string; contacts: Record<string, { status: string; colour: string; chat: Chat[] }>; draft: string; onDraft: (value: string) => void; onSelect: (name: string) => void; onSend: () => void }) { return <div className="messenger-app"><aside className="contact-list"><div className="profile"><span className="avatar">J</span><div><strong>James</strong><small>Online</small></div></div><label>MY CONTACTS</label>{Object.entries(people).map(([name, person]) => <button className={selected === name ? "selected" : ""} key={name} onClick={() => onSelect(name)}><i style={{ background: person.colour }} />{name}<small>{person.status.split(" — ")[0]}</small></button>)}</aside><div className="chat-view"><header><span className="avatar small">{selected[0]}</span><div><strong>{selected}</strong><small>{people[selected].status}</small></div></header><div className="chat-history">{people[selected].chat.map((message, i) => <div key={i} className={`bubble ${message.from}`}><span>{message.text}</span><time>{message.time}</time></div>)}</div><form className="chat-input" onSubmit={e => { e.preventDefault(); onSend(); }}><input value={draft} onChange={e => onDraft(e.target.value)} placeholder="Type a message..." /><button>Send</button></form></div></div>; }

function FileExplorer({ onOpen }: { onOpen: (file: string) => void }) { const [folder, setFolder] = useState("C:\\HedgeCo"); const files = folder === "C:\\HedgeCo" ? [["Research", "folder"], ["Reports", "folder"], ["research.txt", "text"], ["readme.txt", "text"]] : folder.includes("Research") ? [["NOVA-notes.txt", "text"], ["market-rumours.url", "text"]] : [["Q4-projections.xls", "report"], ["risk-register.txt", "text"]]; return <div className="files-app"><div className="file-toolbar"><button onClick={() => setFolder("C:\\HedgeCo")}>← Up</button><input value={folder} readOnly /><button>🔍 Find</button></div><div className="file-body"><aside><strong>My Computer</strong><button onClick={() => setFolder("C:\\HedgeCo")}>📁 C: (HedgeCo)</button><button onClick={() => setFolder("C:\\HedgeCo\\Research")}>📁 Research</button><button onClick={() => setFolder("C:\\HedgeCo\\Reports")}>📁 Reports</button></aside><div className="file-list"><div className="file-head">Name <span>Type</span><span>Modified</span></div>{files.map(([name, type]) => <button key={name} onDoubleClick={() => type === "folder" ? setFolder(`${folder}\\${name}`) : onOpen(name)}><span className="file-icon">{type === "folder" ? "📁" : "📄"}</span><strong>{name}</strong><span>{type === "folder" ? "File folder" : "Text document"}</span><span>15/11/1999</span></button>)}</div></div><div className="file-status">{files.length} object(s) · Simulated filesystem</div></div>; }

function StartMenu({ onOpen, onWallpaper }: { onOpen: (id: AppId) => void; onWallpaper: (value: string) => void }) { return <div className="start-menu" onClick={e => e.stopPropagation()}><div className="start-banner"><b>Y2K</b><span>OS</span></div><div className="start-items"><button onClick={() => onOpen("terminal")}>📈 <strong>Market Terminal</strong></button><button onClick={() => onOpen("mail")}>✉ Outlook Express</button><button onClick={() => onOpen("browser")}>🌐 Internet Explorer</button><button onClick={() => onOpen("messenger")}>💬 MSN Messenger</button><button onClick={() => onOpen("files")}>📁 My Computer</button><hr /><button onClick={() => onWallpaper("desktop-image.jpg")}>🖼 Bliss wallpaper</button><button onClick={() => window.location.reload()}>↻ Restart mock session</button></div></div>; }

export default App;