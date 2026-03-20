from __future__ import annotations

from .base import BaseRepository


class PessoaRepository(BaseRepository):
    def insert(
        self,
        nome: str,
        cpf: str,
        email: str,
        telefone: str | None,
    ) -> int:
        cur = self.conn.cursor()
        cur.execute(
            """
            INSERT INTO pessoas (nome, cpf, email, telefone)
            VALUES (?, ?, ?, ?)
            """,
            (nome, cpf, email, telefone or None),
        )
        return int(cur.lastrowid)
