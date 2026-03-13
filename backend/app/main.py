from datetime import date

from fastapi import Depends, FastAPI

from .db import get_db, with_connection
from .repositories import ConsultaRepository
from .schemas import ConsultaVisaoMedicoDTO
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

