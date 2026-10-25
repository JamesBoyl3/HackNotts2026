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

        self._price_prediction = {
            "HCKSOC": {"price": 42.0},
            "CAPONE": {"price": 85.0},
            "TELUV": {"price": 25.0},
        }

        self.crash_triggered = False
        self.fished = False
        self.email_recieved = False

    def get_portfolio_value(self):
        holdings = sum(d["shares"] * d["price"] for d in self.portfolio.values())
        return self.cash + holdings

    def advance_market(self):
        self.week += 1

        for key, val in self._price_prediction.items():
            self.portfolio[key]["price"] = val

        self._predict_market()

    def get_predicted_price(self) -> dict:
        return self._price_prediction

    def _predict_market(self) -> None:
        if self.week >= 4 and random.random() < 0.25: #Market Crashes
            self.lp_confidence -= 30
            for key in self.portfolio.keys():
                self._predict_market[key]["price"] *= random.random(0.7, 0.8)
        else:
            for key in self.portfolio.keys():
                self._predict_market[key]["price"] *= random.random(0.75, 1.5)

    def buy_stock(self, stock: str, amnt: int) -> None:
        if (price := self.portfolio[stock]["price"] * amnt) < self.cash:
            self.cash -= price
            self.portfolio[stock]["amount"] += amnt

    def sell_stock(self, stock: str, amnt: int) -> None: 
        if amnt <= self.portfolio[stock]["amount"]:
            self.portfolio[stock]["amount"] -= amnt
            self.cash += self.portfolio[stock]["price"] * amnt

if __name__ == "__main__":
    game = DotcomHedgeFund()
    game.play()
