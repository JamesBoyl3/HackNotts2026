import sys
import time
import random

class DotcomHedgeFund:
    def __init__(self):
        self.week = 1
        self.date_str = "Nov 15, 1999"
        self.cash = 10_000_000
        self.lp_confidence = 80
        self.portfolio = {
            "HCKSOC": {"shares": 50_000, "price": 42.0},
            "CAPONE": {"shares": 20_000, "price": 85.0},
            "TELUV": {"shares": 40_000, "price": 25.0},
        }
        self.crash_triggered = False
        self.fished = False
        self.email_recieved = False

    def get_portfolio_value(self):
        holdings = sum(d["shares"] * d["price"] for d in self.portfolio.values())
        return self.cash + holdings

    def display_dashboard(self):
        nav = self.get_portfolio_value()
        print("\n" + "=" * 55)
        print(f" WALL ST. INTELLIGENCE TERMINAL v2.4  |  WEEK {self.week}")
        print(f" PORTFOLIO NAV: ${nav:,.2f} | CASH: ${self.cash:,.2f}")
        print(f" LP CONFIDENCE: {self.lp_confidence}%")
        print("-" * 55)
        print(f"{'TICKER':<8} {'PRICE':<10} {'SHARES':<10} {'TOTAL VALUE':<12}")
        for ticker, data in self.portfolio.items():
            val = data["shares"] * data["price"]
            print(f"{ticker:<8} ${data['price']:<9.2f} {data['shares']:<10} ${val:,.2f}")
        print("=" * 55)

    def advance_market(self):
        self.week += 1
        
        if self.week >= 16 and not self.crash_triggered:
            self.crash_triggered = True
            print("\n>>> BREAKING: FED CHAIR WARNS OF 'IRRATIONAL EXUBERANCE'. TECH STOCKS FREEZE.")
            self.portfolio["TELUV"]["price"] *= 0.25
            self.portfolio["CAPONE"]["price"] *= 0.40
            self.lp_confidence -= 30
        else:
            hcksoc_delta = random.uniform(-0.15, 0.35) if not self.crash_triggered else random.uniform(-0.40, 0.05)
            capone_delta = random.uniform(-0.10, 0.25) if not self.crash_triggered else random.uniform(-0.35, 0.02)
            teluv_delta = random.uniform(-0.02, 0.03)

            self.portfolio["HCKSOC"]["price"] = max(0.50, self.portfolio["HCKSOC"]["price"] * (1 + hcksoc_delta))
            self.portfolio["CAPONE"]["price"] = max(1.00, self.portfolio["CAPONE"]["price"] * (1 + capone_delta))
            self.portfolio["TELUV"]["price"] = max(5.00, self.portfolio["TELUV"]["price"] * (1 + teluv_delta))

        if self.get_portfolio_value() < 8_000_000:
            self.lp_confidence -= 10

    def play(self):
        print("""
        *************************************************
        *                                               *
        *          NOTTINGAM INVESTMENT FUND            *
        *                                               *
        *************************************************
        """)
        while self.week <= 24:
            self.display_dashboard()
            
            if self.lp_confidence <= 0 or self.get_portfolio_value() <= 1_000_000:
                print("\n[!] LIQUIDATION NOTICE: Limited partners pulled all capital. Fund insolvent.")
                return

            print("\nOptions: [1] Buy  [2] Sell  [3] Reassure LPs  [4] Advance Week  [5] Exit")
            cmd = input("Command >> ").strip()

            if cmd == "1":
                t = input("Ticker (HCKSOC/CAPONE/TELUV): ").upper()
                amt = int(input("Quantity: ") or 0)
                cost = amt * self.portfolio.get(t, {}).get("price", 0)
                if t in self.portfolio and self.cash >= cost:
                    self.cash -= cost
                    self.portfolio[t]["shares"] += amt
                else:
                    print("Invalid trade or insufficient cash.")
            elif cmd == "2":
                t = input("Ticker (HCKSOC/CAPONE/TELUV): ").upper()
                amt = int(input("Quantity: ") or 0)
                if t in self.portfolio and self.portfolio[t]["shares"] >= amt:
                    rev = amt * self.portfolio[t]["price"]
                    self.cash += rev
                    self.portfolio[t]["shares"] -= amt
                else:
                    print("Invalid trade or insufficient shares.")
            elif cmd == "3":
                if self.cash >= 250_000:
                    self.cash -= 250_000
                    self.lp_confidence = min(100, self.lp_confidence + 15)
                    print("Hosted an ultra-luxurious dinner for investors. LP confidence restored.")
                else:
                    print("Not enough liquidity for marketing.")
            elif cmd == "4":
                self.advance_market()
            elif cmd == "5":
                break

        print("\n=== FINAL RESULT ===")
        print(f"Final NAV: ${self.get_portfolio_value():,.2f}")
        if self.get_portfolio_value() > 10_000_000:
            print("STATUS: Survivor. You sidestepped the wreckage and captured market share.")
        else:
            print("STATUS: Barely solvent. The fund survived, but your reputation is decimated.")

if __name__ == "__main__":
    game = DotcomHedgeFund()
    game.play()
