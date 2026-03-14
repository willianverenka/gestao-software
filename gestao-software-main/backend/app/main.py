from datetime import date

from fastapi import Depends, FastAPI, HTTPException, status

from .db import get_db, with_connection
from .repositories import ConsultaRepository
from .schemas import (
    ConsultaCreateDTO,
    ConsultaCreatedDTO,
    ConsultaVisaoMedicoDTO,
    HorarioStatusDTO,
    HorariosDisponiveisRequest,
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
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> list[ConsultaVisaoMedicoDTO]:
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

    # Valida se paciente existe
    cursor.execute("SELECT 1 FROM pacientes WHERE paciente_id = ?", (body.paciente_id,))
    if cursor.fetchone() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paciente com id {body.paciente_id} não encontrado.",
        )

    # Valida se médico existe e é do cargo 'medico'
    cursor.execute(
        "SELECT 1 FROM funcionarios WHERE funcionario_id = ? AND cargo = 'medico'",
        (body.medico_id,),
    )
    if cursor.fetchone() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Médico com id {body.medico_id} não encontrado.",
        )

    # Valida se horário está ocupado
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
    # Valida se médico existe
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
