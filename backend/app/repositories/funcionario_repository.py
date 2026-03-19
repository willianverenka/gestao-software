from typing import Optional
from .base import BaseRepository


class FuncionarioRepository(BaseRepository):

    def create_funcionario(
        self,
        pessoa_id: int,
        cargo: str,
        crm: Optional[str] = None,
        especialidade: Optional[str] = None,
    ) -> dict:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            INSERT INTO funcionarios (pessoa_id, cargo, crm, especialidade)
            VALUES (?, ?, ?, ?)
            """,
            (pessoa_id, cargo, crm, especialidade),
        )
        self.conn.commit()
        return {
            "funcionario_id": cursor.lastrowid,
            "pessoa_id": pessoa_id,
            "cargo": cargo,
            "crm": crm,
            "especialidade": especialidade,
        }

    def medico_exists(self, funcionario_id: int) -> bool:
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT 1 FROM funcionarios WHERE funcionario_id = ? AND cargo = 'medico'",
            (funcionario_id,),
        )
        return cursor.fetchone() is not None

    def listar_especialidades(self) -> list:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT DISTINCT especialidade
            FROM funcionarios
            WHERE cargo = 'medico' AND especialidade IS NOT NULL
            ORDER BY especialidade ASC
            """
        )
        rows = cursor.fetchall()
        return [row[0] for row in rows]