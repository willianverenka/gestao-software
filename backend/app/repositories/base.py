from contextlib import contextmanager
import sqlite3


class BaseRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    @contextmanager
    def transaction(self, mode: str = "DEFERRED"):
        """
        Context manager para transações SQLite.

        mode:
            - DEFERRED (default)
            - IMMEDIATE
            - EXCLUSIVE
        """

        try:
            # inicia transação com modo configurável
            self.conn.execute(f"BEGIN {mode}")

            yield  # executa o bloco dentro do "with"

            self.conn.commit()

        except Exception:
            self.conn.rollback()
            raise
