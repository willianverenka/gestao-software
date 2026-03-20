from __future__ import annotations

from typing import Optional

from .base import BaseRepository


class PacienteRepository(BaseRepository):
    def insert(self, pessoa_id: int, convenio_id: Optional[int]) -> int:
        cur = self.conn.cursor()
        cur.execute(
            """
            INSERT INTO pacientes (pessoa_id, convenio_id)
            VALUES (?, ?)
            """,
            (pessoa_id, convenio_id),
        )
        return int(cur.lastrowid)
