from datetime import date

from ..schemas import PessoaCreateDTO
from .base import BaseRepository


class PessoaRepository(BaseRepository):

    def create_pessoa(self, pessoa: PessoaCreateDTO) -> dict:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            INSERT INTO pessoas (nome, cpf, email, data_nascimento, telefone, genero)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                pessoa.nome,
                pessoa.cpf,
                pessoa.email,
                pessoa.data_nascimento.isoformat(),
                pessoa.telefone,
                pessoa.genero,
            ),
        )
        self.conn.commit()
        return {
            "pessoa_id": cursor.lastrowid,
            "nome": pessoa.nome,
            "cpf": pessoa.cpf,
            "email": pessoa.email,
            "data_nascimento": pessoa.data_nascimento,
            "telefone": pessoa.telefone,
            "genero": pessoa.genero,
        }

    def exists(self, pessoa_id: int) -> bool:
        cursor = self.conn.cursor()
        cursor.execute("SELECT 1 FROM pessoas WHERE pessoa_id = ?", (pessoa_id,))
        return cursor.fetchone() is not None

    def cpf_exists(self, cpf: str) -> bool:
        cursor = self.conn.cursor()
        cursor.execute("SELECT 1 FROM pessoas WHERE cpf = ?", (cpf,))
        return cursor.fetchone() is not None

    def email_exists(self, email: str) -> bool:
        cursor = self.conn.cursor()
        cursor.execute("SELECT 1 FROM pessoas WHERE email = ?", (email,))
        return cursor.fetchone() is not None

    @staticmethod
    def calcular_idade(data_nascimento: date) -> int:
        hoje = date.today()
        idade = hoje.year - data_nascimento.year
        if (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day):
            idade -= 1
        return idade
