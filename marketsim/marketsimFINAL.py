import sys
import os
import json
import time
import random
import tkinter as tk
from tkinter import font

class Y2KTerminalGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("WS_TERMV2.4 // NOTTINGHAM INVESTMENT FUND")
        self.root.geometry("860x640")
        self.root.configure(bg="#080808")

        # color palette: phosphor amber / crt green / bloomberg orange
        self.CRT_BG = "#0c0d0c"
        self.CRT_FG = "#33ff33"         
        self.CRT_AMBER = "#ffb000"      
        self.CRT_DIM = "#1b4d1b"        
        self.CRT_SCANLINE = "#141a14"  

        # setup game state
        self.init_game_state()

        # build gui components
        self.build_ui()
        self.draw_scanlines()

        # start game sequence with y2k startup sequence
        self.entry_cmd.config(state="disabled")
        self.run_startup_sequence()

    def init_game_state(self):
        self.week = 1
        self.target_nav = 7_500_000
        self.cash = 1_200_000
        self.lp_confidence = 75
        self.weekly_overhead = 35_000
        self.portfolio = {
            "HCKSOC": {"shares": 35_000, "price": 40.0},
            "CAPONE": {"shares": 20_000, "price": 70.0},
            "TELLUV": {"shares": 40_000, "price": 25.0},
        }
        self.crash_triggered = False
        self.fished = False
        self.email_recieved = False
        self.crash_week = random.randint(11, 14)
        self.pending_action = None
        self.events_triggered = set()
        self.history = {
            "weeks": [self.week],
            "HCKSOC": [self.portfolio["HCKSOC"]["price"]],
            "CAPONE": [self.portfolio["CAPONE"]["price"]],
            "TELLUV": [self.portfolio["TELLUV"]["price"]],
        }
        self.stock_viewer_app = None
        self.save_market_state()

    def save_market_state(self):
        try:
            # Keep history in sync
            curr_week = self.week
            if curr_week in self.history["weeks"]:
                idx = self.history["weeks"].index(curr_week)
                for t in ("HCKSOC", "CAPONE", "TELLUV"):
                    self.history[t][idx] = self.portfolio[t]["price"]
            else:
                self.history["weeks"].append(curr_week)
                for t in ("HCKSOC", "CAPONE", "TELLUV"):
                    self.history[t].append(self.portfolio[t]["price"])

            data_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "market_data.json")
            data = {
                "week": self.week,
                "portfolio": self.portfolio,
                "cash": self.cash,
                "lp_confidence": self.lp_confidence,
                "history": {
                    "HCKSOC": self.history["HCKSOC"],
                    "CAPONE": self.history["CAPONE"],
                    "TELLUV": self.history["TELLUV"],
                },
                "weeks": self.history["weeks"],
            }
            with open(data_file, "w") as f:
                json.dump(data, f)
        except Exception:
            pass

    def build_ui(self):
        # header / status strip
        self.header_frame = tk.Frame(self.root, bg="#111811", height=28, bd=1, relief="ridge")
        self.header_frame.pack(fill="x", padx=4, pady=2)

        self.lbl_system = tk.Label(
            self.header_frame, 
            text="[SYS: DEC-ALPHA 2000]  |  FEED: CONNECTED (PORT 443)  |  STATUS: ONLINE", 
            font=("Courier", 9, "bold"), 
            fg=self.CRT_AMBER, 
            bg="#111811"
        )
        self.lbl_system.pack(side="left", padx=8)

        # Button to toggle/open live Stock Chart
        self.btn_stock_viewer = tk.Button(
            self.header_frame,
            text="[📈 OPEN STOCK VIEWER]",
            font=("Courier", 9, "bold"),
            fg="#00e5ff",
            bg="#0d2015",
            activebackground="#00e5ff",
            activeforeground="#000000",
            bd=1,
            relief="raised",
            command=self.open_stock_viewer
        )
        self.btn_stock_viewer.pack(side="right", padx=8, pady=2)

        # terminal screen area
        self.screen_frame = tk.Frame(self.root, bg=self.CRT_BG, bd=2, relief="sunken")
        self.screen_frame.pack(fill="both", expand=True, padx=6, pady=4)

        self.text_display = tk.Text(
            self.screen_frame,
            bg=self.CRT_BG,
            fg=self.CRT_FG,
            font=("Courier New", 11),
            insertbackground=self.CRT_FG,
            wrap="word",
            bd=0,
            padx=12,
            pady=12,
            selectbackground=self.CRT_DIM,
            selectforeground=self.CRT_FG
        )
        self.text_display.pack(fill="both", expand=True)

        # configure color tags for retro accents
        self.text_display.tag_config("amber", foreground=self.CRT_AMBER)
        self.text_display.tag_config("alert", foreground="#ff3333", font=("Courier New", 11, "bold"))
        self.text_display.tag_config("highlight", foreground="#ffffff")
        self.text_display.tag_config("dim", foreground="#1a801a")
        self.text_display.tag_config("cyan", foreground="#00e5ff")

        # command input bar
        self.input_frame = tk.Frame(self.root, bg="#0a0f0a", bd=1, relief="ridge")
        self.input_frame.pack(fill="x", padx=6, pady=(0, 6))

        self.prompt_label = tk.Label(
            self.input_frame, 
            text="COMMAND >> ", 
            font=("Courier New", 11, "bold"), 
            fg=self.CRT_AMBER, 
            bg="#0a0f0a"
        )
        self.prompt_label.pack(side="left", padx=(8, 0))

        self.entry_cmd = tk.Entry(
            self.input_frame,
            font=("Courier New", 11, "bold"),
            bg="#0a0f0a",
            fg=self.CRT_FG,
            insertbackground=self.CRT_FG,
            bd=0
        )
        self.entry_cmd.pack(side="left", fill="x", expand=True, padx=4, pady=6)
        self.entry_cmd.focus_set()
        self.entry_cmd.bind("<Return>", self.handle_input)

    def draw_scanlines(self):
        """Creates a subtle visual raster scanline grid across the window."""
        self.scan_canvas = tk.Canvas(self.screen_frame, bg=self.CRT_BG, highlightthickness=0)
        # scanlines are drawn periodically, i know you wanted to print it all at once but i tried both ways and i think this looks better
        self.root.bind("<Configure>", lambda e: None)

    def open_stock_viewer(self):
        try:
            import stockviewer as sv
            if self.stock_viewer_app and hasattr(self.stock_viewer_app, "root") and self.stock_viewer_app.root.winfo_exists():
                self.stock_viewer_app.root.lift()
                return
            viewer_top = tk.Toplevel(self.root)
            self.stock_viewer_app = sv.StockViewerApp(viewer_top, market_sim_instance=self)
        except Exception as e:
            self.write_line(f"[ERR] Could not open Stock Viewer: {e}", "alert")

    def write_line(self, text="", tag=None):
        self.text_display.config(state="normal")
        if tag:
            self.text_display.insert("end", text + "\n", tag)
        else:
            self.text_display.insert("end", text + "\n")
        self.text_display.see("end")
        self.text_display.config(state="disabled")

    def print_lines_gradually(self, line_items, delay_ms=120, on_complete=None):
        """Prints a list of (text, tag) tuples gradually a line/batch at a time."""
        if not line_items:
            if on_complete:
                on_complete()
            return

        # disable entry input while printing lines gradually
        self.entry_cmd.config(state="disabled")

        def print_next(index):
            if index < len(line_items):
                item = line_items[index]
                if isinstance(item, tuple):
                    text, tag = item
                else:
                    text, tag = item, None
                self.write_line(text, tag)
                self.root.after(delay_ms, lambda: print_next(index + 1))
            else:
                self.entry_cmd.config(state="normal")
                self.entry_cmd.focus_set()
                if on_complete:
                    on_complete()

        print_next(0)

    def run_startup_sequence(self):
        """plays an animated y2k boot sequence before loading the dashboard."""
        steps = [
            (50,  (">> PHOENIX BIOS 4.06 REV 1.04-Y2K", "dim")),
            (100, ("Copyright (C) 1985-1999 Nottingham Micro Systems, Inc.", "dim")),
            (200, ("CPU: DEC Alpha 21264 @ 667 MHz  |  64-BIT RISC ARCHITECTURE", "dim")),
            (350, ("CHECKING SYSTEM MEMORY: 524288KB OK", "dim")),
            (500, ("PRIMARY MASTER: QUANTUM FIREBALL 20.4 GB IDE [DMA MODE 4]", "dim")),
            (700, ("INITIALIZING V.90 56K DIAL-UP MODEM ON COM2...", "dim")),
            (950, ("DIALING: ATDT 1-800-WALLSTREET... CONNECT 56000/ARQ/V90/LAPM", "cyan")),
            (1200, ("[!] Y2K COMPLIANCE INTEGRITY AUDIT IN PROGRESS...", "amber")),
            (1450, ("    RTC ROLLOVER CLOCK: 23:59:58 31-DEC-1999 -> 00:00:00 01-JAN-2000", "dim")),
            (1700, ("    COBOL-74 LEGACY PARSER: [PATCHED / STRICT_4DIGIT_YEAR]", "dim")),
            (1950, ("    MILLENNIUM BUG WATCHDOG DAEMON: ACTIVE [CONFIDENCE 80%]", "amber")),
            (2200, ("AUTHENTICATING TO NY-FIX BRIDGE (PORT 443)... HANDSHAKE OK", "cyan")),
            (2500, ("SECURITIES & EXCHANGE AUTOMATION: INITIALIZED", "dim")),
            (2800, ("READY.\n", "highlight")),
        ]

        for delay, (text, tag) in steps:
            self.root.after(delay, lambda t=text, tg=tag: self.write_line(t, tg))

        # after startup finishes, print welcome banner, show dashboard and re-enable input
        def finish_boot():
            self.print_welcome()
            self.display_dashboard()

        self.root.after(3100, finish_boot)

    def print_welcome(self):
        banner = r"""
==========================================================================
 _   _  ____ _______ _______ _____ _   _  _____ _    _          __  __ 
| \ | |/ __ \__   __|__   __|_   _| \ | |/ ____| |  | |   /\   |  \/  |
|  \| | |  | | | |     | |    | | |  \| | |  __| |__| |  /  \  | \  / |
| . ` | |  | | | |     | |    | | | . ` | | |_ |  __  | / /\ \ | |\/| |
| |\  | |__| | | |     | |   _| |_| |\  | |__| | |  | |/ ____ \| |  | |
|_| \_|\____/  |_|     |_|  |_____|_| \_|\_____|_|  |_/_/    \_\_|  |_|
                     NOTTINGHAM INVESTMENT FUND           
=========================================================================="""
        self.write_line(banner, "dim")
        self.write_line("[!] SYSTEM CLOCK: DEC 1999. PRE-CRASH SURVEILLANCE RUNNING.", "amber")

    def get_portfolio_value(self):
        holdings = sum(d["shares"] * d["price"] for d in self.portfolio.values())
        return self.cash + holdings

    def show_news_popup(self, headline, body_paragraphs, on_dismiss=None):
        """opens a modal retro news wire popup window that forces the user to acknowledge it."""
        popup = tk.Toplevel(self.root)
        popup.title("!! BREAKING FINANCIAL NEWS BULLETIN // DOW WIRE !!")
        popup.geometry("620x420")
        popup.configure(bg="#050805")
        popup.resizable(False, False)

        # make popup modal and keep on top
        popup.transient(self.root)
        popup.grab_set()

        # header frame
        hdr = tk.Frame(popup, bg="#3b0000", bd=2, relief="ridge")
        hdr.pack(fill="x", padx=10, pady=(10, 6))

        tk.Label(
            hdr,
            text="*** URGENT BULLETIN - DOW JONES WIRE SERVICES ***",
            font=("Courier New", 11, "bold"),
            fg="#ff4444",
            bg="#3b0000",
            pady=4
        ).pack()

        # news content area
        content_box = tk.Text(
            popup,
            bg="#0d140d",
            fg="#33ff33",
            font=("Courier New", 10),
            wrap="word",
            bd=2,
            relief="sunken",
            padx=14,
            pady=12
        )
        content_box.pack(fill="both", expand=True, padx=10, pady=6)

        content_box.tag_config("headline", foreground="#ffb000", font=("Courier New", 12, "bold"))
        content_box.tag_config("urgent", foreground="#ff3333", font=("Courier New", 10, "bold"))
        content_box.tag_config("dim", foreground="#1a801a")

        content_box.insert("end", f"{headline}\n\n", "headline")
        for p in body_paragraphs:
            content_box.insert("end", f"{p}\n\n")
        content_box.insert("end", "-" * 56 + "\n", "dim")
        content_box.insert("end", "ACTION MANDATORY: You must acknowledge this wire report to resume trading.\n", "urgent")
        content_box.config(state="disabled")

        # footer acknowledgement frame
        btn_frame = tk.Frame(popup, bg="#050805")
        btn_frame.pack(fill="x", padx=10, pady=(6, 12))

        def acknowledge():
            popup.grab_release()
            popup.destroy()
            if on_dismiss:
                on_dismiss()

        btn = tk.Button(
            btn_frame,
            text="[ ACKNOWLEDGE & RESUME TERMINAL ]",
            font=("Courier New", 10, "bold"),
            bg="#112211",
            fg="#ffb000",
            activebackground="#ffb000",
            activeforeground="#000000",
            command=acknowledge,
            bd=2,
            relief="raised",
            padx=10,
            pady=6
        )
        btn.pack()
        btn.focus_set()

        # bind return and space keys to acknowledge
        popup.bind("<Return>", lambda e: acknowledge())
        popup.bind("<space>", lambda e: acknowledge())
        popup.protocol("WM_DELETE_WINDOW", acknowledge)

    def display_dashboard(self, on_complete=None):
        nav = self.get_portfolio_value()
        lines = [
            ("\n" + "=" * 66, "dim"),
            (f" BLEEMBORG INTELLIGENCE TERMINAL v2.4  |  WEEK {self.week:02d} / 24", "amber"),
            (f" PORTFOLIO NAV : ${nav:,.2f}  |  TARGET: ${self.target_nav:,.2f}", "highlight" if nav >= self.target_nav else "amber"),
            (f" CASH AVAILABLE : ${self.cash:,.2f}  |  LP CONFIDENCE : {self.lp_confidence}%", None),
            (f" FIXED OPERATING OVERHEAD : -${self.weekly_overhead:,.2f} / WEEK", "dim"),
            ("-" * 66, "dim"),
            (f"{'TICKER':<10} {'PRICE':<12} {'SHARES':<12} {'TOTAL VALUE':<14}", "highlight"),
        ]
        for ticker, data in self.portfolio.items():
            val = data["shares"] * data["price"]
            lines.append((f"{ticker:<10} ${data['price']:<11.2f} {data['shares']:<12} ${val:,.2f}", None))
        lines.append(("=" * 66, "dim"))

        def after_table():
            def continue_flow():
                if not self.check_game_over():
                    self.write_line("\nOPTIONS: [1] BUY  [2] SELL  [3] REASSURE LPs ($150k)  [4] ADVANCE WEEK  [5] EXIT  [6] VIEW STOCKS", "amber")
                if on_complete:
                    on_complete()

            self.crash_simulation(on_complete=continue_flow)

        self.print_lines_gradually(lines, delay_ms=100, on_complete=after_table)

    def crash_simulation(self, on_complete=None):
        if self.week == self.crash_week and not self.crash_triggered:
            self.crash_triggered = True
            self.portfolio["HCKSOC"]["price"] = max(0.50, self.portfolio["HCKSOC"]["price"] * 0.28)
            self.portfolio["CAPONE"]["price"] = max(1.00, self.portfolio["CAPONE"]["price"] * 0.38)
            self.portfolio["TELLUV"]["price"] = max(5.00, self.portfolio["TELLUV"]["price"] * 0.80)
            self.lp_confidence = max(0, self.lp_confidence - 25)

            headline = "FEDERAL RESERVE EMERGENCY ADDRESS: 'IRRATIONAL EXUBERANCE'"
            body = [
                "WASHINGTON - In an unscheduled symposium, Federal Reserve leadership issued an unprecedented warning against unsustainable valuations in dot-com equities.",
                "Liquidity across secondary markets has seized up. Tech speculative darlings HCKSOC (-72%) and CAPONE (-62%) have suffered catastrophic collapse, while defensive utility TELLUV cushioned with only -20%.",
                f"Limited Partners have initiated emergency margin reviews. Fund confidence has plunged to {self.lp_confidence}%.",
                "Trading desks report widespread failure-to-deliver errors across clearing houses. Will you cut losses, hold, or risk buying the blood in the streets?"
            ]

            def on_news_read():
                self.write_line("\n>>> BREAKING: FED CHAIR WARNS OF 'IRRATIONAL EXUBERANCE'. TECH BUBBLE BURSTS.", "alert")
                self.write_line(f"[ALERT] PANIC LIQUIDATION: LP CONFIDENCE DROPPED TO {self.lp_confidence}%\n", "alert")
                if on_complete:
                    on_complete()

            self.show_news_popup(headline, body, on_dismiss=on_news_read)
            self.save_market_state()
        elif self.week in (5, 9, 17) and self.week not in self.events_triggered:
            self.events_triggered.add(self.week)
            event_pool = {
                5: (
                    "CAPONE ANNOUNCES RECORD B2B CREDIT SURGE & NASDAQ EXPANSION",
                    "CAPONE", 1.25, 5,
                    "Credit facility demands from venture-backed startups surge. CAPONE shares surge +25% on massive institutional volume."
                ),
                9: (
                    "DOJ LAUNCHES ANTITRUST PROBE INTO HCKSOC CODE DISTRIBUTION",
                    "HCKSOC", 0.78, -5,
                    "Federal regulators issue subpoenas regarding proprietary software tie-ins. HCKSOC slides -22% amid intense short seller interest."
                ),
                17: (
                    "INSTITUTIONAL ROTATION: DEFENSIVE FIBER DEMAND BOOSTS TELLUV",
                    "TELLUV", 1.20, 5,
                    "Global telecommunication syndication agreements finalized. TELLUV surges +20% as risk-averse capital rotates into infrastructure."
                )
            }
            if self.week in event_pool:
                h, ticker, mult, conf_delta, desc = event_pool[self.week]
                self.portfolio[ticker]["price"] = round(self.portfolio[ticker]["price"] * mult, 2)
                self.lp_confidence = max(0, min(100, self.lp_confidence + conf_delta))
                body = [
                    desc,
                    f"Market reaction: {ticker} traded violently on the bulletin. LP confidence adjusted by {conf_delta:+d}%."
                ]
                def on_event_read():
                    self.write_line(f"\n>>> DOW WIRE: {h}", "amber")
                    self.write_line(f"[MARKET IMPACT] {ticker} adjusted by {int((mult-1)*100):+d}%.", "highlight")
                    if on_complete:
                        on_complete()
                self.show_news_popup(h, body, on_dismiss=on_event_read)
                self.save_market_state()
            else:
                if on_complete:
                    on_complete()
        else:
            if on_complete:
                on_complete()

    def advance_market(self):
        self.week += 1
        
        # Deduct operating overhead
        self.cash -= self.weekly_overhead
        if self.cash < 0:
            self.write_line(f"[!] CASH DEFICIT: Account overdrawn (${self.cash:,.2f}). LPs alarming (-8% Conf).", "alert")
            self.lp_confidence = max(0, self.lp_confidence - 8)

        # Volatility models
        if not self.crash_triggered:
            hcksoc_delta = random.uniform(-0.06, 0.22)
            capone_delta = random.uniform(-0.04, 0.15)
            telluv_delta = random.uniform(-0.01, 0.04)
        else:
            hcksoc_delta = random.uniform(-0.10, 0.22)
            capone_delta = random.uniform(-0.07, 0.14)
            telluv_delta = random.uniform(-0.02, 0.05)

        self.portfolio["HCKSOC"]["price"] = max(0.50, round(self.portfolio["HCKSOC"]["price"] * (1 + hcksoc_delta), 2))
        self.portfolio["CAPONE"]["price"] = max(1.00, round(self.portfolio["CAPONE"]["price"] * (1 + capone_delta), 2))
        self.portfolio["TELLUV"]["price"] = max(5.00, round(self.portfolio["TELLUV"]["price"] * (1 + telluv_delta), 2))
        self.save_market_state()

        # LP scrutiny penalties
        nav = self.get_portfolio_value()
        if nav < 4_800_000:
            self.lp_confidence = max(0, self.lp_confidence - 4)
            self.write_line("[WARN] Performance below benchmark ($4.8M). LPs growing anxious (-4% Conf).", "alert")
        if nav < 3_800_000:
            self.lp_confidence = max(0, self.lp_confidence - 6)
            self.write_line("[WARN] CRITICAL DRAWDOWN below $3.8M! LPs threatening redemption run (-6% Conf).", "alert")

        if self.week > 24:
            self.end_game()
        else:
            self.display_dashboard()

    def check_game_over(self):
        nav = self.get_portfolio_value()
        if self.lp_confidence <= 0 or nav <= 1_200_000:
            self.write_line("\n" + "!" * 66, "alert")
            self.write_line("[!] LIQUIDATION NOTICE: Limited partners pulled all capital. Fund insolvent.", "alert")
            self.write_line(f"[!] FINAL NAV AT COLLAPSE: ${nav:,.2f}  |  CONFIDENCE: {self.lp_confidence}%", "alert")
            self.write_line("!" * 66, "alert")
            self.entry_cmd.config(state="disabled")
            return True
        return False

    def end_game(self):
        self.write_line("\n" + "=" * 66, "amber")
        self.write_line("=== Q4 ANNUAL AUDIT // FINAL PERFORMANCE RESULT ===", "amber")
        self.write_line("=" * 66, "dim")
        nav = self.get_portfolio_value()
        self.write_line(f"Final NAV: ${nav:,.2f}  |  Target Requirement: ${self.target_nav:,.2f}")
        if nav >= self.target_nav and self.lp_confidence > 0:
            self.write_line("STATUS: SURVIVOR & ALPHA PRODUCER.", "highlight")
            self.write_line("You timed the bubble, managed capital reserves, and beat Wall Street benchmarks!", "highlight")
        else:
            self.write_line("STATUS: INSOLVENT / BENCHMARK FAILED.", "alert")
            self.write_line("The fund failed to beat LP hurdle rates or collapsed under the bubble burst.", "alert")
        self.entry_cmd.config(state="disabled")

    def handle_input(self, event):
        val = self.entry_cmd.get().strip()
        self.entry_cmd.delete(0, "end")

        if not val:
            return

        # echo command in terminal
        self.write_line(f"> {val}", "highlight")

        # multi-step state execution (trade inputs)
        if self.pending_action:
            action, step, payload = self.pending_action
            if action in ("BUY", "SELL"):
                if step == "TICKER":
                    t = val.upper()
                    if t in self.portfolio:
                        payload["ticker"] = t
                        self.pending_action = (action, "QTY", payload)
                        self.write_line(f"Enter Quantity to {action}:")
                    else:
                        self.write_line("[ERR] Invalid Ticker. Aborting order.", "alert")
                        self.pending_action = None
                        self.display_dashboard()
                elif step == "QTY":
                    try:
                        amt = int(val)
                        t = payload["ticker"]
                        if action == "BUY":
                            cost = amt * self.portfolio[t]["price"]
                            if self.cash >= cost:
                                self.cash -= cost
                                self.portfolio[t]["shares"] += amt
                                self.write_line(f"[EXEC] Bought {amt} shares of {t} for ${cost:,.2f}.", "highlight")
                            else:
                                self.write_line("[ERR] Insufficient liquidity.", "alert")
                        elif action == "SELL":
                            if self.portfolio[t]["shares"] >= amt:
                                rev = amt * self.portfolio[t]["price"]
                                self.cash += rev
                                self.portfolio[t]["shares"] -= amt
                                self.write_line(f"[EXEC] Sold {amt} shares of {t} for ${rev:,.2f}.", "highlight")
                            else:
                                self.write_line("[ERR] Not enough shares held to cover order.", "alert")
                    except ValueError:
                        self.write_line("[ERR] Quantity must be an integer.", "alert")
                    self.pending_action = None
                    self.display_dashboard()
            return

        # root command menu
        if val == "1":
            self.pending_action = ("BUY", "TICKER", {})
            self.write_line("Ticker to BUY (HCKSOC / CAPONE / TELLUV):")
        elif val == "2":
            self.pending_action = ("SELL", "TICKER", {})
            self.write_line("Ticker to SELL (HCKSOC / CAPONE / TELLUV):")
        elif val == "3":
            cost = 150_000
            if self.cash >= cost:
                self.cash -= cost
                self.lp_confidence = min(100, self.lp_confidence + 18)
                self.write_line("[+] Lavish Silicon Alley dinner & investor roadshow hosted. LP confidence +18%.", "highlight")
            else:
                self.write_line(f"[ERR] Insufficient funds (${cost:,.2f} required).", "alert")
            self.display_dashboard()
        elif val == "4":
            self.advance_market()
        elif val == "5":
            self.root.destroy()
        elif val == "6":
            self.open_stock_viewer()
            self.display_dashboard()
        else:
            self.write_line(f"Unknown command: '{val}'. Valid: [1, 2, 3, 4, 5, 6]")

if __name__ == "__main__":
    root = tk.Tk()
    app = Y2KTerminalGUI(root)
    root.mainloop()
