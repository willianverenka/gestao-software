from datetime import datetime, date
from typing import List, Literal

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
    horarios: List[datetime]  # lista que o front envia


class HorarioStatusDTO(BaseModel):
    data_hora: datetime
    disponivel: bool

class FuncionarioCreateDTO(BaseModel):
    # dados que o cliente precisa enviar para criar um funcionário
    pessoa_id: int
    cargo: Literal["backoffice", "medico", "secretaria"]

class FuncionarioCreatedDTO(BaseModel):
    # estrutura da resposta da API após criação
    funcionario_id: int
    pessoa_id: int
    cargo: str

class PessoaCreateDTO(BaseModel):
    # dados necessários para criar uma pessoa
    nome: str
    cpf: str
    data_nascimento: date


class PessoaCreatedDTO(BaseModel):
    # estrutura da resposta retornada pela API
    pessoa_id: int
    nome: str
    cpf: str
    data_nascimento: date
