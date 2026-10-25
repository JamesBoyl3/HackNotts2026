import type { Contacts, Mail, SimulatedFile, Stock } from "./types";

export const stocks: Stock[] = [
  { symbol: "NOVA", name: "Novacore Systems", sector: "Technology", price: 82.4, change: 4.8, spark: [55, 61, 59, 67, 64, 76, 82], blurb: "Enterprise networking hardware. Orders are accelerating ahead of its Y2K-proof launch." },
  { symbol: "PXL", name: "PixelForge Online", sector: "Internet", price: 146.2, change: -2.1, spark: [160, 156, 162, 151, 157, 149, 146], blurb: "A fashionable online marketplace with more page views than revenue." },
  { symbol: "GRN", name: "Greenlight Energy", sector: "Utilities", price: 38.75, change: 1.2, spark: [34, 35, 33, 36, 35, 37, 38], blurb: "Steady regional utility with a surprisingly exciting fibre subsidiary." },
  { symbol: "MTRX", name: "Matrix Microdevices", sector: "Semiconductors", price: 61.15, change: 7.4, spark: [42, 45, 43, 49, 52, 57, 61], blurb: "Chip designer claiming it has solved every computer problem at once." },
  { symbol: "BELL", name: "Bellwether Telecom", sector: "Telecoms", price: 24.9, change: -5.6, spark: [31, 29, 30, 27, 28, 26, 24], blurb: "Long-distance calls, short-term debt, and an optimistic annual report." },
];

export const initialMail: Mail[] = [
  { id: 1, sender: "M. Patel — Research", subject: "NOVA: the order book is real", time: "08:42", tag: "Research", unread: true, body: "Morning.\n\nThe Novacore order book is not just conference-room vapour. Two European carriers have quietly pulled their December installs forward. I would not chase the price, but a small position before the next filing looks defensible.\n\n— Mira" },
  { id: 2, sender: "R. Finch — CFO", subject: "RE: Monday positions", time: "07:58", tag: "Internal", unread: true, body: "Team,\n\nRemember that we are paid to remain solvent. The internet is not a business model until somebody can explain the business part.\n\nPlease have exposure and exit levels on my desk before lunch." },
  { id: 3, sender: "The Daily Byte", subject: "Dot-coms discover the concept of gravity", time: "Fri 16:10", tag: "News", unread: false, body: "SAN FRANCISCO — A leading web concern has announced it will monetise its homepage by selling pixels individually. Analysts called the plan 'visionary' and immediately bought more pixels." },
  { id: 4, sender: "unknown@free-cash.net", subject: "URGENT: guaranteed 400% return", time: "Fri 02:13", tag: "Junk", unread: false, body: "Dear respected investor,\n\nYou have been selected to participate in an extremely legitimate opportunity. Please send your account details and a small processing fee." },
  { id: 5, sender: "Helen — London Office", subject: "RE: tea rota / mysterious attachment", time: "Thu 11:24", tag: "Personal", unread: false, body: "I found the strange disk in the printer room. It is labelled 'Q4 projections — do not open'. Naturally, I opened it. The spreadsheet contains three tabs and one very rude macro." },
];

export const initialContacts: Contacts = {
  "Mira Patel": { status: "Online — Research", colour: "#52a447", chat: [{ from: "them", text: "Have you seen NOVA this morning?", time: "08:47" }, { from: "me", text: "Watching it. The order book sounds promising.", time: "08:49" }, { from: "them", text: "Promising is a dangerous word before coffee.", time: "08:50" }] },
  "Helen Finch": { status: "Away — Boardroom", colour: "#e0a42b", chat: [{ from: "them", text: "The board is discussing a 'web strategy'. Send help.", time: "08:15" }] },
  "Dave from IT": { status: "Busy — Y2K bunker", colour: "#d75c3b", chat: [{ from: "them", text: "Please stop opening suspicious attachments.", time: "Yesterday" }] },
  "Alan Greensocks": { status: "Offline", colour: "#888", chat: [] },
};

export const simulatedFiles: SimulatedFile[] = [
  { name: "Research", kind: "folder", modified: "15/11/1999", children: [{ name: "NOVA-notes.txt", kind: "text", modified: "15/11/1999" }, { name: "market-rumours.url", kind: "text", modified: "15/11/1999", openAs: "forum" }] },
  { name: "Reports", kind: "folder", modified: "15/11/1999", children: [{ name: "Q4-projections.xls", kind: "report", modified: "15/11/1999", openAs: "report" }, { name: "risk-register.txt", kind: "text", modified: "15/11/1999" }] },
  { name: "research.txt", kind: "text", modified: "15/11/1999", openAs: "forum" },
  { name: "readme.txt", kind: "text", modified: "15/11/1999" },
];

export const sessionDates = ["15 Nov 1999", "22 Nov 1999", "06 Dec 1999", "10 Jan 2000", "07 Feb 2000", "13 Mar 2000", "17 Apr 2000", "15 May 2000"];
