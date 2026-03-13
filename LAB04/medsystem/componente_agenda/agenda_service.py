from datetime import datetime
from typing import List

from componente_agenda.interfaces.i_agenda_service import IAgendaService
from componente_agendamento.interfaces.i_agendamento_service import IAgendamentoService
from componente_agendamento.models.models import Agendamento


class AgendaService(IAgendaService):
    """
    Implementação concreta do IAgendaService.

    Depende de IAgendamentoService (interface), nunca da classe concreta.
    A dependência é injetada pelo construtor — isso garante baixo acoplamento:
    qualquer classe que implemente IAgendamentoService pode ser passada aqui.
    """

    def __init__(self, agendamento_service: IAgendamentoService):
        # INJEÇÃO DE DEPENDÊNCIA: recebe a interface, não a implementação.
        self._agendamento_service = agendamento_service

    def buscar_consultas_confirmadas(
        self, data_inicio: datetime, data_fim: datetime
    ) -> List[Agendamento]:
        # Pré-condições
        if data_inicio > data_fim:
            raise ValueError("data_inicio deve ser anterior ou igual a data_fim.")

        # Consome o Componente Agendamento APENAS pela interface
        consultas = self._agendamento_service.buscar_consultas_por_periodo(
            data_inicio, data_fim
        )
        # Pós-condição: ordenadas cronologicamente
        return sorted(consultas, key=lambda c: c.horario)

    def gerar_visualizacao_agenda(self, consultas: List[Agendamento]) -> str:
        if not consultas:
            return "Nenhuma consulta encontrada para o período."
        linhas = ["=" * 55, f"{'AGENDA DE CONSULTAS':^55}", "=" * 55]
        for c in consultas:
            linhas.append(
                f"  {c.horario.strftime('%d/%m/%Y %H:%M')} | "
                f"{c.medico.nome:<22} | {c.paciente.nome}"
            )
        linhas.append("=" * 55)
        return "\n".join(linhas)

    def gerar_documento_agenda(self, data_inicio: datetime, data_fim: datetime) -> str:
        consultas = self.buscar_consultas_confirmadas(data_inicio, data_fim)
        visualizacao = self.gerar_visualizacao_agenda(consultas)
        documento = (
            f"DOCUMENTO DE AGENDA\n"
            f"Período: {data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}\n"
            f"Total de consultas: {len(consultas)}\n\n"
            f"{visualizacao}\n\n"
            f"[Documento gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}]"
        )
        return documento
