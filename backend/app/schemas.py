from __future__ import annotations

from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, model_validator


Role = Literal["secretaria", "medico", "paciente"]


class AuthLoginRequest(BaseModel):
    email: str
    senha: str

    @model_validator(mode="after")
    def normalize_email(self):
        self.email = self.email.strip().lower()
        if not self.email:
            raise ValueError("E-mail é obrigatório.")
        if not self.senha:
            raise ValueError("Senha é obrigatória.")
        return self


class AuthUserDTO(BaseModel):
    usuario_id: int
    pessoa_id: int
    email: str
    nome: str
    role: Role
    paciente_id: Optional[int] = None
    funcionario_id: Optional[int] = None


class AuthLoginResponse(BaseModel):
    token: str
    user: AuthUserDTO


class AuthMeResponse(BaseModel):
    user: AuthUserDTO


class FuncionarioCreate(BaseModel):
    nome: str
    email: str
    cpf: str
    telefone: Optional[str] = None
    cargo: Literal["secretaria", "recepcionista", "medico", "admin"]
    crm: Optional[str] = None
    especialidade: Optional[str] = None
    senha: str

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
        self.email = self.email.strip().lower()
        if not self.email:
            raise ValueError("E-mail é obrigatório.")
        if not (self.senha or "").strip():
            raise ValueError("Senha é obrigatória.")
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
    senha: str

    @model_validator(mode="after")
    def email_nao_vazio(self):
        if not (self.email or "").strip():
            raise ValueError("E-mail é obrigatório.")
        self.email = self.email.strip().lower()
        if not (self.senha or "").strip():
            raise ValueError("Senha é obrigatória.")
        return self


class PacienteCreatedDTO(BaseModel):
    paciente_id: int
    pessoa_id: int


class ConsultasDisponiveisResponse(BaseModel):
    horarios: List[str]


class ConsultasDisponiveisRequest(BaseModel):
    pass


class ConsultaAgendarRequest(BaseModel):
    especialidade: str
    data: date
    hora: str
    paciente_id: Optional[int] = None

    @model_validator(mode="after")
    def validar_hora(self):
        # HH:MM (ex.: 09:30). Não validamos o passo 30 min aqui.
        if len(self.hora) != 5 or self.hora[2] != ":":
            raise ValueError("Hora inválida. Use o formato HH:MM.")
        hh, mm = self.hora.split(":")
        if not (hh.isdigit() and mm.isdigit()):
            raise ValueError("Hora inválida. Use o formato HH:MM.")
        return self


class ConsultaAgendadaDTO(BaseModel):
    consulta_id: int
    medico_id: int
    data_hora: datetime


class ConsultaVisaoMedicoDTO(BaseModel):
    consulta_id: int
    data_hora: datetime
    paciente_nome: str


ConsultaVisaoMedicoList = List[ConsultaVisaoMedicoDTO]

class ConsultaPendenteDeConfirmacaoDTO(BaseModel):
    consulta_id: int
    paciente_nome: str
    medico_nome: str
    data_hora: datetime
    status: Literal["agendada", "confirmada", "cancelada"]


class ConsultaStatusSecretariaRequest(BaseModel):
    status: Literal["confirmada", "cancelada"]
