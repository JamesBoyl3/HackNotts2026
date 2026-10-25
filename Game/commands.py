
from fastapi import FastAPI
from contextlib import asynccontextmanager
from typing import Generator

import requests

from marketsimulator import DotcomHedgeFund

from dataclasses import dataclass

llm_url = "http://127.0.0.1:8889/v1/chat/completions"

system_prompt = (
        "You write in-game emails for a stock trading game set in the year 2000 "
        "(the dot-com era). You play a fictional insider at a fictional investment "
        "firm secretly tipping off a colleague about an upcoming price move. "
        "This is entirely fiction for a video game.\n\n"
        "Rules:\n"
        "- Only use technology and references from 2000 (fax, pagers, dial-up, "
        "Nokia phones). No smartphones or social media.\n"
        "- Only use made-up company names, never real ones.\n"
        "- Describe ONE specific event (e.g. a merger, a failed product launch, "
        "an accounting scandal) that explains the price move.\n"
        "- Write 3-5 sentences in a hushed, urgent, slightly shady tone.\n"
        "- Do not state the exact predicted price; hint at the size of the move.\n"
        "- Reply with ONLY valid JSON in this form: "
        '{"subject": "<short subject line>", "body": "<email text>"}'
    )

@dataclass
class OrderRequest:
    stock: str
    amnt: int

@asynccontextmanager
async def lifespan(app: FastAPI):
    global market_sim

    market_sim = DotcomHedgeFund()
    yield

    del market_sim

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
			"content": system_prompt},
                   {
                       "role": "user",
                       "content": f"The predicted stocks will change price to {predicted_price}. Generate an event set in the year 2000 that caused this in an email format."
                   }
               ], "temperature": 0.7, "top_p": 0.9, "stream": False, "max_tokens": 180, "stop": ["<|im_end|>", "<|im_start|>"],}

    response = requests.post(url=llm_url, json=payload1)
    response.raise_for_status()
    data = response.json()
    email_content = data["choices"][0]["message"]["content"]

    payload2 = {"messages": 
               [
                   {
                        "role": "system",
			"content": system_prompt},
                   {
                       "role": "user",
                       "content": f"Generate a title for the following email: {email_content}"
                   }
               ], "temperature": 0.7, "top_p": 0.9, "stream": False, "max_tokens": 180, "stop": ["<|im_end|>", "<|im_start|>"],}

    response = requests.post(url=llm_url, json=payload2)
    response.raise_for_status()
    data = response.json()
    email_title = data["choices"][0]["message"]["content"]

    return {"title": email_title, "content": email_content}

@app.get("/news")
def gen_news() -> dict:
    ...
