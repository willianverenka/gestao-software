from datetime import datetime
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
