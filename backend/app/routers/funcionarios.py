from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db, query, query_one
from ..schemas import FuncionarioCreate, FuncionarioResponse
from ..helpers import calcular_idade, cpf_existe, email_existe, inserir_pessoa, limpar_cpf

router = APIRouter(tags=["Funcionários"])


@router.post("/funcionarios", response_model=FuncionarioResponse, status_code=201)
def criar_funcionario(body: FuncionarioCreate, conn=Depends(get_db)):
    """Cria um funcionário (médico, secretária ou backoffice)."""

    # Validações
    if cpf_existe(conn, body.cpf):
        raise HTTPException(409, f"CPF {body.cpf} já cadastrado.")

    if email_existe(conn, body.email):
        raise HTTPException(409, f"Email {body.email} já cadastrado.")

    if calcular_idade(body.data_nascimento) < 18:
        raise HTTPException(400, "Funcionário deve ser maior de 18 anos.")

    if body.cargo == "medico" and not body.crm:
        raise HTTPException(400, "CRM é obrigatório para médicos.")

    if body.cargo == "medico" and not body.especialidade:
        raise HTTPException(400, "Especialidade é obrigatória para médicos.")

    if body.cargo != "medico" and body.crm:
        raise HTTPException(400, "CRM é permitido apenas para médicos.")

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

    # 2) Cria o funcionário vinculado
    cursor = conn.execute(
        "INSERT INTO funcionarios (pessoa_id, cargo, crm, especialidade) VALUES (?, ?, ?, ?)",
        (pessoa_id, body.cargo, body.crm, body.especialidade),
    )
    conn.commit()

    return FuncionarioResponse(
        funcionario_id=cursor.lastrowid,
        pessoa_id=pessoa_id,
        nome=body.nome,
        email=body.email,
        cargo=body.cargo,
        crm=body.crm,
        especialidade=body.especialidade,
    )


@router.get("/funcionarios/buscar")
def buscar_funcionario_por_cpf(cpf: str, conn=Depends(get_db)):
    """Busca um funcionário pelo CPF."""

    row = query_one(
        conn,
        """
        SELECT f.funcionario_id, pe.nome, pe.cpf, pe.email, f.cargo, f.crm, f.especialidade
        FROM funcionarios f
        JOIN pessoas pe ON f.pessoa_id = pe.pessoa_id
        WHERE pe.cpf = ?
        """,
        (limpar_cpf(cpf),),
    )

    if not row:
        raise HTTPException(404, "Funcionário não encontrado.")

    return row


@router.get("/especialidades")
def listar_especialidades(conn=Depends(get_db)):
    """Lista todas as especialidades médicas cadastradas."""

    rows = query(
        conn,
        """
        SELECT DISTINCT especialidade
        FROM funcionarios
        WHERE cargo = 'medico' AND especialidade IS NOT NULL
        ORDER BY especialidade
        """,
    )
    return [r["especialidade"] for r in rows]


@router.get("/medicos-disponiveis")
def listar_medicos_disponiveis(especialidade: str, data: str, hora: str, conn=Depends(get_db)):
    """Lista médicos disponíveis em um horário específico."""

    data_hora = f"{data}T{hora}"

    rows = query(
        conn,
        """
        SELECT f.funcionario_id AS medico_id, pe.nome
        FROM funcionarios f
        JOIN pessoas pe ON f.pessoa_id = pe.pessoa_id
        WHERE f.cargo = 'medico'
          AND f.especialidade = ?
          AND f.funcionario_id NOT IN (
              SELECT medico_id FROM consultas
              WHERE data_hora = ? AND status IN ('agendada', 'confirmada')
          )
        ORDER BY pe.nome
        """,
        (especialidade, data_hora),
    )

    return rows
