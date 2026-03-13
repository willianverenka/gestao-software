from datetime import datetime, timedelta
from typing import List

from componente_agendamento.interfaces.i_agendamento_service import IAgendamentoService
from componente_agendamento.models.models import Agendamento, Medico, Paciente


class AgendamentoService(IAgendamentoService):
    """
    Implementação concreta do IAgendamentoService.
    Encapsula toda a lógica de negócio de agendamento de consultas.
    """

    def __init__(self):
        # Dados em memória para simulação
        self._especialidades = ["Cardiologia", "Dermatologia", "Ortopedia", "Pediatria"]
        self._medicos: List[Medico] = [
            Medico(1, "Dr. Carlos Lima", "Cardiologia"),
            Medico(2, "Dra. Ana Costa", "Cardiologia"),
            Medico(3, "Dr. Paulo Rocha", "Dermatologia"),
            Medico(4, "Dra. Julia Matos", "Ortopedia"),
        ]
        # horários reservados: {medico_id: [horario, ...]}
        self._horarios_reservados: dict = {}
        self._agendamentos: List[Agendamento] = []
        self._next_id = 1

    def listar_especialidades(self) -> List[str]:
        return list(self._especialidades)

    def listar_medicos_por_especialidade(self, especialidade: str) -> List[Medico]:
        if not especialidade:
            raise ValueError("Especialidade não pode ser vazia.")
        return [m for m in self._medicos if m.especialidade == especialidade]

    def listar_horarios_disponiveis(self, medico: Medico, data: datetime) -> List[datetime]:
        if data < datetime.now():
            raise ValueError("A data deve ser futura.")
        reservados = self._horarios_reservados.get(medico.id, [])
        # Gera slots de 30 em 30 minutos entre 8h e 17h
        slots = []
        base = data.replace(hour=8, minute=0, second=0, microsecond=0)
        for i in range(18):  # 18 slots de 30 min = 9h
            slot = base + timedelta(minutes=30 * i)
            if slot not in reservados:
                slots.append(slot)
        return slots

    def registrar_agendamento(
        self, paciente: Paciente, medico: Medico, horario: datetime
    ) -> Agendamento:
        # Pré-condições
        if not paciente.ativo:
            raise ValueError(f"Paciente {paciente.nome} não está ativo.")
        if horario < datetime.now():
            raise ValueError("O horário deve ser futuro.")
        reservados = self._horarios_reservados.get(medico.id, [])
        if horario in reservados:
            raise ValueError(f"Horário {horario} já está reservado para {medico.nome}.")

        # Cria agendamento
        agendamento = Agendamento(
            id=self._next_id,
            paciente=paciente,
            medico=medico,
            horario=horario,
            status="confirmado",
        )
        self._next_id += 1

        # Pós-condições: marca horário como indisponível
        self._horarios_reservados.setdefault(medico.id, []).append(horario)
        self._agendamentos.append(agendamento)

        print(f"[NOTIFICAÇÃO] Paciente '{paciente.nome}' notificado.")
        print(f"[NOTIFICAÇÃO] Médico '{medico.nome}' notificado.")

        return agendamento

    def gerar_confirmacao(self, agendamento: Agendamento) -> str:
        return (
            f"Confirmação #{agendamento.id}: Consulta com {agendamento.medico.nome} "
            f"em {agendamento.horario.strftime('%d/%m/%Y %H:%M')} "
            f"para {agendamento.paciente.nome} — Status: {agendamento.status}."
        )

    # ---- Método auxiliar para o Componente Agenda recuperar consultas ----
    def buscar_consultas_por_periodo(
        self, data_inicio: datetime, data_fim: datetime
    ) -> List[Agendamento]:
        """
        Método adicional exposto para consumo pelo Componente Agenda.
        Retorna agendamentos confirmados no intervalo [data_inicio, data_fim].
        """
        return [
            a
            for a in self._agendamentos
            if data_inicio <= a.horario <= data_fim and a.status == "confirmado"
        ]
