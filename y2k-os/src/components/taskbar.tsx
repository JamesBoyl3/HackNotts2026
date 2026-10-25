import type { AppId, WindowState } from "../domain/types";

export function StartMenu({ onOpen, onWallpaper, onRestart }: { onOpen: (id: AppId) => void; onWallpaper: (wallpaper: string) => void; onRestart: () => void }) {
  return <div className="start-menu" onClick={event => event.stopPropagation()}><div className="start-banner"><b>Y2K</b><span>OS</span></div><div className="start-items"><button onClick={() => onOpen("terminal")}>📈 <strong>Market Terminal</strong></button><button onClick={() => onOpen("mail")}>✉ Outlook Express</button><button onClick={() => onOpen("browser")}>🌐 Internet Explorer</button><button onClick={() => onOpen("messenger")}>💬 MSN Messenger</button><button onClick={() => onOpen("files")}>📁 My Computer</button><hr /><button onClick={() => onWallpaper("default")}>🖼 Bliss wallpaper</button><button onClick={() => onRestart()}>↻ Restart mock session</button></div></div>;
}

export default function Taskbar({ windows, onToggleStart, onWindow, clock }: { windows: WindowState[]; onToggleStart: () => void; onWindow: (id: AppId) => void; clock: string }) {
  return <footer className="taskbar"><button className="start-button" onClick={onToggleStart}><span className="windows-mark">Y2K</span> Start</button>{windows.map(window => <button key={window.id} className={`task-button ${window.minimized ? "" : "active"}`} onClick={() => onWindow(window.id)}>▣ {window.title}</button>)}<div className="tray"><span className="mock-badge">TRADING CLOCK</span><span>🔊</span><time>{clock}</time></div></footer>;
}
