from .base import BaseRepository


class FuncionarioRepository(BaseRepository):
    def pessoa_existe(self, pessoa_id: int) -> bool:
        cursor = self.conn.cursor()
        cursor.execute("SELECT 1 FROM pessoas WHERE pessoa_id = ?", (pessoa_id,))
        return cursor.fetchone() is not None

    def create_funcionario(self, funcionario) -> dict:
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT INTO funcionarios (pessoa_id, cargo) VALUES (?, ?)",
            (funcionario.pessoa_id, funcionario.cargo),
        )
        self.conn.commit()
        return {
            "funcionario_id": cursor.lastrowid,
            "pessoa_id": funcionario.pessoa_id,
            "cargo": funcionario.cargo,
            "crm": funcionario.crm,
        }