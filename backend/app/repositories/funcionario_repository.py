from .base import BaseRepository


class FuncionarioRepository(BaseRepository):

    def create_funcionario(self, pessoa_id: int, cargo: str):
        # cria cursor para executar comandos SQL
        cursor = self.conn.cursor()

        # executa inserção no banco
        cursor.execute(
            """
            INSERT INTO funcionarios (pessoa_id, cargo)
            VALUES (?, ?)
            """,
            (pessoa_id, cargo),
        )

        # confirma a operação no banco
        self.conn.commit()

        # retorna os dados criados
        return {
            "funcionario_id": cursor.lastrowid,
            "pessoa_id": pessoa_id,
            "cargo": cargo,
        }
