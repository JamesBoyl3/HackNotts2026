export type AppId = "terminal" | "mail" | "browser" | "messenger" | "files";

export type WindowState = {
  id: AppId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  z: number;
};

export type Stock = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  spark: number[];
  blurb: string;
};

export type Position = { symbol: string; shares: number; average: number };
export type OrderSide = "buy" | "sell";
export type OrderResult = { ok: boolean; message: string };

export type Mail = {
  id: number;
  sender: string;
  subject: string;
  time: string;
  body: string;
  unread: boolean;
  tag: string;
};

export type Chat = { from: "them" | "me"; text: string; time: string };
export type Contact = { status: string; colour: string; chat: Chat[] };
export type Contacts = Record<string, Contact>;
export type GameSession = { dateIndex: number; date: string; phase: "active" | "crash-window" };

export type SimulatedFile = {
  name: string;
  kind: "folder" | "text" | "report";
  modified: string;
  children?: SimulatedFile[];
  openAs?: "forum" | "report";
};

export type FileOpenResult =
  | { kind: "browser-page"; pageId: string }
  | { kind: "text"; file: SimulatedFile }
  | { kind: "unsupported"; file: SimulatedFile };
