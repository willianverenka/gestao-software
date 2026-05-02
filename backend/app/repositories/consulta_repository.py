from datetime import date, datetime
from typing import Dict, List, Literal, Optional, Set, TypedDict

from .base import BaseRepository


class ConsultaVisaoMedicoRow(TypedDict):
    consulta_id: int
    data_hora: str
    paciente_nome: str
    status: str
    convenio_nome: str

class ConsultaAgendaImpressaoRow(TypedDict):
    consulta_id: int
    data_hora: datetime
    paciente_nome: str
    convenio_nome: str

class ConsultaPendenteDeConfirmacaoRow(TypedDict):
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
                pe.nome AS paciente_nome,
                c.status,
                COALESCE(cv.nome, 'Não informado') AS convenio_nome
            FROM consultas c
            JOIN pacientes p ON c.paciente_id = p.paciente_id
            JOIN pessoas pe ON p.pessoa_id = pe.pessoa_id
            LEFT JOIN convenios cv ON p.convenio_id = cv.convenio_id
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
                status=row[3],
                convenio_nome=row[4],
            )
            for row in rows
        ]

    def get_datas_com_consultas_visao_medico(
        self,
        medico_id: int,
        ano: int,
        mes: int,
    ) -> List[date]:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT DISTINCT date(c.data_hora) AS data_consulta
            FROM consultas c
            WHERE
                c.medico_id = ?
                AND strftime('%Y', c.data_hora) = ?
                AND strftime('%m', c.data_hora) = ?
            ORDER BY data_consulta ASC
            """,
            (medico_id, f"{ano:04d}", f"{mes:02d}"),
        )
        rows = cursor.fetchall()
        return [date.fromisoformat(str(row[0])) for row in rows]

    def get_consultas_para_impressao_agenda_medico(
        self,
        medico_id: int,
        data: date,
    ) -> List[ConsultaAgendaImpressaoRow]:
        cursor = self.conn.cursor()
        cursor.execute(
            """
            SELECT
                c.consulta_id,
                c.data_hora,
                pe.nome AS paciente_nome,
                COALESCE(cv.nome, 'Não informado') AS convenio_nome
            FROM consultas c
            JOIN pacientes p ON c.paciente_id = p.paciente_id
            JOIN pessoas pe ON p.pessoa_id = pe.pessoa_id
            LEFT JOIN convenios cv ON p.convenio_id = cv.convenio_id
            WHERE
                c.medico_id = ?
                AND date(c.data_hora) = ?
                AND c.status = 'confirmada'
            ORDER BY
                c.data_hora ASC
            """,
            (medico_id, data.isoformat()),
        )
        rows = cursor.fetchall()

        return [
            ConsultaAgendaImpressaoRow(
                consulta_id=int(row[0]),
                data_hora=datetime.fromisoformat(str(row[1])),
                paciente_nome=str(row[2]),
                convenio_nome=str(row[3]),
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
                f"""
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

            consultas = [ConsultaPendenteDeConfirmacaoRow(
                consulta_id=int(row[0]),
                paciente_nome=str(row[1]),
                medico_nome=str(row[2]),
                data_hora=datetime.fromisoformat(str(row[3])),
                status=str(row[4]),
            ) for row in rows]

            return consultas

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

    #OK
    def agendar_consulta_atomico(
        self,
        especialidade: str,
        data: date,
        hora: str,
        paciente_id: int,
    ) -> Optional[int]:
        """
        Encontra o primeiro médico disponível e insere a consulta atomicamente.
        Retorna consulta_id ou None se não houver horário disponível.
        Lança sqlite3.IntegrityError se a constraint UNIQUE for violada (fallback de segurança).
        """
        medicos = self.get_medicos_por_especialidade(especialidade=especialidade)
        if not medicos:
            return None

        data_hora_str = f"{data.isoformat()} {hora}:00"
        placeholders = ",".join(["?"] * len(medicos))

        with self.transaction("IMMEDIATE"):
            cursor = self.conn.cursor()

            cursor.execute(
                f"""
                SELECT DISTINCT medico_id
                FROM consultas
                WHERE medico_id IN ({placeholders})
                  AND data_hora = ?
                  AND status != 'cancelada'
                """,
                (*medicos, data_hora_str),
            )

            busy = {int(r[0]) for r in cursor.fetchall()}

            medico_livre = next((m for m in medicos if m not in busy), None)

            if medico_livre is None:
                # ⚠️ importante: não precisa rollback manual
                return None

            cursor.execute(
                """
                INSERT INTO consultas (paciente_id, medico_id, data_hora, status)
                VALUES (?, ?, ?, 'agendada')
                """,
                (paciente_id, medico_livre, data_hora_str),
            )

            consulta_id = cursor.lastrowid
            if consulta_id is None:
                raise RuntimeError(
                    "Falha ao obter ID da consulta inserida. "
                    "Verifique se a tabela 'consultas' possui uma coluna PRIMARY KEY AUTOINCREMENT."
                )
            return int(consulta_id)
