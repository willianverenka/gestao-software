from datetime import date, datetime
from typing import List, Optional, TypedDict

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
    protocolo: str


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

    def horario_ocupado(self, medico_id: int, data_hora: datetime) -> bool:
        """Retorna True se já existe consulta agendada ou confirmada nesse horário."""
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT 1 FROM consultas
            WHERE medico_id = ?
              AND data_hora = ?
              AND status IN ('agendada', 'confirmada')
            """,
            (medico_id, data_hora.isoformat()),
        )
        return cursor.fetchone() is not None

    def _gerar_protocolo(self, consulta_id: int, data_hora: datetime) -> str:
        """Gera protocolo no formato YYYYMM-{consulta_id:03d}. Ex: 202603-001"""
        prefixo = data_hora.strftime("%Y%m")
        return f"{prefixo}-{consulta_id:03d}"

    def create_consulta(
        self,
        paciente_id: int,
        medico_id: int,
        data_hora: datetime,
        status: str,
    ) -> ConsultaCriadaRow:
        cursor = self.conn.cursor()

        # Insere a consulta sem protocolo primeiro
        cursor.execute(
            """
            INSERT INTO consultas (paciente_id, medico_id, data_hora, status)
            VALUES (?, ?, ?, ?)
            """,
            (paciente_id, medico_id, data_hora.isoformat(), status),
        )
        consulta_id = cursor.lastrowid

        # Gera e salva o protocolo único
        protocolo = self._gerar_protocolo(consulta_id, data_hora)
        cursor.execute(
            "UPDATE consultas SET protocolo = ? WHERE consulta_id = ?",
            (protocolo, consulta_id),
        )
        self.conn.commit()

        return ConsultaCriadaRow(
            consulta_id=consulta_id,
            paciente_id=paciente_id,
            medico_id=medico_id,
            data_hora=data_hora.isoformat(),
            status=status,
            protocolo=protocolo,
        )