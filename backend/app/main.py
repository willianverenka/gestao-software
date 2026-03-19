from datetime import date
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .db import get_db, with_connection
from .repositories import (
    ConsultaRepository,
    FuncionarioRepository,
    PacienteRepository,
    PessoaRepository,
)
from .schemas import (
    ConsultaCreateDTO,
    ConsultaCreatedDTO,
    ConsultaVisaoMedicoDTO,
    FuncionarioCreateDTO,
    FuncionarioCreatedDTO,
    HorarioDTO,
    HorarioStatusDTO,
    HorariosDisponiveisRequest,
    PacienteCreateDTO,
    PacienteCreatedDTO,
    PessoaCreateDTO,
    PessoaCreatedDTO,
)
from .startup_sql import run_startup_sql

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    with with_connection() as conn:
        run_startup_sql(conn)


@app.get("/health")
def read_health():
    return {"status": "ok"}


@app.get("/db-check")
def db_check(conn=Depends(get_db)):
    conn.execute("SELECT 1")
    return {"status": "db-ok"}


def get_pessoa_repo(conn=Depends(get_db)) -> PessoaRepository:
    return PessoaRepository(conn)


def get_funcionario_repo(conn=Depends(get_db)) -> FuncionarioRepository:
    return FuncionarioRepository(conn)


def get_paciente_repo(conn=Depends(get_db)) -> PacienteRepository:
    return PacienteRepository(conn)


def get_consulta_repo(conn=Depends(get_db)) -> ConsultaRepository:
    return ConsultaRepository(conn)


# ──────────────────── Pessoas ────────────────────


