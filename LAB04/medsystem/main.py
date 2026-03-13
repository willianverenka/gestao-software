"""
main.py — Ponto de entrada do MedSystem (Lab 04)

Demonstra a comunicação entre os dois componentes exclusivamente via interfaces,
com injeção de dependência manual.
"""

from datetime import datetime, timedelta

from componente_agendamento.agendamento_service import AgendamentoService
from componente_agendamento.models.models import Medico, Paciente
from componente_agenda.agenda_service import AgendaService


def main():
    print("\n========== MedSystem — Lab 04 ==========\n")

    # ---------------------------------------------------------------
    # 1. INJEÇÃO DE DEPENDÊNCIA
    #    AgendaService recebe IAgendamentoService — nunca instancia
    #    AgendamentoService internamente.
    # ---------------------------------------------------------------
    agendamento_service = AgendamentoService()          # implementação concreta
    agenda_service = AgendaService(agendamento_service) # injeta via interface

    # ---------------------------------------------------------------
    # 2. USAR O COMPONENTE AGENDAMENTO
    # ---------------------------------------------------------------
    print(">>> Especialidades disponíveis:")
    for esp in agendamento_service.listar_especialidades():
        print(f"    - {esp}")

    print("\n>>> Médicos de Cardiologia:")
    medicos = agendamento_service.listar_medicos_por_especialidade("Cardiologia")
    for m in medicos:
        print(f"    - {m.nome}")

    # Seleciona um médico e uma data futura
    medico_escolhido: Medico = medicos[0]
    amanha = datetime.now() + timedelta(days=1)

    print(f"\n>>> Horários disponíveis para {medico_escolhido.nome}:")
    horarios = agendamento_service.listar_horarios_disponiveis(medico_escolhido, amanha)
    for h in horarios[:3]:
        print(f"    {h.strftime('%d/%m/%Y %H:%M')}")

    # Registra dois agendamentos
    paciente_a = Paciente(1, "João Silva")
    paciente_b = Paciente(2, "Maria Oliveira")

    agendamento1 = agendamento_service.registrar_agendamento(
        paciente_a, medico_escolhido, horarios[0]
    )
    agendamento2 = agendamento_service.registrar_agendamento(
        paciente_b, medico_escolhido, horarios[1]
    )

    print(f"\n>>> {agendamento_service.gerar_confirmacao(agendamento1)}")
    print(f">>> {agendamento_service.gerar_confirmacao(agendamento2)}")

    # ---------------------------------------------------------------
    # 3. USAR O COMPONENTE AGENDA (consome Agendamento via interface)
    # ---------------------------------------------------------------
    print("\n\n--- Componente Agenda ---")
    inicio = amanha.replace(hour=0, minute=0, second=0)
    fim    = amanha.replace(hour=23, minute=59, second=59)

    consultas = agenda_service.buscar_consultas_confirmadas(inicio, fim)
    print(f"\n>>> Consultas encontradas no período: {len(consultas)}")

    print("\n>>> Visualização da agenda:")
    print(agenda_service.gerar_visualizacao_agenda(consultas))

    print("\n>>> Documento da agenda:")
    print(agenda_service.gerar_documento_agenda(inicio, fim))


if __name__ == "__main__":
    main()
