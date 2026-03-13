from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Paciente:
    id: int
    nome: str
    ativo: bool = True


@dataclass
class Medico:
    id: int
    nome: str
    especialidade: str


@dataclass
class Consulta:
    id: int
    paciente: Paciente
    medico: Medico
    horario: datetime
    status: str = "confirmado"  # confirmado | cancelado


@dataclass
class Agendamento:
    id: int
    paciente: Paciente
    medico: Medico
    horario: datetime
    status: str = "confirmado"
