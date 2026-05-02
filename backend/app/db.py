import sqlite3
from contextlib import contextmanager

# Path do banco (sqlite3 usa path do arquivo)
DATABASE_PATH = "./data/app.db"


def _new_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 3000")
    return conn


@contextmanager
def with_connection():
    """Context manager para obter uma conexão (ex.: uso no startup)."""
    conn = _new_connection()
    try:
        yield conn
    finally:
        conn.close()


def get_db():
    """Generator que fornece uma conexão sqlite3 por request (FastAPI Depends)."""
    conn = _new_connection()
    try:
        yield conn
    finally:
        conn.close()
