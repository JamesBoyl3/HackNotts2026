
from fastapi import FastAPI
from contextlib import asynccontextmanager
from typing import Generator

import requests

from marketsimulator import DotcomHedgeFund

from dataclasses import dataclass

llm_url = "http://127.0.0.1:8889/v1/chat/completions"

@dataclass
class OrderRequest:
    stock: str
    amnt: int

@asynccontextmanager
def lifespan() -> Generator:
    global market_sim

    market_sim = DotcomHedgeFund()
    yield

app = FastAPI(title="OSGame", lifespan=lifespan)

@app.get("/")
def root() -> dict:
    return {"status": "active"}

@app.get("/advance")
def advance_market() -> None:
    market_sim.advance_market()

@app.post("/invest")
def invest_stock(request: OrderRequest) -> None: 
    market_sim.buy_stock(request.stock, request.amnt)

@app.post("/sell")
def sell_stock(request: OrderRequest) -> None: 
    market_sim.sell_stock(request.stock, request.amnt)

@app.get("/portfolio")
def get_portfolio() -> dict:
    return {"portfolio": market_sim.get_portfolio_value()}

@app.get("/email")
def gen_email() -> dict: 

    predicted_price = market_sim.get_predicted_price()

    payload1 = {"messages": 
               [
                   {
                        "role": "system",
                        "content": "You are a financial officer, and are responsible for sending emails out about predicted stock prices (Insider trading)",
                   },
                   {
                       "role": "user",
                       "content": f"The predicted stocks will change price to {predicted_price}. Generate an event set in the year 2000 that caused this in an email format."
                   }
               ]}

    response = requests.post(url=llm_url, json=payload1)
    response.raise_for_status()
    data = response.json()
    email_content = data["choices"][0]["message"]["content"]

    payload2 = {"messages": 
               [
                   {
                        "role": "system",
                        "content": "You are a financial officer, and are responsible for sending emails out about predicted stock prices (Insider trading)",
                   },
                   {
                       "role": "user",
                       "content": f"Generate a title for the following email: {email_content}"
                   }
               ]}

    response = requests.post(url=llm_url, json=payload2)
    response.raise_for_status()
    data = response.json()
    email_title = data["choices"][0]["message"]["content"]

    return {"title": email_title, "content": email_content}

@app.get("/news")
def gen_news() -> dict:
    ...