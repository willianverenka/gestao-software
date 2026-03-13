from datetime import date, datetime
from typing import List, TypedDict

from .base import BaseRepository


class ConsultaVisaoMedicoRow(TypedDict):
    consulta_id: int
    data_hora: str
    paciente_nome: str


class ConsultaCriadaRow(TypedDict):
    consulta_id: int
    paciente_id: int
    medico_id: int
    data_hora: str
    status: str


class ConsultaRepository(BaseRepository):
    def get_consultas_visao_medico(
        self,
        medico_id: int,
        data: date,
    ) -> List[ConsultaVisaoMedicoRow]:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT
                c.consulta_id,
                c.data_hora,
                pe.nome AS paciente_nome
            FROM consultas c
            JOIN pacientes p ON c.paciente_id = p.paciente_id
            JOIN pessoas pe ON p.pessoa_id = pe.pessoa_id
            WHERE
                c.medico_id = ?
                AND date(c.data_hora) = ?
            ORDER BY
                c.data_hora ASC
            """,
            (medico_id, data.isoformat()),
        )
        rows = cursor.fetchall()

        return [
            ConsultaVisaoMedicoRow(
                consulta_id=row[0],
                data_hora=row[1],
                paciente_nome=row[2],
            )
            for row in rows
        ]

    def create_consulta(
        self,
        paciente_id: int,
        medico_id: int,
        data_hora: datetime,
        status: str,
    ) -> ConsultaCriadaRow:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            INSERT INTO consultas (paciente_id, medico_id, data_hora, status)
            VALUES (?, ?, ?, ?)
            """,
            (paciente_id, medico_id, data_hora.isoformat(), status),
        )
        self.conn.commit()
        consulta_id = cursor.lastrowid
        return ConsultaCriadaRow(
            consulta_id=consulta_id,
            paciente_id=paciente_id,
            medico_id=medico_id,
            data_hora=data_hora.isoformat(),
            status=status,
        )
