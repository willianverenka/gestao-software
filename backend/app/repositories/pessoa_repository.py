from ..schemas import PessoaCreateDTO
from .base import BaseRepository
from datetime import date

class PessoaRepository(BaseRepository):

    def create_pessoa(self, pessoa: PessoaCreateDTO):
        # cria cursor para executar SQL
        cursor = self.conn.cursor()

        # insere nova pessoa na tabela
        cursor.execute(
            """
            INSERT INTO pessoas (nome, cpf, data_nascimento)
            VALUES (?, ?, ?)
            """,
            (
                pessoa.nome,
                pessoa.cpf,
                pessoa.data_nascimento
            ),
        )

        # confirma operação no banco
        self.conn.commit()

        # retorna dados da pessoa criada
        return {
            "pessoa_id": cursor.lastrowid,
            "nome": pessoa.nome,
            "cpf": pessoa.cpf,
            "data_nascimento": pessoa.data_nascimento,
        }


    def cpf_exists(self, cpf: str) -> bool:
        # cria cursor para executar consulta SQL
        cursor = self.conn.cursor()

        # verifica se já existe pessoa com o CPF informado
        cursor.execute(
            """
            SELECT 1 FROM pessoas WHERE cpf = ?
            """,
            (cpf,)
        )

        # retorna True se encontrou algum registro
        return cursor.fetchone() is not None
    
    def calcular_idade(self, data_nascimento: date) -> int:
        hoje = date.today()
        idade = hoje.year - data_nascimento.year
        
        #caso nao tenha feito aniversario ainda no ano atual, subtrai 1 da idade
        if (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day):
            idade -= 1
        return idade
