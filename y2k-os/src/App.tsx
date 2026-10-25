import { useEffect, useState } from "react";
import "./App.css";
import BrowserApp from "./apps/browser/browser";
import EmailApp from "./apps/email/email";
import FileExplorer from "./apps/file-explorer/file-explorer";
import MarketTerminal from "./apps/terminal/MarketTerminal";
import MessengerApp from "./apps/messenger/messenger";
import { applications } from "./app/applicationRegistry";
import Desktop from "./components/desktop";
import Taskbar, { StartMenu } from "./components/taskbar";
import Window from "./components/window";
import type { AppId, FileOpenResult, WindowState } from "./domain/types";
import defaultWallpaper from "./assets/wallpapers/desktop-image.jpg";
import { useGameState } from "./state/useGameState";

export default function App() {
  const game = useGameState();
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [zIndex, setZIndex] = useState(1);
  const [startOpen, setStartOpen] = useState(false);
  const [browserPage, setBrowserPage] = useState("home");
  const [browserEntry, setBrowserEntry] = useState(0);
  const [selectedMail, setSelectedMail] = useState(0);
  const [selectedContact, setSelectedContact] = useState("Mira Patel");
  const [chatDraft, setChatDraft] = useState("");
  const [wallpaper, setWallpaper] = useState(defaultWallpaper);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => window.clearInterval(timer); }, []);

  const focus = (id: AppId) => {
    setZIndex(value => value + 1);
    setWindows(current => current.map(window => window.id === id ? { ...window, minimized: false, z: zIndex + 1 } : window));
  };
  const openApp = (id: AppId) => {
    setStartOpen(false);
    setWindows(current => {
      const existing = current.find(window => window.id === id);
      if (existing) return current.map(window => window.id === id ? { ...window, minimized: false, z: zIndex + 1 } : window);
      const definition = applications[id]; const offset = current.length * 24;
      return [...current, { id, title: definition.title, x: 100 + offset, y: 44 + offset, w: definition.width, h: definition.height, minimized: false, maximized: false, z: zIndex + 1 }];
    });
    setZIndex(value => value + 1);
  };
  const close = (id: AppId) => setWindows(current => current.filter(window => window.id !== id));
  const changeWindow = (id: AppId, changes: Partial<WindowState>) => setWindows(current => current.map(window => window.id === id ? { ...window, ...changes } : window));
  const toggleTaskWindow = (id: AppId) => {
    const window = windows.find(item => item.id === id);
    if (window?.minimized) focus(id); else if (window) changeWindow(id, { minimized: true });
  };
  const openFile = (result: FileOpenResult) => {
    if (result.kind === "browser-page") { setBrowserPage(result.pageId); setBrowserEntry(value => value + 1); openApp("browser"); }
    else if (result.kind === "unsupported") setBrowserPage("report");
  };
  const renderApplication = (id: AppId) => {
    if (id === "terminal") return <MarketTerminal cash={game.cash} positions={game.positions} value={game.totalValue} date={game.session.date} lastOrder={game.lastOrder} onOrder={game.placeOrder} onAdvance={game.advance} />;
    if (id === "mail") return <EmailApp mails={game.mails} selected={selectedMail} onSelect={index => { setSelectedMail(index); game.markMailRead(index); }} />;
    if (id === "browser") return <BrowserApp key={browserEntry} page={browserPage} onNavigate={setBrowserPage} />;
    if (id === "messenger") return <MessengerApp selected={selectedContact} contacts={game.contacts} draft={chatDraft} onDraft={setChatDraft} onSelect={setSelectedContact} onSend={() => { if (chatDraft.trim()) { game.sendMessage(selectedContact, chatDraft.trim()); setChatDraft(""); } }} />;
    return <FileExplorer onOpen={openFile} />;
  };

  return <Desktop date={game.session.date} danger={game.session.phase === "crash-window"} wallpaper={wallpaper} onOpen={openApp} onSurfaceClick={() => startOpen && setStartOpen(false)}>
    {windows.map(window => !window.minimized && <Window key={window.id} state={window} onFocus={() => focus(window.id)} onClose={() => close(window.id)} onChange={changes => changeWindow(window.id, changes)}>{renderApplication(window.id)}</Window>)}
    {startOpen && <StartMenu onOpen={openApp} onWallpaper={() => setWallpaper(defaultWallpaper)} onRestart={() => { game.restart(); setWindows([]); setStartOpen(false); }} />}
    <Taskbar windows={windows} onToggleStart={() => setStartOpen(value => !value)} onWindow={toggleTaskWindow} clock={clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
  </Desktop>;
}
