from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, model_validator


class FuncionarioCreate(BaseModel):
    nome: str
    email: str
    cpf: str
    telefone: Optional[str] = None
    cargo: Literal["recepcionista", "medico", "admin"]
    crm: Optional[str] = None
    especialidade: Optional[str] = None

    @model_validator(mode="after")
    def medico_e_normalizacao(self):
        if self.cargo == "medico":
            if not (self.crm or "").strip():
                raise ValueError("CRM é obrigatório para médicos.")
            if not self.especialidade:
                raise ValueError("Especialidade é obrigatória para médicos.")
        else:
            self.crm = None
            self.especialidade = None
        return self


class FuncionarioCreatedDTO(BaseModel):
    funcionario_id: int
    pessoa_id: int


class PacienteCreate(BaseModel):
    nome: str
    email: str
    cpf: str
    telefone: Optional[str] = None
    convenio: Literal["particular", "unimed", "bradesco", "amil"]

    @model_validator(mode="after")
    def email_nao_vazio(self):
        if not (self.email or "").strip():
            raise ValueError("E-mail é obrigatório.")
        self.email = self.email.strip()
        return self


class PacienteCreatedDTO(BaseModel):
    paciente_id: int
    pessoa_id: int


class ConsultaVisaoMedicoDTO(BaseModel):
    consulta_id: int
    data_hora: datetime
    paciente_nome: str


ConsultaVisaoMedicoList = List[ConsultaVisaoMedicoDTO]

