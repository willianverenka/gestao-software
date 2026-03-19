import sqlite3
from contextlib import contextmanager

# Path do banco (sqlite3 usa path do arquivo)
DATABASE_PATH = "./data/app.db"


@contextmanager
def with_connection():
    """Context manager para obter uma conexão (ex.: uso no startup)."""
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    try:
        yield conn
    finally:
        conn.close()


def get_db():
    """Generator que fornece uma conexão sqlite3 por request (FastAPI Depends)."""
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    try:
        yield conn
    finally:
        conn.close()
