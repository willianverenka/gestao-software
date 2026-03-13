from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel


class ConsultaVisaoMedicoDTO(BaseModel):
    consulta_id: int
    data_hora: datetime
    paciente_nome: str


ConsultaVisaoMedicoList = List[ConsultaVisaoMedicoDTO]


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


class HorariosDisponiveisRequest(BaseModel):
    horarios: List[datetime]


class HorarioStatusDTO(BaseModel):
    data_hora: datetime
    disponivel: bool


class PessoaCreateDTO(BaseModel):
    nome: str
    cpf: str
    email: str
    telefone: Optional[str] = None
    data_nascimento: Optional[date] = None
    genero: Optional[Literal["M", "F", "O"]] = None


class MedicoCreateDTO(BaseModel):
    pessoa: PessoaCreateDTO
    crm: str


class SecretariaCreateDTO(BaseModel):
    pessoa: PessoaCreateDTO


class FuncionarioCreatedDTO(BaseModel):
    funcionario_id: int
    pessoa_id: int
    cargo: str
    crm: Optional[str] = None


# --- Pacientes ---

class PacienteCreateDTO(BaseModel):
    nome: str
    cpf: str
    email: str
    telefone: Optional[str] = None
    data_nascimento: Optional[date] = None
    genero: Optional[Literal["M", "F", "O"]] = None
    convenio_id: Optional[int] = None


class PacienteCreatedDTO(BaseModel):
    paciente_id: int
    pessoa_id: int
    convenio_id: Optional[int] = None
    nome: str
    cpf: str
    email: str