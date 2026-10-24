
from fastapi import FastAPI
import httpx

from typing import Generator

from game.marketsimulator import DotcomHedgeFund
from game.gameRequests import DisplayRequest

async def lifespan(app: FastAPI) -> Generator:
    app.sim = DotcomHedgeFund()
    print(app.sim)
    yield
    del app.sim

app = FastAPI(lifespan=lifespan)

app.post("/stocks", response_model=DisplayRequest)
def display_stocks() -> DisplayRequest:
    response = DisplayRequest(
                disaply = app.sim.display_dashboard()
                )

app.post("/email")
def get_email() -> str:
    ...

app.post("/increment")
def increment_stocks() -> str: 
    ...
