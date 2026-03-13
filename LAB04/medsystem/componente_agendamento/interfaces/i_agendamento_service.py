from abc import ABC, abstractmethod
from datetime import datetime
from typing import List
from componente_agendamento.models.models import Agendamento, Medico, Paciente


class IAgendamentoService(ABC):
    """
    Interface fornecida pelo Componente Agendamento.
    Define o contrato que qualquer implementação deve seguir.
    """

    @abstractmethod
    def listar_especialidades(self) -> List[str]:
        """Retorna lista de especialidades médicas disponíveis."""
        pass

    @abstractmethod
    def listar_medicos_por_especialidade(self, especialidade: str) -> List[Medico]:
        """
        Retorna médicos disponíveis para a especialidade informada.
        Pré: especialidade deve ser uma string não vazia e válida.
        """
        pass

    @abstractmethod
    def listar_horarios_disponiveis(self, medico: Medico, data: datetime) -> List[datetime]:
        """
        Retorna horários livres de um médico em uma data.
        Pré: médico deve existir; data deve ser futura.
        """
        pass

    @abstractmethod
    def registrar_agendamento(
        self, paciente: Paciente, medico: Medico, horario: datetime
    ) -> Agendamento:
        """
        Registra o agendamento e retorna o objeto criado com status 'confirmado'.
        Pré:  paciente ativo, médico existente, horário disponível e futuro.
        Pós:  Agendamento criado, horário marcado como indisponível,
              paciente e médico notificados.
        """
        pass

    @abstractmethod
    def gerar_confirmacao(self, agendamento: Agendamento) -> str:
        """Gera e retorna uma mensagem de confirmação do agendamento."""
        pass
