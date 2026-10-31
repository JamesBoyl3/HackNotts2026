"""
Stock Viewer - Real-time Retro CRT Stock Charting Application
Charts all 3 stocks (HCKSOC, CAPONE, TELLUV) from marketsim as they update.
Can run standalone or side-by-side with marketsimFINAL / DotcomHedgeFund.
Supports live polling from a shared marketsim instance or file-based updates.
"""

import sys
import os
import json
import tkinter as tk
from tkinter import font

# Stock metadata matching the market simulation
STOCK_INFO = {
    "HCKSOC": {
        "name": "HackSoc Systems",
        "color": "#00ff66",   # Phosphor Green
        "accent": "#00aa44",
        "desc": "High-Beta Tech / Internet Infrastructure",
    },
    "CAPONE": {
        "name": "Capital One",
        "color": "#ffaa00",   # Bloomberg Amber
        "accent": "#cc8800",
        "desc": "B2B Credit & Venture Liquidity",
    },
    "TELLUV": {
        "name": "Telluvium",
        "color": "#00ddff",   # Electric Cyan
        "accent": "#0099bb",
        "desc": "Defensive Fiber & Telecom Grid",
    },
}

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "market_data.json")


class StockChartCanvas(tk.Canvas):
    """
    High-performance, pure-Tkinter retro CRT stock chart canvas.
    Renders multi-stock line charts, gridlines, axis labels, legends, and tooltip cursors.
    """

    def __init__(self, parent, **kwargs):
        super().__init__(parent, bg="#070b07", highlightthickness=0, bd=0, **kwargs)
        self.history = {ticker: [] for ticker in STOCK_INFO}
        self.weeks = []
        self.active_tickers = {ticker: True for ticker in STOCK_INFO}
        self.hover_x = None
        self.view_mode = "MULTI"  # "MULTI", "HCKSOC", "CAPONE", "TELLUV"
        self.chart_type = "LINE"  # "LINE", "AREA"

        self.bind("<Configure>", lambda e: self.redraw())
        self.bind("<Motion>", self.on_mouse_move)
        self.bind("<Leave>", self.on_mouse_leave)

    def set_data(self, history, weeks):
        self.history = history
        self.weeks = weeks
        self.redraw()

    def toggle_ticker(self, ticker):
        if ticker in self.active_tickers:
            self.active_tickers[ticker] = not self.active_tickers[ticker]
            self.redraw()

    def set_view_mode(self, mode):
        self.view_mode = mode
        self.redraw()

    def set_chart_type(self, ctype):
        self.chart_type = ctype
        self.redraw()

    def on_mouse_move(self, event):
        self.hover_x = event.x
        self.redraw()

    def on_mouse_leave(self, event):
        self.hover_x = None
        self.redraw()

    def redraw(self):
        self.delete("all")
        width = self.winfo_width()
        height = self.winfo_height()

        if width < 100 or height < 100:
            return

        # Margins for CRT frame and axis labels
        pad_left = 65
        pad_right = 30
        pad_top = 35
        pad_bottom = 45

        plot_w = width - pad_left - pad_right
        plot_h = height - pad_top - pad_bottom

        if plot_w <= 10 or plot_h <= 10:
            return

        # Background grid & CRT scanlines
        self.create_rectangle(pad_left, pad_top, width - pad_right, height - pad_bottom,
                              outline="#1a331a", fill="#090f09", width=1.5)

        # Draw subtle CRT horizontal gridlines
        for y in range(pad_top, height - pad_bottom, 4):
            self.create_line(pad_left, y, width - pad_right, y, fill="#0d160d", width=1)

        # Collect data points to display
        active_series = {}
        for ticker, series in self.history.items():
            if self.view_mode == "MULTI" or self.view_mode == ticker:
                if self.active_tickers.get(ticker, True):
                    active_series[ticker] = series

        all_prices = []
        for s in active_series.values():
            all_prices.extend(s)

        num_points = len(self.weeks)

        if not all_prices or num_points == 0:
            # Empty state / waiting message
            self.create_text(
                width // 2, height // 2,
                text="[ AWAITING LIVE MARKET FEED TICK... ]\nRun marketsim to stream live weekly prices",
                font=("Courier New", 12, "bold"),
                fill="#33ff33",
                justify="center"
            )
            return

        min_val = min(all_prices)
        max_val = max(all_prices)
        if min_val == max_val:
            min_val = max(0.0, min_val - 10.0)
            max_val = max_val + 10.0
        else:
            padding = (max_val - min_val) * 0.12
            min_val = max(0.0, min_val - padding)
            max_val = max_val + padding

        # Major Horizontal Grid & Y-Axis Labels (5 levels)
        steps_y = 5
        for i in range(steps_y + 1):
            val = min_val + (max_val - min_val) * (i / steps_y)
            y = pad_top + plot_h - (i / steps_y) * plot_h
            # Gridline
            self.create_line(pad_left, y, width - pad_right, y, fill="#162e16", dash=(2, 4))
            # Y label
            self.create_text(
                pad_left - 8, y,
                text=f"${val:5.1f}",
                font=("Courier New", 9),
                fill="#44aa44",
                anchor="e"
            )

        # Vertical Grid & X-Axis Labels (Weeks)
        if num_points == 1:
            x_coords = [pad_left + plot_w / 2]
        else:
            x_coords = [pad_left + (i / (num_points - 1)) * plot_w for i in range(num_points)]

        # Determine label skip interval if many points
        skip = 1
        if num_points > 16:
            skip = 2
        if num_points > 32:
            skip = 4

        for i, (w, x) in enumerate(zip(self.weeks, x_coords)):
            if i % skip == 0 or i == num_points - 1:
                self.create_line(x, pad_top, x, height - pad_bottom, fill="#162e16", dash=(2, 4))
                self.create_text(
                    x, height - pad_bottom + 14,
                    text=f"W{w}",
                    font=("Courier New", 9, "bold"),
                    fill="#44aa44"
                )

        # Draw series lines / areas
        for ticker, series in active_series.items():
            if not series:
                continue
            color = STOCK_INFO[ticker]["color"]
            coords = []
            pts = []
            for i, p in enumerate(series):
                x = x_coords[i]
                y = pad_top + plot_h - ((p - min_val) / (max_val - min_val)) * plot_h
                coords.extend([x, y])
                pts.append((x, y, p))

            # Optional Area Fill
            if self.chart_type == "AREA" and len(coords) >= 4:
                area_coords = [coords[0], height - pad_bottom] + coords + [coords[-2], height - pad_bottom]
                self.create_polygon(area_coords, fill="#0c1d0c", outline="")

            # Series glow & main line
            if len(coords) >= 4:
                # Subtle glow line underneath
                self.create_line(coords, fill=STOCK_INFO[ticker]["accent"], width=4, smooth=False)
                # Crisp bright line on top
                self.create_line(coords, fill=color, width=2, smooth=False)
            elif len(coords) == 2:
                # Single dot
                x, y = coords[0], coords[1]
                self.create_oval(x - 4, y - 4, x + 4, y + 4, fill=color, outline="#ffffff")

            # Data points nodes
            for x, y, p in pts:
                self.create_oval(x - 3, y - 3, x + 3, y + 3, fill=color, outline="#050805", width=1)

            # Latest price tag pill on right border
            last_x, last_y, last_p = pts[-1]
            pill_color = color
            self.create_rectangle(
                width - pad_right + 2, last_y - 8,
                width - 4, last_y + 8,
                fill="#112211", outline=pill_color, width=1
            )
            self.create_text(
                width - pad_right + 4, last_y,
                text=f"{last_p:.1f}",
                font=("Courier New", 8, "bold"),
                fill=pill_color,
                anchor="w"
            )

        # Crosshair / Tooltip Cursor on mouse hover
        if self.hover_x is not None and pad_left <= self.hover_x <= width - pad_right and num_points > 0:
            # Find closest week index
            closest_idx = min(range(num_points), key=lambda i: abs(x_coords[i] - self.hover_x))
            cx = x_coords[closest_idx]
            cw = self.weeks[closest_idx]

            # Vertical guide line
            self.create_line(cx, pad_top, cx, height - pad_bottom, fill="#ffb000", dash=(3, 3), width=1)

            # Week box atop crosshair
            self.create_rectangle(cx - 24, pad_top - 18, cx + 24, pad_top - 2, fill="#ffb000", outline="#ffffff")
            self.create_text(cx, pad_top - 10, text=f"Wk {cw}", font=("Courier New", 8, "bold"), fill="#000000")

            # Floating tooltip box showing exact stock prices at this week
            tip_lines = [f"WEEK {cw:02d}"]
            for t in ["HCKSOC", "CAPONE", "TELLUV"]:
                if t in active_series and closest_idx < len(active_series[t]):
                    tip_lines.append(f"{t}: ${active_series[t][closest_idx]:.2f}")

            tip_text = "\n".join(tip_lines)
            tip_x = cx + 15 if cx + 130 < width else cx - 130
            tip_y = pad_top + 20

            self.create_rectangle(tip_x - 6, tip_y - 6, tip_x + 115, tip_y + 16 * len(tip_lines) + 4,
                                  fill="#0a140a", outline="#33ff33", width=1.5)
            self.create_text(tip_x, tip_y, text=tip_text, font=("Courier New", 9, "bold"),
                             fill="#33ff33", anchor="nw")

        # Top chart title / active ticker banner
        title_mode = "PORTFOLIO BASKET (ALL 3 STOCKS)" if self.view_mode == "MULTI" else f"FOCUSED VIEW: {self.view_mode}"
        self.create_text(
            pad_left, 16,
            text=f">> {title_mode} -- REALTIME FEED",
            font=("Courier New", 9, "bold"),
            fill="#ffb000",
            anchor="w"
        )


