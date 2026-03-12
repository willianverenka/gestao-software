from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from .db import Base, engine, get_db

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def read_health():
    return {"status": "ok"}


@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    return {"status": "db-ok"}