@app.post("/pessoas", response_model=PessoaCreatedDTO, status_code=status.HTTP_201_CREATED)
def criar_pessoa(body: PessoaCreateDTO, repo: PessoaRepository = Depends(get_pessoa_repo)) -> PessoaCreatedDTO:
    if repo.cpf_exists(body.cpf):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"CPF {body.cpf} já cadastrado.")
    if repo.email_exists(body.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email {body.email} já cadastrado.")
    idade = repo.calcular_idade(body.data_nascimento)
    if idade < 18:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pessoa deve ser maior de 18 anos.")
    pessoa = repo.create_pessoa(body)
    return PessoaCreatedDTO(**pessoa)


# ──────────────────── Funcionários ────────────────────


@app.post("/funcionarios", response_model=FuncionarioCreatedDTO, status_code=status.HTTP_201_CREATED)
def criar_funcionario(
    body: FuncionarioCreateDTO,
    pessoa_repo: PessoaRepository = Depends(get_pessoa_repo),
    func_repo: FuncionarioRepository = Depends(get_funcionario_repo),
) -> FuncionarioCreatedDTO:
    if pessoa_repo.cpf_exists(body.cpf):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"CPF {body.cpf} já cadastrado.")
    if pessoa_repo.email_exists(body.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email {body.email} já cadastrado.")
    idade = pessoa_repo.calcular_idade(body.data_nascimento)
    if idade < 18:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Funcionário deve ser maior de 18 anos.")
    if body.cargo == "medico" and not body.crm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CRM é obrigatório para médicos.")
    if body.cargo == "medico" and not body.especialidade:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Especialidade é obrigatória para médicos.")
    if body.cargo != "medico" and body.crm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CRM é permitido apenas para médicos.")

    pessoa_dto = PessoaCreateDTO(
        nome=body.nome, cpf=body.cpf, email=body.email,
        data_nascimento=body.data_nascimento,
        telefone=body.telefone, genero=body.genero,
    )
    pessoa = pessoa_repo.create_pessoa(pessoa_dto)
    func = func_repo.create_funcionario(
        pessoa_id=pessoa["pessoa_id"], cargo=body.cargo,
        crm=body.crm, especialidade=body.especialidade,
    )
    return FuncionarioCreatedDTO(
        funcionario_id=func["funcionario_id"], pessoa_id=func["pessoa_id"],
        nome=body.nome, email=body.email, cargo=func["cargo"],
        crm=func["crm"], especialidade=func["especialidade"],
    )


@app.get("/funcionarios/buscar")
def buscar_funcionario_por_cpf(cpf: str, conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT f.funcionario_id, pe.nome, pe.cpf, pe.email, f.cargo, f.crm, f.especialidade
        FROM funcionarios f
        JOIN pessoas pe ON f.pessoa_id = pe.pessoa_id
        WHERE pe.cpf = ?
        """,
        (cpf.replace(".", "").replace("-", ""),),
    )
    row = cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado.")
    return {"funcionario_id": row[0], "nome": row[1], "cpf": row[2], "email": row[3], "cargo": row[4], "crm": row[5], "especialidade": row[6]}


@app.get("/especialidades")
def listar_especialidades(repo: FuncionarioRepository = Depends(get_funcionario_repo)):
    return repo.listar_especialidades()


@app.get("/medicos-disponiveis")
def listar_medicos_disponiveis(especialidade: str, data: str, hora: str, conn=Depends(get_db)):
    cursor = conn.cursor()
    data_hora = f"{data}T{hora}"
    cursor.execute(
        """
        SELECT f.funcionario_id, pe.nome
        FROM funcionarios f
        JOIN pessoas pe ON f.pessoa_id = pe.pessoa_id
        WHERE f.cargo = 'medico'
          AND f.especialidade = ?
          AND f.funcionario_id NOT IN (
            SELECT medico_id FROM consultas
            WHERE data_hora = ?
            AND status IN ('agendada', 'confirmada')
          )
        ORDER BY pe.nome ASC
        """,
        (especialidade, data_hora),
    )
    rows = cursor.fetchall()
    return [{"medico_id": row[0], "nome": row[1]} for row in rows]


# ──────────────────── Pacientes ────────────────────


@app.post("/pacientes", response_model=PacienteCreatedDTO, status_code=status.HTTP_201_CREATED)
def criar_paciente(
    body: PacienteCreateDTO,
    pessoa_repo: PessoaRepository = Depends(get_pessoa_repo),
    pac_repo: PacienteRepository = Depends(get_paciente_repo),
) -> PacienteCreatedDTO:
    if pessoa_repo.cpf_exists(body.cpf):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"CPF {body.cpf} já cadastrado.")
    if pessoa_repo.email_exists(body.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email {body.email} já cadastrado.")
    idade = pessoa_repo.calcular_idade(body.data_nascimento)
    if idade < 18:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Paciente deve ser maior de 18 anos.")
    pessoa_dto = PessoaCreateDTO(
        nome=body.nome, cpf=body.cpf, email=body.email,
        data_nascimento=body.data_nascimento,
        telefone=body.telefone, genero=body.genero,
    )
    pessoa = pessoa_repo.create_pessoa(pessoa_dto)
    paciente = pac_repo.criar_paciente(pessoa_id=pessoa["pessoa_id"])
    return PacienteCreatedDTO(
        paciente_id=paciente["paciente_id"], pessoa_id=pessoa["pessoa_id"],
        nome=body.nome, cpf=body.cpf, email=body.email, data_nascimento=body.data_nascimento,
    )


@app.get("/pacientes/buscar")
def buscar_paciente_por_cpf(cpf: str, conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT pa.paciente_id, pe.nome, pe.cpf
        FROM pacientes pa
        JOIN pessoas pe ON pa.pessoa_id = pe.pessoa_id
        WHERE pe.cpf = ?
        """,
        (cpf.replace(".", "").replace("-", ""),),
    )
    row = cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado.")
    return {"paciente_id": row[0], "nome": row[1], "cpf": row[2]}


@app.get("/pacientes/{paciente_id}/consultas")
def listar_consultas_paciente(paciente_id: int, conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT c.consulta_id, c.data_hora, c.status, c.protocolo,
            pe_med.nome AS medico_nome, f.especialidade
        FROM consultas c
        JOIN funcionarios f ON c.medico_id = f.funcionario_id
        JOIN pessoas pe_med ON f.pessoa_id = pe_med.pessoa_id
        WHERE c.paciente_id = ?
        ORDER BY c.data_hora DESC
        """,
        (paciente_id,),
    )
    rows = cursor.fetchall()
    return [{"consulta_id": row[0], "data_hora": row[1], "status": row[2], "protocolo": row[3], "medico_nome": row[4], "especialidade": row[5]} for row in rows]


# ──────────────────── Consultas ────────────────────


@app.post("/consultas", response_model=ConsultaCreatedDTO, status_code=status.HTTP_201_CREATED)
def criar_consulta(
    body: ConsultaCreateDTO,
    pac_repo: PacienteRepository = Depends(get_paciente_repo),
    func_repo: FuncionarioRepository = Depends(get_funcionario_repo),
    consulta_repo: ConsultaRepository = Depends(get_consulta_repo),
) -> ConsultaCreatedDTO:
    if not pac_repo.exists(body.paciente_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Paciente com id {body.paciente_id} não encontrado.")
    if not func_repo.medico_exists(body.medico_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Médico com id {body.medico_id} não encontrado.")
    if consulta_repo.horario_ocupado(medico_id=body.medico_id, data_hora=body.data_hora):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Horário {body.data_hora} já está ocupado para este médico.")
    nova = consulta_repo.create_consulta(
        paciente_id=body.paciente_id, medico_id=body.medico_id,
        data_hora=body.data_hora, status=body.status,
    )
    return ConsultaCreatedDTO(**nova)


@app.get("/medicos/{medico_id}/consultas", response_model=list[ConsultaVisaoMedicoDTO])
def get_consultas_visao_medico(
    medico_id: int, data: date, solicitante_id: int,
    repo: ConsultaRepository = Depends(get_consulta_repo),
) -> list[ConsultaVisaoMedicoDTO]:
    if solicitante_id != medico_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    consultas = repo.get_consultas_visao_medico(medico_id=medico_id, data=data)
    return [ConsultaVisaoMedicoDTO(consulta_id=c["consulta_id"], data_hora=c["data_hora"], paciente_nome=c["paciente_nome"]) for c in consultas]


@app.get("/medico/{medico_id}/agenda")
def get_agenda_medico(medico_id: int, data: date, conn=Depends(get_db)):
    """Endpoint GET /medico/{id}/agenda?data= — agenda do médico por data."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            c.consulta_id, c.data_hora, c.status, c.protocolo,
            pe.nome AS paciente_nome
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.paciente_id
        JOIN pessoas pe ON p.pessoa_id = pe.pessoa_id
        WHERE
            c.medico_id = ?
            AND date(c.data_hora) = ?
        ORDER BY c.data_hora ASC
        """,
        (medico_id, data.isoformat()),
    )
    rows = cursor.fetchall()
    return [
        {
            "consulta_id": row[0],
            "data_hora": row[1],
            "status": row[2],
            "protocolo": row[3],
            "paciente_nome": row[4],
        }
        for row in rows
    ]


# ──────────────────── Horários ────────────────────


@app.post("/medicos/{medico_id}/horarios-disponiveis", response_model=list[HorarioStatusDTO])
def verificar_horarios_disponiveis(
    medico_id: int, body: HorariosDisponiveisRequest,
    func_repo: FuncionarioRepository = Depends(get_funcionario_repo),
    consulta_repo: ConsultaRepository = Depends(get_consulta_repo),
) -> list[HorarioStatusDTO]:
    if not func_repo.medico_exists(medico_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Médico com id {medico_id} não encontrado.")
    return [HorarioStatusDTO(data_hora=horario, disponivel=not consulta_repo.horario_ocupado(medico_id=medico_id, data_hora=horario)) for horario in body.horarios]


@app.post(
    "/pacientes",
    response_model=PessoaCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def criar_paciente(
    body: PessoaCreateDTO,
    conn=Depends(get_db),
) -> PessoaCreatedDTO:
    repo = PessoaRepository(conn)

    if repo.cpf_exists(body.cpf):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"CPF {body.cpf} já cadastrado.",
        )

    idade = repo.calcular_idade(body.data_nascimento)
    if idade < 18:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paciente deve ser maior de 18 anos.",
        )

    pessoa = repo.create_pessoa(body)
    pessoa_id = pessoa["pessoa_id"]

    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO pacientes (pessoa_id) VALUES (?)",
        (pessoa_id,),
    )
    conn.commit()

    return PessoaCreatedDTO(**pessoa)


@app.get(
    "/horarios",
    response_model=List[HorarioDTO],
)
def listar_horarios_disponiveis(
    especialidade: str,
    data: date,
    conn=Depends(get_db),
):
    repo = ConsultaRepository(conn)
    horarios = repo.listar_horarios_disponiveis(especialidade, data)
    return [HorarioDTO(**h) for h in horarios]


# ──────────────────── Backoffice ────────────────────


@app.get("/backoffice/consultas")
def listar_consultas_backoffice(conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT c.consulta_id, c.data_hora, c.status, c.protocolo,
            pe_pac.nome AS paciente_nome, pe_med.nome AS medico_nome,
            c.paciente_id, c.medico_id
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.paciente_id
        JOIN pessoas pe_pac ON p.pessoa_id = pe_pac.pessoa_id
        JOIN funcionarios f ON c.medico_id = f.funcionario_id
        JOIN pessoas pe_med ON f.pessoa_id = pe_med.pessoa_id
        ORDER BY c.data_hora DESC
        """
    )
    rows = cursor.fetchall()
    return [{"consulta_id": row[0], "data_hora": row[1], "status": row[2], "protocolo": row[3], "paciente_nome": row[4], "medico_nome": row[5], "paciente_id": row[6], "medico_id": row[7]} for row in rows]


@app.patch("/backoffice/consultas/{consulta_id}/status")
def atualizar_status_consulta(consulta_id: int, body: dict, conn=Depends(get_db)):
    novo_status = body.get("status")
    if novo_status not in ["agendada", "confirmada", "cancelada"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status inválido.")
    cursor = conn.cursor()
    cursor.execute("UPDATE consultas SET status = ? WHERE consulta_id = ?", (novo_status, consulta_id))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consulta não encontrada.")
    return {"consulta_id": consulta_id, "status": novo_status}


@app.get("/backoffice/pacientes")
def listar_pacientes_backoffice(conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT pa.paciente_id, pe.nome, pe.cpf, pe.email, pe.data_nascimento
        FROM pacientes pa
        JOIN pessoas pe ON pa.pessoa_id = pe.pessoa_id
        ORDER BY pe.nome ASC
        """
    )
    rows = cursor.fetchall()
    return [{"paciente_id": row[0], "nome": row[1], "cpf": row[2], "email": row[3], "data_nascimento": row[4]} for row in rows]


@app.get("/backoffice/medicos")
def listar_medicos_backoffice(conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT f.funcionario_id, pe.nome, pe.email, f.crm, f.especialidade
        FROM funcionarios f
        JOIN pessoas pe ON f.pessoa_id = pe.pessoa_id
        WHERE f.cargo = 'medico'
        ORDER BY pe.nome ASC
        """
    )
    rows = cursor.fetchall()
    return [{"funcionario_id": row[0], "nome": row[1], "email": row[2], "crm": row[3], "especialidade": row[4]} for row in rows]