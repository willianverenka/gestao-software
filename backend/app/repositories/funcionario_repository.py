from typing import Optional, TypedDict

from .base import BaseRepository


class FuncionarioCriadoRow(TypedDict):
    funcionario_id: int
    pessoa_id: int
    cargo: str
    crm: Optional[str]


class FuncionarioRepository(BaseRepository):
    def _criar_pessoa(
        self,
        nome: str,
        cpf: str,
        email: str,
        telefone: Optional[str],
        data_nascimento: Optional[str],
        genero: Optional[str],
    ) -> int:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            INSERT INTO pessoas (nome, cpf, email, telefone, data_nascimento, genero)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (nome, cpf, email, telefone, data_nascimento, genero),
        )
        return cursor.lastrowid

    def criar_medico(
        self,
        nome: str,
        cpf: str,
        email: str,
        crm: str,
        telefone: Optional[str] = None,
        data_nascimento: Optional[str] = None,
        genero: Optional[str] = None,
    ) -> FuncionarioCriadoRow:
        cursor = self.conn.cursor()

        cursor.execute("SELECT 1 FROM funcionarios WHERE crm = ?", (crm,))
        if cursor.fetchone() is not None:
            raise ValueError(f"CRM {crm} já está cadastrado.")

        pessoa_id = self._criar_pessoa(nome, cpf, email, telefone, data_nascimento, genero)

        cursor.execute(
            """
            INSERT INTO funcionarios (pessoa_id, cargo, crm)
            VALUES (?, 'medico', ?)
            """,
            (pessoa_id, crm),
        )
        self.conn.commit()
        return FuncionarioCriadoRow(
            funcionario_id=cursor.lastrowid,
            pessoa_id=pessoa_id,
            cargo="medico",
            crm=crm,
        )

    def criar_secretaria(
        self,
        nome: str,
        cpf: str,
        email: str,
        telefone: Optional[str] = None,
        data_nascimento: Optional[str] = None,
        genero: Optional[str] = None,
    ) -> FuncionarioCriadoRow:
        pessoa_id = self._criar_pessoa(nome, cpf, email, telefone, data_nascimento, genero)

        cursor = self.conn.cursor()
        cursor.execute(
            """
            INSERT INTO funcionarios (pessoa_id, cargo, crm)
            VALUES (?, 'secretaria', NULL)
            """,
            (pessoa_id,),
        )
        self.conn.commit()
        return FuncionarioCriadoRow(
            funcionario_id=cursor.lastrowid,
            pessoa_id=pessoa_id,
            cargo="secretaria",
            crm=None,
        )