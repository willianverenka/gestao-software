from abc import ABC, abstractmethod
from datetime import datetime
from typing import List

from componente_agendamento.models.models import Agendamento


class IAgendaService(ABC):
    """
    Interface fornecida pelo Componente Agenda.
    Este componente REQUER IAgendamentoService para funcionar,
    injetado via construtor (injeção de dependência).
    """

    @abstractmethod
    def buscar_consultas_confirmadas(
        self, data_inicio: datetime, data_fim: datetime
    ) -> List[Agendamento]:
        """
        Retorna consultas confirmadas no período.
        Pré:  data_inicio válida e <= data_fim.
        Pós:  Lista ordenada cronologicamente de Agendamentos com status confirmado.
        """
        pass

    @abstractmethod
    def gerar_visualizacao_agenda(self, consultas: List[Agendamento]) -> str:
        """Formata a lista de consultas para exibição em tela."""
        pass

    @abstractmethod
    def gerar_documento_agenda(self, data_inicio: datetime, data_fim: datetime) -> str:
        """
        Gera o conteúdo de um documento de agenda para o período.
        (Simula geração de PDF — retorna string formatada.)
        """
        pass
