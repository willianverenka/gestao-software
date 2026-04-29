from .base import BaseRepository


class EspecialidadeRepository(BaseRepository):
    def codigo_exists(self, codigo: str) -> bool:
        cur = self.conn.execute(
            "SELECT 1 FROM especialidades WHERE codigo = ?",
            (codigo,),
        )
        return cur.fetchone() is not None

    def list_all(self) -> list[dict[str, str]]:
        cur = self.conn.execute(
            """
            SELECT codigo, nome
            FROM especialidades
            ORDER BY nome COLLATE NOCASE ASC
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
