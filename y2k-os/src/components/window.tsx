import type { MouseEvent, ReactNode } from "react";
import type { WindowState } from "../domain/types";

type Props = { state: WindowState; onFocus: () => void; onClose: () => void; onChange: (changes: Partial<WindowState>) => void; children: ReactNode };

export default function Window({ state, onFocus, onClose, onChange, children }: Props) {
  const style = state.maximized ? { left: 0, top: 0, width: "100%", height: "calc(100% - 34px)", zIndex: state.z } : { left: state.x, top: state.y, width: state.w, height: state.h, zIndex: state.z };
  const beginDrag = (event: MouseEvent<HTMLElement>) => {
    if (state.maximized || (event.target as HTMLElement).closest("button")) return;
    onFocus();
    const startX = event.clientX; const startY = event.clientY;
    const move = (moveEvent: globalThis.MouseEvent) => onChange({ x: Math.max(0, state.x + moveEvent.clientX - startX), y: Math.max(0, state.y + moveEvent.clientY - startY) });
    const stop = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", stop); };
    document.addEventListener("mousemove", move); document.addEventListener("mouseup", stop);
  };
  return <section className="app-window" style={style} onMouseDown={onFocus}><header className="titlebar" onMouseDown={beginDrag} onDoubleClick={() => onChange({ maximized: !state.maximized })}><span className="title-icon">▣</span><strong>{state.title}</strong><div className="window-controls"><button aria-label="Minimize" onClick={() => onChange({ minimized: true })}>_</button><button aria-label="Maximize" onClick={() => onChange({ maximized: !state.maximized })}>□</button><button aria-label="Close" onClick={onClose}>×</button></div></header><div className="window-body">{children}</div></section>;
}
