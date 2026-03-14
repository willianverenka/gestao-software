from datetime import date

from fastapi import Depends, FastAPI, HTTPException, status
from typing import List

from .db import get_db, with_connection
from .repositories import ConsultaRepository, PessoaRepository
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


@app.post(
    "/funcionarios",
    response_model=FuncionarioCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def criar_funcionario(
    body: FuncionarioCreateDTO,
    conn=Depends(get_db),
) -> FuncionarioCreatedDTO:
    cursor = conn.cursor()

    cursor.execute("SELECT 1 FROM pessoas WHERE pessoa_id = ?", (body.pessoa_id,))
    if cursor.fetchone() is None:
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

    cursor.execute(
        "INSERT INTO funcionarios (pessoa_id, cargo) VALUES (?, ?)",
        (body.pessoa_id, body.cargo),
    )
    conn.commit()
    funcionario_id = cursor.lastrowid

    return FuncionarioCreatedDTO(
        funcionario_id=funcionario_id,
        pessoa_id=body.pessoa_id,
        cargo=body.cargo,
        crm=body.crm,
    )


@app.post(
    "/pessoas",
    response_model=PessoaCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def criar_pessoa(
    body: PessoaCreateDTO,
    conn=Depends(get_db),
) -> PessoaCreatedDTO:
    repo = PessoaRepository(conn)

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
    conn=Depends(get_db),
) -> PessoaCreatedDTO:
    repo = PessoaRepository(conn)

    # Valida CPF duplicado
    if repo.cpf_exists(body.cpf):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"CPF {body.cpf} já cadastrado.",
        )

    # Valida idade mínima
    idade = repo.calcular_idade(body.data_nascimento)
    if idade < 18:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paciente deve ser maior de 18 anos.",
        )

    # Cria a pessoa
    pessoa = repo.create_pessoa(body)
    pessoa_id = pessoa["pessoa_id"]

    # Vincula como paciente
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