from __future__ import annotations

from .base import BaseRepository


class FuncionarioRepository(BaseRepository):
    def insert(
        self,
        pessoa_id: int,
        cargo: str,
        crm: str | None,
        especialidade: str | None,
    ) -> int:
        cur = self.conn.cursor()
        cur.execute(
            """
            INSERT INTO funcionarios (pessoa_id, cargo, crm, especialidade)
            VALUES (?, ?, ?, ?)
            """,
            (pessoa_id, cargo, crm, especialidade),
        )
        return int(cur.lastrowid)
