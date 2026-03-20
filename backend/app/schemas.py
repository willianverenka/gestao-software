"""
Schemas (DTOs) do projeto.

Cada schema é um Pydantic model que define o formato dos dados
que entram (Create) ou saem (Response) da API.
"""

from datetime import date, datetime, time
from typing import Literal, Optional

from pydantic import BaseModel


# ── Pessoa ──

class PessoaCreate(BaseModel):
    nome: str
    cpf: str
    email: str
    data_nascimento: date
    telefone: Optional[str] = None
    genero: Optional[Literal["M", "F", "O"]] = None


class PessoaResponse(BaseModel):
    pessoa_id: int
    nome: str
    cpf: str
    email: str
    data_nascimento: date
    telefone: Optional[str] = None
    genero: Optional[str] = None


# ── Funcionário ──

class FuncionarioCreate(BaseModel):
    nome: str
    cpf: str
    email: str
    data_nascimento: date
    telefone: Optional[str] = None
    genero: Optional[Literal["M", "F", "O"]] = None
    cargo: Literal["backoffice", "medico", "secretaria"]
    crm: Optional[str] = None
    especialidade: Optional[str] = None


class FuncionarioResponse(BaseModel):
    funcionario_id: int
    pessoa_id: int
    nome: str
    email: str
    cargo: str
    crm: Optional[str] = None
    especialidade: Optional[str] = None


# ── Paciente ──

class PacienteCreate(BaseModel):
    nome: str
    cpf: str
    email: str
    data_nascimento: date
    telefone: Optional[str] = None
    genero: Optional[Literal["M", "F", "O"]] = None
    convenio: Optional[str] = None


class PacienteResponse(BaseModel):
    paciente_id: int
    pessoa_id: int
    nome: str
    cpf: str
    email: str
    data_nascimento: date


# ── Consulta ──

class ConsultaCreate(BaseModel):
    paciente_id: int
    medico_id: int
    data_hora: datetime
    status: Literal["agendada", "confirmada", "cancelada"] = "agendada"


class ConsultaResponse(BaseModel):
    consulta_id: int
    paciente_id: int
    medico_id: int
    data_hora: datetime
    status: str
    protocolo: Optional[str] = None


class ConsultaVisaoMedico(BaseModel):
    consulta_id: int
    data_hora: datetime
    paciente_nome: str


# ── Horários ──

class HorariosDisponiveisRequest(BaseModel):
    horarios: list[datetime]


class HorarioStatus(BaseModel):
    data_hora: datetime
    disponivel: bool


class HorarioDisponivel(BaseModel):
    medico_id: int
    medico_nome: str
    especialidade: str
    data: date
    hora: time


# ── Status update ──

class StatusUpdate(BaseModel):
    status: Literal["agendada", "confirmada", "cancelada"]
