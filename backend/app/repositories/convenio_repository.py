from __future__ import annotations

from typing import Optional

from .base import BaseRepository


class ConvenioRepository(BaseRepository):
    def get_id_by_codigo(self, codigo: str) -> Optional[int]:
        cur = self.conn.execute(
            "SELECT convenio_id FROM convenios WHERE codigo = ?",
            (codigo,),
        )
        row = cur.fetchone()
        return int(row[0]) if row else None

    def list_all(self) -> list[dict[str, str]]:
        cur = self.conn.execute(
            """
            SELECT codigo, nome
            FROM convenios
            WHERE codigo IS NOT NULL
            ORDER BY CASE WHEN codigo = 'particular' THEN 0 ELSE 1 END, nome COLLATE NOCASE ASC
            """
        )
        rows = cur.fetchall()
        return [
            {
                "codigo": str(row["codigo"]),
                "nome": str(row["nome"]),
            }
            for row in rows
        ]
