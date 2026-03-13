from datetime import date

from fastapi import Depends, FastAPI, HTTPException, status

from .db import get_db, with_connection
from .repositories import ConsultaRepository, FuncionarioRepository, PacienteRepository
from .schemas import (
    ConsultaCreateDTO,
    ConsultaCreatedDTO,
    ConsultaVisaoMedicoDTO,
    FuncionarioCreatedDTO,
    HorarioStatusDTO,
    HorariosDisponiveisRequest,
    MedicoCreateDTO,
    PacienteCreateDTO,
    PacienteCreatedDTO,
    SecretariaCreateDTO,
)
from .startup_sql import run_startup_sql

app = FastAPI()


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


def get_consulta_repository(conn=Depends(get_db)) -> ConsultaRepository:
    return ConsultaRepository(conn)


def get_funcionario_repository(conn=Depends(get_db)) -> FuncionarioRepository:
    return FuncionarioRepository(conn)


def get_paciente_repository(conn=Depends(get_db)) -> PacienteRepository:
    return PacienteRepository(conn)


# --- Consultas ---

@app.get(
    "/medicos/{medico_id}/consultas",
    response_model=list[ConsultaVisaoMedicoDTO],
)
def get_consultas_visao_medico(
    medico_id: int,
    data: date,
    solicitante_id: int,
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> list[ConsultaVisaoMedicoDTO]:
    # Regra de privacidade: médico só pode ver a própria agenda
    if solicitante_id != medico_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Médico só pode visualizar a própria agenda.",
        )

    consultas = repo.get_consultas_visao_medico(medico_id=medico_id, data=data)
    return [
        ConsultaVisaoMedicoDTO(
            consulta_id=c["consulta_id"],
            data_hora=c["data_hora"],
            paciente_nome=c["paciente_nome"],
        )
        for c in consultas
    ]


@app.post(
    "/consultas",
    response_model=ConsultaCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def criar_consulta(
    body: ConsultaCreateDTO,
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> ConsultaCreatedDTO:
    cursor = repo.conn.cursor()

    cursor.execute("SELECT 1 FROM pacientes WHERE paciente_id = ?", (body.paciente_id,))
    if cursor.fetchone() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com id {body.paciente_id} não encontrado.",
        )

    cursor.execute(
        "SELECT 1 FROM funcionarios WHERE funcionario_id = ? AND cargo = 'medico'",
        (body.medico_id,),
    )
    if cursor.fetchone() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Médico com id {body.medico_id} não encontrado.",
        )

    if repo.horario_ocupado(medico_id=body.medico_id, data_hora=body.data_hora):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Horário {body.data_hora} já está ocupado para este médico.",
        )

    nova = repo.create_consulta(
        paciente_id=body.paciente_id,
        medico_id=body.medico_id,
        data_hora=body.data_hora,
        status=body.status,
    )
    return ConsultaCreatedDTO(**nova)


@app.post(
    "/medicos/{medico_id}/horarios-disponiveis",
    response_model=list[HorarioStatusDTO],
)
def verificar_horarios_disponiveis(
    medico_id: int,
    body: HorariosDisponiveisRequest,
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> list[HorarioStatusDTO]:
    cursor = repo.conn.cursor()
    cursor.execute(
        "SELECT 1 FROM funcionarios WHERE funcionario_id = ? AND cargo = 'medico'",
        (medico_id,),
    )
    if cursor.fetchone() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Médico com id {medico_id} não encontrado.",
        )

    return [
        HorarioStatusDTO(
            data_hora=horario,
            disponivel=not repo.horario_ocupado(medico_id=medico_id, data_hora=horario),
        )
        for horario in body.horarios
    ]


# --- Funcionários ---

@app.post(
    "/funcionarios/medico",
    response_model=FuncionarioCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_medico(
    body: MedicoCreateDTO,
    repo: FuncionarioRepository = Depends(get_funcionario_repository),
) -> FuncionarioCreatedDTO:
    try:
        novo = repo.criar_medico(
            nome=body.pessoa.nome,
            cpf=body.pessoa.cpf,
            email=body.pessoa.email,
            crm=body.crm,
            telefone=body.pessoa.telefone,
            data_nascimento=body.pessoa.data_nascimento.isoformat() if body.pessoa.data_nascimento else None,
            genero=body.pessoa.genero,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return FuncionarioCreatedDTO(**novo)


@app.post(
    "/funcionarios/secretaria",
    response_model=FuncionarioCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar_secretaria(
    body: SecretariaCreateDTO,
    repo: FuncionarioRepository = Depends(get_funcionario_repository),
) -> FuncionarioCreatedDTO:
    novo = repo.criar_secretaria(
        nome=body.pessoa.nome,
        cpf=body.pessoa.cpf,
        email=body.pessoa.email,
        telefone=body.pessoa.telefone,
        data_nascimento=body.pessoa.data_nascimento.isoformat() if body.pessoa.data_nascimento else None,
        genero=body.pessoa.genero,
    )
    return FuncionarioCreatedDTO(**novo)


# --- Pacientes ---

@app.post(
    "/pacientes",
    response_model=PacienteCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def criar_paciente(
    body: PacienteCreateDTO,
    repo: PacienteRepository = Depends(get_paciente_repository),
) -> PacienteCreatedDTO:
    try:
        novo = repo.criar_paciente(
            nome=body.nome,
            cpf=body.cpf,
            email=body.email,
            telefone=body.telefone,
            data_nascimento=body.data_nascimento.isoformat() if body.data_nascimento else None,
            genero=body.genero,
            convenio_id=body.convenio_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return PacienteCreatedDTO(**novo)