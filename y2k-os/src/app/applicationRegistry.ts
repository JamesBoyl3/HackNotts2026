import type { AppId } from "../domain/types";
import y2kLogo from "../assets/Y2K-os-Logo.svg";
import mail from "../assets/Mail.svg";
import browser from "../assets/internet-explorer.svg";
import messenger from "../assets/messenger.svg";
import files from "../assets/my-computer.svg";

export const applications: Record<AppId, { id: AppId; title: string; icon: string; width: number; height: number }> = {
  terminal: { id: "terminal", title: "Market Terminal", icon: y2kLogo, width: 820, height: 540 },
  mail: { id: "mail", title: "Outlook Express", icon: mail, width: 700, height: 470 },
  browser: { id: "browser", title: "Internet Explorer", icon: browser, width: 700, height: 470 },
  messenger: { id: "messenger", title: "MSN Messenger", icon: messenger, width: 700, height: 470 },
  files: { id: "files", title: "My Computer", icon: files, width: 700, height: 470 },
};
