from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db, query, query_one
from ..schemas import (
    ConsultaCreate,
    ConsultaResponse,
    HorarioDisponivel,
    HorarioStatus,
    HorariosDisponiveisRequest,
)

router = APIRouter(tags=["Consultas"])


# ── Helpers internos ──


def _horario_ocupado(conn, medico_id: int, data_hora: datetime) -> bool:
    """Verifica se um médico já tem consulta nesse horário."""
    row = conn.execute(
        """
        SELECT 1 FROM consultas
        WHERE medico_id = ? AND data_hora = ? AND status IN ('agendada', 'confirmada')
        """,
        (medico_id, data_hora.isoformat()),
    ).fetchone()
    return row is not None

def _gerar_protocolo(consulta_id: int, data_hora: datetime) -> str:
    """Gera protocolo no formato YYYYMM-001."""
    return f"{data_hora.strftime('%Y%m')}-{consulta_id:03d}"

# ── Rotas ──

@router.post("/consultas", response_model=ConsultaResponse, status_code=201)
def criar_consulta(body: ConsultaCreate, conn=Depends(get_db)):
    """Cria uma nova consulta."""

    # Verifica se paciente existe
    if not query_one(conn, "SELECT 1 FROM pacientes WHERE paciente_id = ?", (body.paciente_id,)):
        raise HTTPException(404, f"Paciente com id {body.paciente_id} não encontrado.")

    # Verifica se médico existe
    if not query_one(conn, "SELECT 1 FROM funcionarios WHERE funcionario_id = ? AND cargo = 'medico'", (body.medico_id,)):
        raise HTTPException(404, f"Médico com id {body.medico_id} não encontrado.")

    # Verifica conflito de horário
    if _horario_ocupado(conn, body.medico_id, body.data_hora):
        raise HTTPException(409, f"Horário {body.data_hora} já está ocupado para este médico.")

    # Insere a consulta
    cursor = conn.execute(
        "INSERT INTO consultas (paciente_id, medico_id, data_hora, status) VALUES (?, ?, ?, ?)",
        (body.paciente_id, body.medico_id, body.data_hora.isoformat(), body.status),
    )
    consulta_id = cursor.lastrowid

    # Gera e salva o protocolo
    protocolo = _gerar_protocolo(consulta_id, body.data_hora)
    conn.execute(
        "UPDATE consultas SET protocolo = ? WHERE consulta_id = ?",
        (protocolo, consulta_id),
    )
    conn.commit()

    return ConsultaResponse(
        consulta_id=consulta_id,
        paciente_id=body.paciente_id,
        medico_id=body.medico_id,
        data_hora=body.data_hora,
        status=body.status,
        protocolo=protocolo,
    )


@router.get("/medico/{medico_id}/agenda")
def get_agenda_medico(medico_id: int, data: date, conn=Depends(get_db)):
    """Retorna a agenda do médico em uma data específica."""

    return query(
        conn,
        """
        SELECT c.consulta_id, c.data_hora, c.status, c.protocolo,
               pe.nome AS paciente_nome
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.paciente_id
        JOIN pessoas pe  ON p.pessoa_id = pe.pessoa_id
        WHERE c.medico_id = ? AND date(c.data_hora) = ?
        ORDER BY c.data_hora
        """,
        (medico_id, data.isoformat()),
    )


@router.get("/medicos/{medico_id}/consultas")
def get_consultas_medico(medico_id: int, data: date, solicitante_id: int, conn=Depends(get_db)):
    """Retorna consultas do médico (com verificação de privacidade)."""

    if solicitante_id != medico_id:
        raise HTTPException(403, "Acesso negado.")

    return query(
        conn,
        """
        SELECT c.consulta_id, c.data_hora, pe.nome AS paciente_nome
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.paciente_id
        JOIN pessoas pe  ON p.pessoa_id = pe.pessoa_id
        WHERE c.medico_id = ? AND date(c.data_hora) = ?
        ORDER BY c.data_hora
        """,
        (medico_id, data.isoformat()),
    )

# ── Horários ──

@router.get("/horarios", response_model=list[HorarioDisponivel])
def listar_horarios_disponiveis(especialidade: str, data: date, conn=Depends(get_db)):
    """Lista todos os horários disponíveis de médicos de uma especialidade em uma data."""

    # Busca médicos da especialidade
    medicos = query(
        conn,
        """
        SELECT f.funcionario_id, p.nome
        FROM funcionarios f
        JOIN pessoas p ON p.pessoa_id = f.pessoa_id
        WHERE f.cargo = 'medico' AND f.especialidade = ?
        """,
        (especialidade,),
    )

    # Gera slots de 30 min (08:00 às 17:00) e filtra os ocupados
    horarios = []
    for medico in medicos:
        atual = datetime.combine(data, time(8, 0))
        limite = datetime.combine(data, time(17, 0))

        while atual < limite:
            if not _horario_ocupado(conn, medico["funcionario_id"], atual):
                horarios.append(
                    HorarioDisponivel(
                        medico_id=medico["funcionario_id"],
                        medico_nome=medico["nome"],
                        especialidade=especialidade,
                        data=data,
                        hora=atual.time(),
                    )
                )
            atual += timedelta(minutes=30)

    return horarios


@router.post("/medicos/{medico_id}/horarios-disponiveis", response_model=list[HorarioStatus])
def verificar_horarios(medico_id: int, body: HorariosDisponiveisRequest, conn=Depends(get_db)):
    """Verifica quais horários de uma lista estão disponíveis para um médico."""

    # Verifica se médico existe
    if not query_one(conn, "SELECT 1 FROM funcionarios WHERE funcionario_id = ? AND cargo = 'medico'", (medico_id,)):
        raise HTTPException(404, f"Médico com id {medico_id} não encontrado.")

    return [
        HorarioStatus(
            data_hora=horario,
            disponivel=not _horario_ocupado(conn, medico_id, horario),
        )
        for horario in body.horarios
    ]
