import type { ReactNode } from "react";
import myComputer from "../assets/my-computer.svg";
import internetExplorer from "../assets/internet-explorer.svg";
import messenger from "../assets/messenger.svg";
import mail from "../assets/Mail.svg";
import terminal from "../assets/Y2K-os-Logo.svg";
import defaultWallpaper from "../assets/wallpapers/desktop-image.jpg";
import type { AppId } from "../domain/types";

const icons: { id: AppId; label: string; image: string }[] = [
  { id: "files", label: "My Computer", image: myComputer }, { id: "browser", label: "Internet Explorer", image: internetExplorer },
  { id: "messenger", label: "MSN Messenger", image: messenger }, { id: "mail", label: "Outlook Express", image: mail }, { id: "terminal", label: "Market Terminal", image: terminal },
];

export default function Desktop({ date, danger, wallpaper = defaultWallpaper, onOpen, onSurfaceClick, children }: { date: string; danger: boolean; wallpaper?: string; onOpen: (id: AppId) => void; onSurfaceClick?: () => void; children: ReactNode }) {
  return <main className="desktop" style={{ backgroundImage: `url("${wallpaper}")` }} onClick={onSurfaceClick}><div className="desktop-shade" /><div className="desktop-icons">{icons.map(icon => <button className="desktop-icon" key={icon.id} onDoubleClick={() => onOpen(icon.id)}><img src={icon.image} alt="" /><span>{icon.label}</span></button>)}</div><div className="mission"><strong>Y2K OS // TRADING DESK</strong><span>Objective: grow the fund before the crash window</span><em className={danger ? "danger" : ""}>{date} · London 09:00</em></div>{children}</main>;
}