class StockViewerApp:
    """
    Main Stock Viewer Window.
    Can hook directly into an active marketsim instance or auto-poll market_data.json / built-in sim.
    """

    def __init__(self, root, market_sim_instance=None):
        self.root = root
        self.root.title("WS_TICKER_CHART v2.4 // THREE-STOCK LIVE VIEWER")
        self.root.geometry("980x680")
        self.root.minsize(780, 520)
        self.root.configure(bg="#080c08")

        self.market_sim = market_sim_instance
        self.standalone = (market_sim_instance is None)

        # Palettes
        self.CRT_BG = "#0c0f0c"
        self.CRT_FG = "#33ff33"
        self.CRT_AMBER = "#ffb000"
        self.CRT_CYAN = "#00e5ff"
        self.CRT_DIM = "#183018"
        self.BORDER_COLOR = "#224422"

        # Price histories
        self.history = {
            "HCKSOC": [40.0],
            "CAPONE": [70.0],
            "TELLUV": [25.0],
        }
        self.weeks = [1]
        self.last_seen_week = 1
        self.last_mtime = 0

        self.build_ui()

        # Connect / sync with market
        self.sync_with_market()

        # Start periodic update loop
        self.poll_updates()

    def build_ui(self):
        # 1. Top Retro Header
        header = tk.Frame(self.root, bg="#111a11", bd=1, relief="ridge")
        header.pack(fill="x", padx=8, pady=(8, 4))

        title_lbl = tk.Label(
            header,
            text="[NOTTINGHAM EXCHANGE TICKER FEED] // NY-FIX BRIDGE 1999",
            font=("Courier New", 10, "bold"),
            fg=self.CRT_AMBER,
            bg="#111a11"
        )
        title_lbl.pack(side="left", padx=10, pady=4)

        self.status_lbl = tk.Label(
            header,
            text="STATUS: CONNECTED (LIVE)",
            font=("Courier New", 9, "bold"),
            fg=self.CRT_FG,
            bg="#111a11"
        )
        self.status_lbl.pack(side="right", padx=10)

        # 2. Metric / Summary Cards Bar (Cards for each of the 3 stocks)
        self.cards_frame = tk.Frame(self.root, bg=self.CRT_BG)
        self.cards_frame.pack(fill="x", padx=8, pady=4)

        self.cards = {}
        for ticker, info in STOCK_INFO.items():
            card = tk.Frame(self.cards_frame, bg="#0d170d", bd=1, relief="solid", highlightbackground=self.BORDER_COLOR, highlightthickness=1)
            card.pack(side="left", fill="both", expand=True, padx=4)

            # Top row: ticker & name
            row1 = tk.Frame(card, bg="#0d170d")
            row1.pack(fill="x", padx=8, pady=(6, 2))

            lbl_tick = tk.Label(
                row1,
                text=ticker,
                font=("Courier New", 12, "bold"),
                fg=info["color"],
                bg="#0d170d"
            )
            lbl_tick.pack(side="left")

            lbl_name = tk.Label(
                row1,
                text=info["name"],
                font=("Courier New", 8),
                fg="#66aa66",
                bg="#0d170d"
            )
            lbl_name.pack(side="right")

            # Middle row: current price
            lbl_price = tk.Label(
                card,
                text=f"${self.history[ticker][-1]:.2f}",
                font=("Courier New", 16, "bold"),
                fg="#ffffff",
                bg="#0d170d"
            )
            lbl_price.pack(anchor="w", padx=8, pady=2)

            # Bottom row: delta change & min/max
            row3 = tk.Frame(card, bg="#0d170d")
            row3.pack(fill="x", padx=8, pady=(0, 6))

            lbl_delta = tk.Label(
                row3,
                text="+0.0% (W01)",
                font=("Courier New", 9, "bold"),
                fg="#88cc88",
                bg="#0d170d"
            )
            lbl_delta.pack(side="left")

            lbl_range = tk.Label(
                row3,
                text=f"Lo: ${self.history[ticker][-1]:.1f} Hi: ${self.history[ticker][-1]:.1f}",
                font=("Courier New", 8),
                fg="#447744",
                bg="#0d170d"
            )
            lbl_range.pack(side="right")

            self.cards[ticker] = {
                "price": lbl_price,
                "delta": lbl_delta,
                "range": lbl_range,
                "frame": card,
            }

        # 3. Main Chart Canvas
        chart_container = tk.Frame(self.root, bg=self.CRT_BG, bd=2, relief="sunken")
        chart_container.pack(fill="both", expand=True, padx=8, pady=4)

        self.chart = StockChartCanvas(chart_container)
        self.chart.pack(fill="both", expand=True)

        # 4. Controls & Legend Bar
        controls_frame = tk.Frame(self.root, bg="#0a100a", bd=1, relief="ridge")
        controls_frame.pack(fill="x", padx=8, pady=(4, 8))

        # Ticker Toggles
        tk.Label(
            controls_frame,
            text="SERIES:",
            font=("Courier New", 9, "bold"),
            fg=self.CRT_AMBER,
            bg="#0a100a"
        ).pack(side="left", padx=(8, 4), pady=6)

        self.toggle_buttons = {}
        for ticker, info in STOCK_INFO.items():
            btn = tk.Button(
                controls_frame,
                text=f"● {ticker}",
                font=("Courier New", 9, "bold"),
                fg=info["color"],
                bg="#112211",
                activebackground=info["color"],
                activeforeground="#000000",
                bd=1,
                relief="raised",
                padx=6,
                command=lambda t=ticker: self.toggle_stock(t)
            )
            btn.pack(side="left", padx=3, pady=4)
            self.toggle_buttons[ticker] = btn

        # View Mode Selector: All / Solo
        tk.Label(
            controls_frame,
            text="| VIEW:",
            font=("Courier New", 9, "bold"),
            fg=self.CRT_AMBER,
            bg="#0a100a"
        ).pack(side="left", padx=(10, 4))

        for mode in ["ALL", "HCKSOC", "CAPONE", "TELLUV"]:
            m_code = "MULTI" if mode == "ALL" else mode
            tk.Button(
                controls_frame,
                text=mode,
                font=("Courier New", 8, "bold"),
                fg=self.CRT_FG,
                bg="#142414",
                activebackground=self.CRT_AMBER,
                activeforeground="#000000",
                bd=1,
                command=lambda m=m_code: self.chart.set_view_mode(m)
            ).pack(side="left", padx=2, pady=4)

        # Chart Type Toggle (Line vs Area)
        tk.Button(
            controls_frame,
            text="STYLE: AREA/LINE",
            font=("Courier New", 8, "bold"),
            fg=self.CRT_CYAN,
            bg="#112222",
            bd=1,
            command=self.toggle_chart_style
        ).pack(side="left", padx=(10, 4), pady=4)

        # Manual Advance / Simulation Controls
        if self.standalone:
            # Add simulation runner buttons if running without the main terminal window
            tk.Button(
                controls_frame,
                text="[+ SIM STEP]",
                font=("Courier New", 9, "bold"),
                fg="#ffffff",
                bg="#2e542e",
                activebackground="#33ff33",
                activeforeground="#000000",
                bd=1,
                command=self.manual_step
            ).pack(side="right", padx=(4, 8), pady=4)

            tk.Button(
                controls_frame,
                text="[RESET SIM]",
                font=("Courier New", 8),
                fg="#ff8888",
                bg="#331111",
                bd=1,
                command=self.reset_sim
            ).pack(side="right", padx=4, pady=4)

        # Bottom ticker / announcement marquee bar
        self.marquee_lbl = tk.Label(
            self.root,
            text="MARKET SURVEILLANCE FEED: HCKSOC [35k @ $40.0] | CAPONE [20k @ $70.0] | TELLUV [40k @ $25.0] -- CHART AUTO-SYNCS AS MARKET TICKS",
            font=("Courier New", 8),
            fg="#228822",
            bg="#080c08"
        )
        self.marquee_lbl.pack(side="bottom", fill="x", pady=(0, 2))

    def toggle_stock(self, ticker):
        self.chart.toggle_ticker(ticker)
        active = self.chart.active_tickers.get(ticker, True)
        btn = self.toggle_buttons[ticker]
        if active:
            btn.config(relief="raised", bg="#112211", fg=STOCK_INFO[ticker]["color"])
        else:
            btn.config(relief="sunken", bg="#0a110a", fg="#445544")

    def toggle_chart_style(self):
        new_style = "AREA" if self.chart.chart_type == "LINE" else "LINE"
        self.chart.set_chart_type(new_style)

    def record_price_point(self, week, prices):
        """Append price point for each stock and update UI cards and chart."""
        if week in self.weeks:
            # Overwrite current week's prices if re-evaluated (e.g. news crash)
            idx = self.weeks.index(week)
            for t in STOCK_INFO:
                if t in prices:
                    self.history[t][idx] = prices[t]
        else:
            self.weeks.append(week)
            for t in STOCK_INFO:
                p = prices.get(t, self.history[t][-1] if self.history[t] else 40.0)
                self.history[t].append(p)

        self.update_cards()
        self.chart.set_data(self.history, self.weeks)

    def update_cards(self):
        for ticker, card in self.cards.items():
            hist = self.history[ticker]
            if not hist:
                continue
            curr = hist[-1]
            first = hist[0]
            pct = ((curr - first) / first) * 100 if first != 0 else 0
            sign = "+" if pct >= 0 else ""
            delta_color = "#33ff33" if pct >= 0 else "#ff4444"

            card["price"].config(text=f"${curr:,.2f}")
            card["delta"].config(text=f"{sign}{pct:.1f}% (vs W01)", fg=delta_color)
            card["range"].config(text=f"Lo: ${min(hist):.1f}  Hi: ${max(hist):.1f}")

    def sync_with_market(self):
        """Attempts to read price data from direct market_sim object or data file."""
        if self.market_sim:
            curr_week = getattr(self.market_sim, "week", 1)
            port = getattr(self.market_sim, "portfolio", {})
            history = getattr(self.market_sim, "history", None)
            if history and "weeks" in history and "HCKSOC" in history:
                self.weeks = list(history["weeks"])
                self.history = {t: list(history[t]) for t in STOCK_INFO if t in history}
                self.update_cards()
                self.chart.set_data(self.history, self.weeks)
                self.status_lbl.config(text="FEED: LINKED (INSTANCE)", fg=self.CRT_FG)
                return
            elif port:
                prices = {t: port[t]["price"] for t in port if t in STOCK_INFO}
                self.record_price_point(curr_week, prices)
                self.status_lbl.config(text="FEED: LINKED (INSTANCE)", fg=self.CRT_FG)
                return

        # Check for market_data.json written by live simulation
        if os.path.exists(DATA_FILE):
            try:
                mtime = os.path.getmtime(DATA_FILE)
                if mtime != self.last_mtime:
                    self.last_mtime = mtime
                    with open(DATA_FILE, "r") as f:
                        data = json.load(f)
                    if "history" in data and "weeks" in data:
                        self.history = data["history"]
                        self.weeks = data["weeks"]
                        self.update_cards()
                        self.chart.set_data(self.history, self.weeks)
                        self.status_lbl.config(text="FEED: LINKED (LIVE FILE)", fg=self.CRT_FG)
                        return
                    elif "week" in data and "portfolio" in data:
                        w = data["week"]
                        port = data["portfolio"]
                        prices = {t: port[t]["price"] for t in port if t in STOCK_INFO}
                        self.record_price_point(w, prices)
                        self.status_lbl.config(text="FEED: LINKED (LIVE FILE)", fg=self.CRT_FG)
                        return
            except Exception:
                pass

        # Standalone initial point
        self.update_cards()
        self.chart.set_data(self.history, self.weeks)

    def poll_updates(self):
        """Periodic check every 350ms for market price updates."""
        try:
            self.sync_with_market()
        except Exception:
            pass
        self.root.after(350, self.poll_updates)

    def manual_step(self):
        """Simulate next week if running standalone without marketsimFINAL."""
        next_week = self.weeks[-1] + 1
        import random
        # Mirror market volatility logic
        d_hcksoc = random.uniform(-0.06, 0.22)
        d_capone = random.uniform(-0.04, 0.15)
        d_telluv = random.uniform(-0.01, 0.04)

        new_prices = {
            "HCKSOC": max(0.50, round(self.history["HCKSOC"][-1] * (1 + d_hcksoc), 2)),
            "CAPONE": max(1.00, round(self.history["CAPONE"][-1] * (1 + d_capone), 2)),
            "TELLUV": max(5.00, round(self.history["TELLUV"][-1] * (1 + d_telluv), 2)),
        }
        self.record_price_point(next_week, new_prices)
        self.marquee_lbl.config(text=f">> MANUALLY ADVANCED TO WEEK {next_week} // PRICES UPDATED.")

    def reset_sim(self):
        self.history = {
            "HCKSOC": [40.0],
            "CAPONE": [70.0],
            "TELLUV": [25.0],
        }
        self.weeks = [1]
        self.update_cards()
        self.chart.set_data(self.history, self.weeks)
        self.marquee_lbl.config(text="SIMULATION HISTORY RESET TO WEEK 1.")


def launch_viewer(market_sim=None):
    """
    Launch the Stock Viewer application.
    If market_sim instance is supplied, connects directly to it.
    Can also be launched in its own top-level window.
    """
    if tk._default_root is None:
        root = tk.Tk()
        app = StockViewerApp(root, market_sim_instance=market_sim)
        root.mainloop()
    else:
        top = tk.Toplevel(tk._default_root)
        app = StockViewerApp(top, market_sim_instance=market_sim)
        return app


if __name__ == "__main__":
    launch_viewer()

