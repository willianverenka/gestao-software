from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db, query, query_one
from ..schemas import PacienteCreate, PacienteResponse
from ..helpers import calcular_idade, cpf_existe, email_existe, inserir_pessoa, limpar_cpf

router = APIRouter(tags=["Pacientes"])


@router.post("/pacientes", response_model=PacienteResponse, status_code=201)
def criar_paciente(body: PacienteCreate, conn=Depends(get_db)):
    """Cria um paciente (pessoa + registro na tabela pacientes)."""

    if cpf_existe(conn, body.cpf):
        raise HTTPException(409, f"CPF {body.cpf} já cadastrado.")

    if email_existe(conn, body.email):
        raise HTTPException(409, f"Email {body.email} já cadastrado.")

    if calcular_idade(body.data_nascimento) < 18:
        raise HTTPException(400, "Paciente deve ser maior de 18 anos.")

    # 1) Cria a pessoa
    pessoa_id = inserir_pessoa(
        conn,
        nome=body.nome,
        cpf=body.cpf,
        email=body.email,
        data_nascimento=body.data_nascimento,
        telefone=body.telefone,
        genero=body.genero,
    )

    # 2) Cria o paciente vinculado
    cursor = conn.execute(
        "INSERT INTO pacientes (pessoa_id, convenio_id) VALUES (?, ?)",
        (pessoa_id, None),
    )
    conn.commit()

    return PacienteResponse(
        paciente_id=cursor.lastrowid,
        pessoa_id=pessoa_id,
        nome=body.nome,
        cpf=body.cpf,
        email=body.email,
        data_nascimento=body.data_nascimento,
    )


@router.get("/pacientes/buscar")
def buscar_paciente_por_cpf(cpf: str, conn=Depends(get_db)):
    """Busca um paciente pelo CPF."""

    row = query_one(
        conn,
        """
        SELECT pa.paciente_id, pe.nome, pe.cpf
        FROM pacientes pa
        JOIN pessoas pe ON pa.pessoa_id = pe.pessoa_id
        WHERE pe.cpf = ?
        """,
        (limpar_cpf(cpf),),
    )

    if not row:
        raise HTTPException(404, "Paciente não encontrado.")

    return row


@router.get("/pacientes/{paciente_id}/consultas")
def listar_consultas_paciente(paciente_id: int, conn=Depends(get_db)):
    """Lista todas as consultas de um paciente."""

    return query(
        conn,
        """
        SELECT c.consulta_id, c.data_hora, c.status, c.protocolo,
               pe.nome AS medico_nome, f.especialidade
        FROM consultas c
        JOIN funcionarios f  ON c.medico_id = f.funcionario_id
        JOIN pessoas pe      ON f.pessoa_id = pe.pessoa_id
        WHERE c.paciente_id = ?
        ORDER BY c.data_hora DESC
        """,
        (paciente_id,),
    )
