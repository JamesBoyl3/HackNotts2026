
from fastapi import FastAPI


app = FastAPI()

app.get("/stocks")
def display_stocks() -> str:
    ...

app.get("/email")
def get_email() -> str:
    ...

app.get("/increment")
def increment_stocks() -> str: 
    ...
