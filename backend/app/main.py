from datetime import date

from fastapi import Depends, FastAPI, HTTPException, status
from typing import List

from .db import get_db, with_connection
from .repositories import ConsultaRepository, PessoaRepository, FuncionarioRepository, PacienteRepository
from .schemas import (
    ConsultaCreateDTO,
    ConsultaCreatedDTO,
    ConsultaVisaoMedicoDTO,
    FuncionarioCreateDTO,
    FuncionarioCreatedDTO,
    HorarioDTO,
    HorarioStatusDTO,
    HorariosDisponiveisRequest,
    PessoaCreateDTO,
    PessoaCreatedDTO,
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

def get_pessoa_repository(conn=Depends(get_db)) -> PessoaRepository:
    return PessoaRepository(conn)

def get_funcionario_repository(conn=Depends(get_db)) -> FuncionarioRepository:
    return FuncionarioRepository(conn)

def get_paciente_repository(conn=Depends(get_db)) -> PacienteRepository:
    return PacienteRepository(conn)


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
    if not repo.paciente_existe(body.paciente_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com id {body.paciente_id} não encontrado.",
        )

    if not repo.medico_existe(body.medico_id):
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
    if not repo.medico_existe(medico_id):
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


@app.post(
    "/funcionarios",
    response_model=FuncionarioCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def criar_funcionario(
    body: FuncionarioCreateDTO,
    repo: FuncionarioRepository = Depends(get_funcionario_repository),
) -> FuncionarioCreatedDTO:
    if not repo.pessoa_existe(body.pessoa_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pessoa com id {body.pessoa_id} não encontrada.",
        )

    if body.cargo == "medico" and not body.crm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CRM é obrigatório para médicos.",
        )

    if body.cargo != "medico" and body.crm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CRM é permitido apenas para médicos.",
        )

    funcionario = repo.create_funcionario(body)
    return FuncionarioCreatedDTO(**funcionario)


@app.post(
    "/pessoas",
    response_model=PessoaCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def criar_pessoa(
    body: PessoaCreateDTO,
    repo: PessoaRepository = Depends(get_pessoa_repository),
) -> PessoaCreatedDTO:
    if repo.cpf_exists(body.cpf):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"CPF {body.cpf} já cadastrado para outra pessoa.",
        )

    idade = repo.calcular_idade(body.data_nascimento)
    if idade < 18:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pessoa deve ser maior de 18 anos.",
        )

    pessoa = repo.create_pessoa(body)
    return PessoaCreatedDTO(**pessoa)


@app.post(
    "/pacientes",
    response_model=PessoaCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def criar_paciente(
    body: PessoaCreateDTO,
    pessoa_repo: PessoaRepository = Depends(get_pessoa_repository),
    paciente_repo: PacienteRepository = Depends(get_paciente_repository),
) -> PessoaCreatedDTO:
    if pessoa_repo.cpf_exists(body.cpf):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"CPF {body.cpf} já cadastrado.",
        )

    idade = pessoa_repo.calcular_idade(body.data_nascimento)
    if idade < 18:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paciente deve ser maior de 18 anos.",
        )

    pessoa = pessoa_repo.create_pessoa(body)
    paciente_repo.criar_paciente(pessoa_id=pessoa["pessoa_id"])
    return PessoaCreatedDTO(**pessoa)


@app.get(
    "/horarios",
    response_model=List[HorarioDTO],
)
def listar_horarios_disponiveis(
    especialidade: str,
    data: date,
    repo: ConsultaRepository = Depends(get_consulta_repository),
):
    horarios = repo.listar_horarios_disponiveis(especialidade, data)
    return [HorarioDTO(**h) for h in horarios]