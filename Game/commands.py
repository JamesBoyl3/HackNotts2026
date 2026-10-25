
from fastapi import FastAPI
from contextlib import asynccontextmanager
from typing import Generator

@asynccontextmanager
def lifespan() -> Generator:
    yield

app = FastAPI(title="OSGame", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/stocks") 
def display_stocks() -> None: 
    return

@app.get("/invest")
def invest_stock() -> None: 
    ...

app.get("/sell")
def sell_stock() -> None: 
    ...

@app.get("/email")
def gen_email() -> None: 
    ...