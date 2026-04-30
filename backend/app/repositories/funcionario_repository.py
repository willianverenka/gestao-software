from __future__ import annotations

from typing import Any, Optional

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

    def get_medico_profile(self, funcionario_id: int) -> Optional[dict[str, Any]]:
        cur = self.conn.cursor()
        cur.execute(
            """
            SELECT
                f.funcionario_id,
                p.nome,
                f.crm,
                e.codigo AS especialidade_codigo,
                e.nome AS especialidade_nome
            FROM funcionarios f
            JOIN pessoas p ON p.pessoa_id = f.pessoa_id
            LEFT JOIN especialidades e ON e.codigo = f.especialidade
            WHERE f.funcionario_id = ? AND f.cargo = 'medico'
            """,
            (funcionario_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None
