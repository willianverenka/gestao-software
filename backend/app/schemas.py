from datetime import datetime, date, time
from typing import List, Literal, Optional

from pydantic import BaseModel


# ──────────────────── Pessoa ────────────────────

class PessoaCreateDTO(BaseModel):
    nome: str
    cpf: str
    email: str
    data_nascimento: date
    telefone: Optional[str] = None
    genero: Optional[Literal["M", "F", "O"]] = None


class PessoaCreatedDTO(BaseModel):
    pessoa_id: int
    nome: str
    cpf: str
    email: str
    data_nascimento: date
    telefone: Optional[str] = None
    genero: Optional[str] = None


# ──────────────────── Funcionário ────────────────────

class FuncionarioCreateDTO(BaseModel):
    nome: str
    cpf: str
    email: str
    data_nascimento: date
    telefone: Optional[str] = None
    genero: Optional[Literal["M", "F", "O"]] = None
    cargo: Literal["backoffice", "medico", "secretaria"]
    crm: Optional[str] = None
    especialidade: Optional[str] = None


class FuncionarioCreatedDTO(BaseModel):
    funcionario_id: int
    pessoa_id: int
    nome: str
    email: str
    cargo: str
    crm: Optional[str] = None
    especialidade: Optional[str] = None


# ──────────────────── Paciente ────────────────────

class PacienteCreateDTO(BaseModel):
    nome: str
    cpf: str
    email: str
    data_nascimento: date
    telefone: Optional[str] = None
    genero: Optional[Literal["M", "F", "O"]] = None
    convenio: Optional[str] = None


class PacienteCreatedDTO(BaseModel):
    paciente_id: int
    pessoa_id: int
    nome: str
    cpf: str
    email: str
    data_nascimento: date


# ──────────────────── Consulta ────────────────────

class ConsultaCreateDTO(BaseModel):
    paciente_id: int
    medico_id: int
    data_hora: datetime
    status: Literal["agendada", "confirmada", "cancelada"] = "agendada"


class ConsultaCreatedDTO(BaseModel):
    consulta_id: int
    paciente_id: int
    medico_id: int
    data_hora: datetime
    status: str
    protocolo: Optional[str] = None


class ConsultaVisaoMedicoDTO(BaseModel):
    consulta_id: int
    data_hora: datetime
    paciente_nome: str


# ──────────────────── Horários ────────────────────

class HorariosDisponiveisRequest(BaseModel):
    horarios: List[datetime]


class HorarioStatusDTO(BaseModel):
    data_hora: datetime
    disponivel: bool


class HorarioDTO(BaseModel):
    medico_id: int
    medico_nome: str
    especialidade: str
    data: date
    hora: time