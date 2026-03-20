from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..schemas import PessoaCreate, PessoaResponse
from ..helpers import calcular_idade, cpf_existe, email_existe, inserir_pessoa

router = APIRouter(tags=["Pessoas"])


@router.post("/pessoas", response_model=PessoaResponse, status_code=201)
def criar_pessoa(body: PessoaCreate, conn=Depends(get_db)):
    """Cria uma pessoa avulsa (sem ser paciente nem funcionário)."""

    if cpf_existe(conn, body.cpf):
        raise HTTPException(409, f"CPF {body.cpf} já cadastrado.")

    if email_existe(conn, body.email):
        raise HTTPException(409, f"Email {body.email} já cadastrado.")

    if calcular_idade(body.data_nascimento) < 18:
        raise HTTPException(400, "Pessoa deve ser maior de 18 anos.")

    pessoa_id = inserir_pessoa(
        conn,
        nome=body.nome,
        cpf=body.cpf,
        email=body.email,
        data_nascimento=body.data_nascimento,
        telefone=body.telefone,
        genero=body.genero,
    )

    return PessoaResponse(
        pessoa_id=pessoa_id,
        nome=body.nome,
        cpf=body.cpf,
        email=body.email,
        data_nascimento=body.data_nascimento,
        telefone=body.telefone,
        genero=body.genero,
    )
