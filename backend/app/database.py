import sqlite3
from contextlib import contextmanager

DATABASE_PATH = "./data/app.db"


@contextmanager
def get_connection():
    """Abre uma conexão e fecha no final. Usado no startup."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # retorna dicts em vez de tuples
    try:
        yield conn
    finally:
        conn.close()


def get_db():
    """Dependency do FastAPI — uma conexão por request."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


# ── Helpers pra simplificar queries ──


def query(conn, sql: str, params: tuple = ()) -> list[dict]:
    """Executa um SELECT e retorna lista de dicts."""
    rows = conn.execute(sql, params).fetchall()
    return [dict(row) for row in rows]


def query_one(conn, sql: str, params: tuple = ()) -> dict | None:
    """Executa um SELECT e retorna um dict ou None."""
    row = conn.execute(sql, params).fetchone()
    return dict(row) if row else None


def execute(conn, sql: str, params: tuple = ()):
    """Executa INSERT/UPDATE/DELETE, faz commit e retorna o cursor."""
    cursor = conn.execute(sql, params)
    conn.commit()
    return cursor
