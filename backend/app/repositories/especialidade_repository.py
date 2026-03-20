from .base import BaseRepository


class EspecialidadeRepository(BaseRepository):
    def codigo_exists(self, codigo: str) -> bool:
        cur = self.conn.execute(
            "SELECT 1 FROM especialidades WHERE codigo = ?",
            (codigo,),
        )
        return cur.fetchone() is not None
