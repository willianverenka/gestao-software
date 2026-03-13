from typing import Optional, TypedDict

from .base import BaseRepository


class PacienteCriadoRow(TypedDict):
    paciente_id: int
    pessoa_id: int
    convenio_id: Optional[int]
    nome: str
    cpf: str
    email: str


class PacienteRepository(BaseRepository):
    def criar_paciente(
        self,
        nome: str,
        cpf: str,
        email: str,
        telefone: Optional[str] = None,
        data_nascimento: Optional[str] = None,
        genero: Optional[str] = None,
        convenio_id: Optional[int] = None,
    ) -> PacienteCriadoRow:
        cursor = self.conn.cursor()

        # Valida CPF duplicado
        cursor.execute("SELECT 1 FROM pessoas WHERE cpf = ?", (cpf,))
        if cursor.fetchone() is not None:
            raise ValueError(f"CPF {cpf} já está cadastrado.")

        # Valida email duplicado
        cursor.execute("SELECT 1 FROM pessoas WHERE email = ?", (email,))
        if cursor.fetchone() is not None:
            raise ValueError(f"Email {email} já está cadastrado.")

        # Valida convênio se informado
        if convenio_id is not None:
            cursor.execute("SELECT 1 FROM convenios WHERE convenio_id = ?", (convenio_id,))
            if cursor.fetchone() is None:
                raise ValueError(f"Convênio com id {convenio_id} não encontrado.")

        # Cria pessoa
        cursor.execute(
            """
            INSERT INTO pessoas (nome, cpf, email, telefone, data_nascimento, genero)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (nome, cpf, email, telefone, data_nascimento, genero),
        )
        pessoa_id = cursor.lastrowid

        # Cria paciente
        cursor.execute(
            """
            INSERT INTO pacientes (pessoa_id, convenio_id)
            VALUES (?, ?)
            """,
            (pessoa_id, convenio_id),
        )
        self.conn.commit()

        return PacienteCriadoRow(
            paciente_id=cursor.lastrowid,
            pessoa_id=pessoa_id,
            convenio_id=convenio_id,
            nome=nome,
            cpf=cpf,
            email=email,
        )