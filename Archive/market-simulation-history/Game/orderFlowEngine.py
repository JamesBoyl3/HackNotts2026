from dataclasses import dataclass
import time
import random
import uuid  
from enum import Enum
from statistics import quantiles
from collections import defaultdict, deque

class Side(Enum):
    BUY = 1
    SELL = 2

@dataclass
class Order:
    order_id: str
    side: Side
    price: float
    quantity: int
    timestamp: float = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()


class MatchingEngine:
    def __init__(self):
        self.bids = defaultdict(deque)
        self.asks = defaultdict(deque)
        self.trades = []

    def process_order(self, order: Order):
        if order.side == Side.BUY:
            self._match_buy(order)
        else:
            self._match_sell(order)

    def _match_buy(self, order: Order):
        while order.quantity > 0 and self.asks and order.price >= min(self.asks.keys()):
            best_ask_price = min(self.asks.keys())
            resting_queue = self.asks[best_ask_price]
            resting_order = resting_queue[0]

            trade_qty = min(order.quantity, resting_order.quantity)

            self.trades.append({'price': best_ask_price, 'qty': trade_qty, 'time': time.time()})

            order.quantity -= trade_qty
            resting_order.quantity -= trade_qty

            if resting_order.quantity == 0:
                resting_queue.popleft()
                if not resting_queue:
                    del self.asks[best_ask_price]

        if order.quantity > 0:
            self.bids[order.price].append(order)

    def _match_sell(self, order: Order):
        while order.quantity > 0 and self.bids and order.price <= max(self.bids.keys()):
            best_bid_price = max(self.bids.keys())
            resting_queue = self.bids[best_bid_price]
            resting_order = resting_queue[0]

            trade_qty = min(order.quantity, resting_order.quantity)

            self.trades.append({'price': best_bid_price, 'qty': trade_qty, 'time': time.time()})

            order.quantity -= trade_qty
            resting_order.quantity -= trade_qty

            if resting_order.quantity == 0:
                resting_queue.popleft()
                if not resting_queue:
                    del self.bids[best_bid_price]

        if order.quantity > 0:
            self.asks[order.price].append(order)

def generate_order_flow(num_orders=20):
    for _ in range(num_orders):
        side = random.choice([Side.BUY, Side.SELL])
        price = round(random.gauss(100, 2), 2)
        qty = random.randint(1, 100)
        yield Order(order_id=uuid.uuid4().hex[:8], side=side, price=price, quantity=qty)

if __name__ == "__main__":
    engine = MatchingEngine()
    print("Starting market simulation ...\n")
    for incoming_order in generate_order_flow(25):
        action = "BUYS" if incoming_order.side == Side.BUY else "SELLS"
        print(f"Incoming: {incoming_order.order_id} {action} {incoming_order.quantity:>3} @ ${incoming_order.price:.2f}")
        engine.process_order(incoming_order)

    print(f"\n--- Simulation Complete ---")
    print(f"Total Trades Executed: {len(engine.trades)}")
    for i, trade in enumerate(engine.trades[:5]):
        print(f"Trade {i+1}: {trade['qty']} shares @ ${trade['price']:.2f}")
        