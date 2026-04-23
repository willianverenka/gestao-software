from datetime import date, datetime
from typing import Dict, List, Literal, Optional, Set, TypedDict

from .base import BaseRepository


class ConsultaVisaoMedicoRow(TypedDict):
    consulta_id: int
    data_hora: str
    paciente_nome: str


class ConsultaPendenteDeConfirmacaoRow(TypedDict):
    consulta_id: int
    paciente_nome: str
    medico_nome: str
    data_hora: datetime
    status: str


class ConsultaNotificacaoPacienteRow(TypedDict):
    consulta_id: int
    paciente_nome: str
    medico_nome: str
    data_hora: datetime
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

    def get_medicos_por_especialidade(self, especialidade: str) -> List[int]:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT funcionario_id
            FROM funcionarios
            WHERE cargo = 'medico'
              AND especialidade = ?
            ORDER BY funcionario_id ASC
            """,
            (especialidade,),
        )
        rows = cursor.fetchall()
        return [int(r[0]) for r in rows]

    def _gerar_slots(self) -> List[str]:
        # Slot de 30 min a partir de 08:00 até 17:30 (08:00 inclusive, 18:00 exclusive).
        slots: List[str] = []
        for total_minutes in range(8 * 60, 18 * 60, 30):
            h = total_minutes // 60
            m = total_minutes % 60
            slots.append(f"{h:02d}:{m:02d}")
        return slots

    def get_horarios_disponiveis_por_especialidade(
        self,
        especialidade: str,
        data: date,
    ) -> List[str]:
        medicos = self.get_medicos_por_especialidade(especialidade=especialidade)
        if not medicos:
            return []

        slots = self._gerar_slots()

        placeholders = ",".join(["?"] * len(medicos))
        cursor = self.conn.cursor()
        cursor.execute(
            f"""
            SELECT
                c.medico_id,
                strftime('%H:%M', c.data_hora) AS slot
            FROM consultas c
            WHERE
                c.medico_id IN ({placeholders})
                AND date(c.data_hora) = ?
                AND c.status != 'cancelada'
            """,
            (*medicos, data.isoformat()),
        )
        rows = cursor.fetchall()

        ocupados_por_medico: Dict[int, Set[str]] = {m: set() for m in medicos}
        for medico_id, slot in rows:
            ocupados_por_medico[int(medico_id)].add(str(slot))

        # Um slot fica disponível se existe pelo menos um médico que não está ocupado naquele horário.
        disponiveis: List[str] = []
        for slot in slots:
            if any(slot not in ocupados_por_medico[med] for med in medicos):
                disponiveis.append(slot)
        return disponiveis

    def get_primeiro_medico_disponivel(
        self,
        especialidade: str,
        data: date,
        hora: str,
    ) -> Optional[int]:
        medicos = self.get_medicos_por_especialidade(especialidade=especialidade)
        if not medicos:
            return None

        placeholders = ",".join(["?"] * len(medicos))
        cursor = self.conn.cursor()
        cursor.execute(
            f"""
            SELECT DISTINCT c.medico_id
            FROM consultas c
            WHERE
                c.medico_id IN ({placeholders})
                AND date(c.data_hora) = ?
                AND strftime('%H:%M', c.data_hora) = ?
                AND c.status != 'cancelada'
            ORDER BY c.medico_id ASC
            """,
            (*medicos, data.isoformat(), hora),
        )
        busy_medicos = {int(r[0]) for r in cursor.fetchall()}

        for medico_id in medicos:
            if medico_id not in busy_medicos:
                return medico_id
        return None

    def get_consultas_pendentes_de_confirmacao(
        self,
    ) -> List[ConsultaPendenteDeConfirmacaoRow]:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT
                c.consulta_id,
                pe_paciente.nome AS paciente_nome,
                pe_medico.nome AS medico_nome,
                c.data_hora,
                c.status
            FROM consultas c
            JOIN pacientes p ON c.paciente_id = p.paciente_id
            JOIN pessoas pe_paciente ON p.pessoa_id = pe_paciente.pessoa_id
            JOIN funcionarios f ON c.medico_id = f.funcionario_id
            JOIN pessoas pe_medico ON f.pessoa_id = pe_medico.pessoa_id
            WHERE c.status = 'agendada'
            """,
        )
        rows = cursor.fetchall()

        consultas = [
            ConsultaPendenteDeConfirmacaoRow(
                consulta_id=int(row[0]),
                paciente_nome=str(row[1]),
                medico_nome=str(row[2]),
                data_hora=datetime.fromisoformat(str(row[3])),
                status=str(row[4]),
            )
            for row in rows
        ]

        return consultas

    def get_dados_notificacao_paciente(
        self,
        consulta_id: int,
    ) -> Optional[ConsultaNotificacaoPacienteRow]:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT
                c.consulta_id,
                pe_paciente.nome AS paciente_nome,
                pe_medico.nome AS medico_nome,
                c.data_hora,
                c.status
            FROM consultas c
            JOIN pacientes p ON c.paciente_id = p.paciente_id
            JOIN pessoas pe_paciente ON p.pessoa_id = pe_paciente.pessoa_id
            JOIN funcionarios f ON c.medico_id = f.funcionario_id
            JOIN pessoas pe_medico ON f.pessoa_id = pe_medico.pessoa_id
            WHERE c.consulta_id = ?
            """,
            (consulta_id,),
        )
        row = cursor.fetchone()

        if row is None:
            return None

        return ConsultaNotificacaoPacienteRow(
            consulta_id=int(row[0]),
            paciente_nome=str(row[1]),
            medico_nome=str(row[2]),
            data_hora=datetime.fromisoformat(str(row[3])),
            status=str(row[4]),
        )

    def update_consulta_status_secretaria(
        self,
        consulta_id: int,
        novo_status: Literal["confirmada", "cancelada"],
    ) -> bool:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            UPDATE consultas
            SET status = ?
            WHERE consulta_id = ? AND status = 'agendada'
            """,
            (novo_status, consulta_id),
        )
        return cursor.rowcount == 1