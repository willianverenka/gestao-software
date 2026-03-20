from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db, query
from ..schemas import StatusUpdate

router = APIRouter(prefix="/backoffice", tags=["Backoffice"])


@router.get("/consultas")
def listar_consultas(conn=Depends(get_db)):
    """Lista todas as consultas com nomes do paciente e médico."""

    return query(
        conn,
        """
        SELECT c.consulta_id, c.data_hora, c.status, c.protocolo,
               pe_pac.nome AS paciente_nome, pe_med.nome AS medico_nome,
               c.paciente_id, c.medico_id
        FROM consultas c
        JOIN pacientes p       ON c.paciente_id = p.paciente_id
        JOIN pessoas pe_pac    ON p.pessoa_id = pe_pac.pessoa_id
        JOIN funcionarios f    ON c.medico_id = f.funcionario_id
        JOIN pessoas pe_med    ON f.pessoa_id = pe_med.pessoa_id
        ORDER BY c.data_hora DESC
        """,
    )


@router.patch("/consultas/{consulta_id}/status")
def atualizar_status(consulta_id: int, body: StatusUpdate, conn=Depends(get_db)):
    """Atualiza o status de uma consulta (agendada, confirmada, cancelada)."""

    cursor = conn.execute(
        "UPDATE consultas SET status = ? WHERE consulta_id = ?",
        (body.status, consulta_id),
    )
    conn.commit()

    if cursor.rowcount == 0:
        raise HTTPException(404, "Consulta não encontrada.")

    return {"consulta_id": consulta_id, "status": body.status}


@router.get("/pacientes")
def listar_pacientes(conn=Depends(get_db)):
    """Lista todos os pacientes cadastrados."""

    return query(
        conn,
        """
        SELECT pa.paciente_id, pe.nome, pe.cpf, pe.email, pe.data_nascimento
        FROM pacientes pa
        JOIN pessoas pe ON pa.pessoa_id = pe.pessoa_id
        ORDER BY pe.nome
        """,
    )

@router.get("/medicos")
def listar_medicos(conn=Depends(get_db)):
    """Lista todos os médicos cadastrados."""

    return query(
        conn,
        """
        SELECT f.funcionario_id, pe.nome, pe.email, f.crm, f.especialidade
        FROM funcionarios f
        JOIN pessoas pe ON f.pessoa_id = pe.pessoa_id
        WHERE f.cargo = 'medico'
        ORDER BY pe.nome
        """,
    )
