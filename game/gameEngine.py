
from fastapi import FastAPI
import httpx

from typing import Generator

from marketsimulator import DotcomHedgeFund
from gameRequests import DisplayRequest

async def lifespan(app: FastAPI) -> Generator:
    global sim
    sim = DotcomHedgeFund()
    yield
    del app.sim

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

app.post("/email")
def get_email() -> str:
    ...

app.post("/increment")
def increment_stocks() -> str: 
    ...
