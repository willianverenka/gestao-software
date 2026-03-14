from datetime import datetime, date, time
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


class FuncionarioCreateDTO(BaseModel):
    pessoa_id: int
    cargo: Literal["backoffice", "medico", "secretaria"]
    crm: Optional[str] = None  # obrigatório só se cargo == 'medico'


class FuncionarioCreatedDTO(BaseModel):
    funcionario_id: int
    pessoa_id: int
    cargo: str
    crm: Optional[str] = None


class PessoaCreateDTO(BaseModel):
    nome: str
    cpf: str
    data_nascimento: date


class PessoaCreatedDTO(BaseModel):
    pessoa_id: int
    nome: str
    cpf: str
    data_nascimento: date


class HorarioDTO(BaseModel):
    medico_id: int
    medico_nome: str
    especialidade: str
    data: date
    hora: time