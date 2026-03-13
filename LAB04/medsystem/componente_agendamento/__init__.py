# Componente Agendamento
# Exporta somente a interface pública e a implementação.
from componente_agendamento.interfaces.i_agendamento_service import IAgendamentoService
from componente_agendamento.agendamento_service import AgendamentoService

__all__ = ["IAgendamentoService", "AgendamentoService"]
