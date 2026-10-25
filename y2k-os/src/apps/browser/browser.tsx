import { useEffect, useState, type ReactNode } from "react";
import type { GeneratedNews } from "../../services/aiContent";

type PageId = "home" | "finance" | "penguin" | "ebay" | "youtube" | "forum" | "report";
type Props = { page: string; onNavigate: (page: string) => void; news?: GeneratedNews[] };
const link = (id: PageId, label: string, navigate: (id: PageId) => void) => <button className="web-link" onClick={() => navigate(id)}>{label}</button>;

function Nottingham({ navigate, news = [] }: { navigate: (id: PageId) => void; news?: GeneratedNews[] }) {
  const latest = news.at(-1); return <article className="news-site"><header><b>NOTTINGHAM</b><strong>FINANCIAL</strong><small>THE INTERNET'S MOST TRUSTED SOURCE OF MARKET RUMOUR</small></header><nav>{link("finance", "Markets", navigate)} {link("finance", "Archive", navigate)} {link("home", "Directory", navigate)}</nav><h1>{latest?.headline ?? "Week 1: Technology stocks keep the dial-up dream alive"}</h1><time>{latest?.publishedAt ?? "15 November 1999"} · Nottingham</time><p className="lead">{latest?.summary ?? "Investors are watching HCKSOC and CAPONE closely as the new week opens with optimism on the technology desk."}</p><p>{latest?.body ?? "Analysts caution that confidence remains more fashionable than revenue. TELLUV's fibre infrastructure offers a defensive counterweight as funds consider the road to the millennium."}</p><hr /><b>Archive</b><p>{news.length ? news.map(item => `Week ${item.week}`).join(" · ") : "Week 1 · Week 2 · Week 3 · Week 4 · Week 5"}</p></article>;
}
function MockSite({ kind, navigate }: { kind: PageId; navigate: (id: PageId) => void }) {
  const sites: Record<PageId, { brand: string; title: string; body: string }> = {
    penguin: { brand: "Penguin Palace", title: "Welcome to the coolest place on the web!", body: "Waddle through snowy rooms, collect colourful pins, and remember: never give your password to anyone on the internet." },
    ebay: { brand: "eBay", title: "The world's online marketplace", body: "Featured auctions: Rare Beanie Baby · Used V.90 modem · Y2K survival kit · Signed dot-com prospectus. Search 2,000 categories." },
    youtube: { brand: "YouTube", title: "Broadcast yourself (eventually)", body: "Featured clips: Cat at the keyboard · Nottingham office tour · How to configure your modem. 56K recommended." },
    forum: { brand: "The Money Pit", title: "Message board: Is HCKSOC the next big thing?", body: "bullmarket99: My cousin's barber says buy. reasonable: That is not research. bullmarket99: It is on the internet." },
    report: { brand: "HEDGECO ARCHIVE", title: "Q4 projections — internal", body: "A simulated document from the Y2K OS. Risk note: enthusiasm is not a hedging strategy." },
    home: { brand: "AltaVista", title: "Welcome to the web", body: "Search the web, or visit one of our recommended places." },
    finance: { brand: "Nottingham Financial", title: "Market archive", body: "Select a story from the archive, or return to the latest bulletin." },
  };
  const site = sites[kind]; return <article className={`mock-site ${kind}`}><h1>{site.brand}</h1><nav>{link("finance", "Nottingham Financial", navigate)} {link("penguin", "Penguin Palace", navigate)} {link("ebay", "eBay", navigate)} {link("youtube", "YouTube", navigate)}</nav><h2>{site.title}</h2><p>{site.body}</p><input placeholder={kind === "ebay" ? "Search auctions" : "Search"} /><button onClick={() => alert("This is a simulated Y2K website.")}>Search</button></article>;
}

export default function BrowserApp({ page, onNavigate, news }: Props) {
  const [history, setHistory] = useState<string[]>([page]); const [index, setIndex] = useState(0); const [refresh, setRefresh] = useState(0);
  useEffect(() => { if (history[index] !== page) setHistory(value => [...value.slice(0, index + 1), page]); }, [page]);
  const navigate = (next: PageId) => { setHistory(value => [...value.slice(0, index + 1), next]); setIndex(value => value + 1); onNavigate(next); };
  const current = (history[index] || page) as PageId;
  let content: ReactNode = current === "finance" ? <Nottingham navigate={navigate} news={news} /> : <MockSite kind={current} navigate={navigate} />;
  if (current === "home") content = <MockSite kind="home" navigate={navigate} />;
  return <div className="browser-app"><div className="browser-tabs"><button className="tab active">🌐 {current}.y2k ×</button><button>＋</button></div><div className="browser-toolbar"><button onClick={() => { if (index > 0) { setIndex(index - 1); onNavigate(history[index - 1]); } }} disabled={index === 0}>←</button><button onClick={() => { if (index < history.length - 1) { setIndex(index + 1); onNavigate(history[index + 1]); } }} disabled={index === history.length - 1}>→</button><button onClick={() => setRefresh(value => value + 1)}>↻</button><button onClick={() => navigate("home")}>⌂</button><input value={`http://${current}.y2k`} readOnly /></div><div className="browser-content" key={refresh}>{content}</div><div className="browser-status">Done · Simulated web page · History {index + 1} of {history.length}</div></div>;
}
