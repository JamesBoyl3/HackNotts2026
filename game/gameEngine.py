
from fastapi import FastAPI
import requests

from typing import Generator

from marketsimulator import DotcomHedgeFund
from gameRequests import DisplayRequest

async def lifespan(app: FastAPI) -> Generator:
    global sim
    sim = DotcomHedgeFund()
    yield
    del sim

app = FastAPI(title="Game API", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Hello World"}

app.get("/stocks")
def display_stocks() -> DisplayRequest:
    response = DisplayRequest(
                display = sim.display_dashboard()
                )
#    return response 
    return {"message": "Bonjour"}

@app.get("/email")
def get_email() -> str:
    payload = {
        "messages": [
            {"role": "user", "content": "What is the capital of France?"}
        ],
       "max_tokens": 200,
        }
    url = "http://127.0.0.1:8889/v1/chat/completions"
    response = requests.post(url, json=payload)
    response.raise_for_status()
    data = response.json()
    message = data["choices"][0]["message"]["content"]
    return message

app.post("/increment")
def increment_stocks() -> str: 
    ...
