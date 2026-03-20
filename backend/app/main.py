import sqlite3
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .db import get_db, with_connection
from .repositories import (
    ConsultaRepository,
    ConvenioRepository,
    EspecialidadeRepository,
    FuncionarioRepository,
    PacienteRepository,
    PessoaRepository,
)
from .schemas import (
    ConsultaVisaoMedicoDTO,
    FuncionarioCreate,
    FuncionarioCreatedDTO,
    PacienteCreate,
    PacienteCreatedDTO,
)
from .startup_sql import run_startup_sql

CARGO_FRONT_TO_DB = {
    "recepcionista": "secretaria",
    "admin": "backoffice",
    "medico": "medico",
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
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


def get_consulta_repository(conn=Depends(get_db)) -> ConsultaRepository:
    return ConsultaRepository(conn)


def get_pessoa_repository(conn=Depends(get_db)) -> PessoaRepository:
    return PessoaRepository(conn)


def get_funcionario_repository(conn=Depends(get_db)) -> FuncionarioRepository:
    return FuncionarioRepository(conn)


def get_especialidade_repository(conn=Depends(get_db)) -> EspecialidadeRepository:
    return EspecialidadeRepository(conn)


def get_convenio_repository(conn=Depends(get_db)) -> ConvenioRepository:
    return ConvenioRepository(conn)


def get_paciente_repository(conn=Depends(get_db)) -> PacienteRepository:
    return PacienteRepository(conn)


@app.post(
    "/pacientes",
    response_model=PacienteCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_paciente(
    body: PacienteCreate,
    conn=Depends(get_db),
    pessoa_repo: PessoaRepository = Depends(get_pessoa_repository),
    paciente_repo: PacienteRepository = Depends(get_paciente_repository),
    convenio_repo: ConvenioRepository = Depends(get_convenio_repository),
) -> PacienteCreatedDTO:
    cpf_digits = "".join(c for c in body.cpf if c.isdigit())
    if body.convenio == "particular":
        convenio_id = None
    else:
        convenio_id = convenio_repo.get_id_by_codigo(body.convenio)
        if convenio_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convênio inválido ou não cadastrado.",
            )
    try:
        conn.execute("BEGIN")
        pessoa_id = pessoa_repo.insert(
            nome=body.nome.strip(),
            cpf=cpf_digits,
            email=body.email,
            telefone=body.telefone,
        )
        paciente_id = paciente_repo.insert(
            pessoa_id=pessoa_id,
            convenio_id=convenio_id,
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    return PacienteCreatedDTO(paciente_id=paciente_id, pessoa_id=pessoa_id)


@app.post(
    "/funcionarios",
    response_model=FuncionarioCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_funcionario(
    body: FuncionarioCreate,
    conn=Depends(get_db),
    pessoa_repo: PessoaRepository = Depends(get_pessoa_repository),
    func_repo: FuncionarioRepository = Depends(get_funcionario_repository),
    esp_repo: EspecialidadeRepository = Depends(get_especialidade_repository),
) -> FuncionarioCreatedDTO:
    if body.cargo == "medico" and body.especialidade:
        if not esp_repo.codigo_exists(body.especialidade):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Especialidade inválida.",
            )
    cpf_digits = "".join(c for c in body.cpf if c.isdigit())
    cargo_db = CARGO_FRONT_TO_DB[body.cargo]
    crm_val = (body.crm or "").strip() or None
    try:
        conn.execute("BEGIN")
        pessoa_id = pessoa_repo.insert(
            nome=body.nome.strip(),
            cpf=cpf_digits,
            email=body.email.strip(),
            telefone=body.telefone,
        )
        funcionario_id = func_repo.insert(
            pessoa_id=pessoa_id,
            cargo=cargo_db,
            crm=crm_val,
            especialidade=body.especialidade,
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    return FuncionarioCreatedDTO(
        funcionario_id=funcionario_id,
        pessoa_id=pessoa_id,
    )


@app.get(
    "/medicos/{medico_id}/consultas",
    response_model=list[ConsultaVisaoMedicoDTO],
)
def get_consultas_visao_medico(
    medico_id: int,
    data: date,
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> list[ConsultaVisaoMedicoDTO]:
    try:
        consultas = repo.get_consultas_visao_medico(medico_id=medico_id, data=data)
        return [
            ConsultaVisaoMedicoDTO(
                consulta_id=c["consulta_id"],
                data_hora=c["data_hora"],
                paciente_nome=c["paciente_nome"],
            )
            for c in consultas
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e
