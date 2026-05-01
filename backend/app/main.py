from __future__ import annotations

import sqlite3
from datetime import date, datetime

from fastapi import Depends, FastAPI, Header, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware

from .auth import (
    create_session_token,
    hash_password,
    hash_token,
    normalize_email,
    session_expiry,
    verify_password,
)
from .agenda_pdf import build_agenda_pdf
from .db import get_db, with_connection
from .repositories import (
    AuthRepository,
    ConsultaRepository,
    ConvenioRepository,
    EspecialidadeRepository,
    FuncionarioRepository,
    PacienteRepository,
    PessoaRepository,
)
from .schemas import (
    CatalogItemDTO,
    AuthLoginRequest,
    AuthLoginResponse,
    AuthMeResponse,
    AuthUserDTO,
    ConsultaAgendadaDTO,
    ConsultaAgendarRequest,
    ConsultaPendenteDeConfirmacaoDTO,
    ConsultaStatusSecretariaRequest,
    ConsultaVisaoMedicoDTO,
    ConsultasDisponiveisResponse,
    FuncionarioCreate,
    FuncionarioCreatedDTO,
    MedicoPerfilDTO,
    PacienteCreate,
    PacienteCreatedDTO,
)
from .startup_sql import run_startup_sql

CARGO_FRONT_TO_DB = {
    "recepcionista": "secretaria",
    "admin": "secretaria",
    "secretaria": "secretaria",
    "medico": "medico",
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    with with_connection() as conn:
        run_startup_sql(conn)


@app.get("/health")
def read_health():
    return {"status": "ok"}


@app.get("/db-check")
def db_check(conn=Depends(get_db)):
    conn.execute("SELECT 1")
    return {"status": "db-ok"}


def get_consulta_repository(conn=Depends(get_db)) -> ConsultaRepository:
    return ConsultaRepository(conn)


def get_pessoa_repository(conn=Depends(get_db)) -> PessoaRepository:
    return PessoaRepository(conn)


def get_funcionario_repository(conn=Depends(get_db)) -> FuncionarioRepository:
    return FuncionarioRepository(conn)


def get_especialidade_repository(conn=Depends(get_db)) -> EspecialidadeRepository:
    return EspecialidadeRepository(conn)


def get_convenio_repository(conn=Depends(get_db)) -> ConvenioRepository:
    return ConvenioRepository(conn)


def get_paciente_repository(conn=Depends(get_db)) -> PacienteRepository:
    return PacienteRepository(conn)


def get_auth_repository(conn=Depends(get_db)) -> AuthRepository:
    return AuthRepository(conn)


def _auth_user_from_row(row: dict) -> AuthUserDTO:
    return AuthUserDTO(
        usuario_id=int(row["usuario_id"]),
        pessoa_id=int(row["pessoa_id"]),
        email=str(row["login_email"]),
        nome=str(row["nome"]),
        role=str(row["role"]),
        paciente_id=int(row["paciente_id"]) if row.get("paciente_id") is not None else None,
        funcionario_id=int(row["funcionario_id"]) if row.get("funcionario_id") is not None else None,
    )


def _normalize_code(value: str) -> str:
    return value.strip().lower()


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        return None
    token = token.strip()
    return token or None


def get_current_user_optional(
    authorization: str | None = Header(default=None),
    repo: AuthRepository = Depends(get_auth_repository),
) -> AuthUserDTO | None:
    token = _extract_token(authorization)
    if token is None:
        return None
    row = repo.get_user_by_session_token(hash_token(token))
    if row is None or not int(row.get("ativo", 0)):
        return None
    return _auth_user_from_row(row)


def get_current_user(
    authorization: str | None = Header(default=None),
    repo: AuthRepository = Depends(get_auth_repository),
) -> AuthUserDTO:
    user = get_current_user_optional(authorization=authorization, repo=repo)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida ou expirada.",
        )
    return user


@app.get("/convenios", response_model=list[CatalogItemDTO])
def list_convenios(
    repo: ConvenioRepository = Depends(get_convenio_repository),
) -> list[CatalogItemDTO]:
    return repo.list_all()


@app.get("/especialidades", response_model=list[CatalogItemDTO])
def list_especialidades(
    repo: EspecialidadeRepository = Depends(get_especialidade_repository),
) -> list[CatalogItemDTO]:
    return repo.list_all()


def _validate_especialidade(
    especialidade: str,
    repo: EspecialidadeRepository,
) -> str:
    codigo = _normalize_code(especialidade)
    if not codigo or not repo.codigo_exists(codigo):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Especialidade inválida ou não cadastrada.",
        )
    return codigo


def require_roles(*roles: str):
    def dependency(user: AuthUserDTO = Depends(get_current_user)) -> AuthUserDTO:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso.",
            )
        return user

    return dependency


def _require_own_medico(current_user: AuthUserDTO, medico_id: int) -> None:
    if current_user.funcionario_id != medico_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode acessar a própria agenda.",
        )


@app.post("/auth/login", response_model=AuthLoginResponse)
def auth_login(
    body: AuthLoginRequest,
    conn=Depends(get_db),
    repo: AuthRepository = Depends(get_auth_repository),
) -> AuthLoginResponse:
    user_row = repo.get_user_by_email(body.email)
    if user_row is None or not int(user_row.get("ativo", 0)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
        )
    if not verify_password(body.senha, str(user_row["senha_salt"]), str(user_row["senha_hash"])):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
        )

    token = create_session_token()
    token_hash = hash_token(token)
    expira_em = session_expiry().isoformat(timespec="seconds")

    try:
        conn.execute("BEGIN")
        repo.delete_sessions_for_user(int(user_row["usuario_id"]))
        repo.create_session(
            usuario_id=int(user_row["usuario_id"]),
            token_hash=token_hash,
            expira_em=expira_em,
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e

    return AuthLoginResponse(token=token, user=_auth_user_from_row(user_row))


@app.get("/auth/me", response_model=AuthMeResponse)
def auth_me(current_user: AuthUserDTO = Depends(get_current_user)) -> AuthMeResponse:
    return AuthMeResponse(user=current_user)


@app.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def auth_logout(
    authorization: str | None = Header(default=None),
    repo: AuthRepository = Depends(get_auth_repository),
) -> Response:
    token = _extract_token(authorization)
    if token is not None:
        repo.delete_session_by_token_hash(hash_token(token))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get(
    "/consultas/disponiveis",
    response_model=ConsultasDisponiveisResponse,
)
def get_consultas_disponiveis(
    data: date,
    especialidade: str,
    _current_user: AuthUserDTO = Depends(require_roles("paciente")),
    esp_repo: EspecialidadeRepository = Depends(get_especialidade_repository),
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> ConsultasDisponiveisResponse:
    codigo_especialidade = _validate_especialidade(especialidade, esp_repo)
    horarios = repo.get_horarios_disponiveis_por_especialidade(
        especialidade=codigo_especialidade,
        data=data,
    )
    return ConsultasDisponiveisResponse(horarios=horarios)


@app.post(
    "/consultas",
    response_model=ConsultaAgendadaDTO,
    status_code=status.HTTP_201_CREATED,
)
def agendar_consulta(
    body: ConsultaAgendarRequest,
    current_user: AuthUserDTO = Depends(require_roles("paciente")),
    conn=Depends(get_db),
    repo: ConsultaRepository = Depends(get_consulta_repository),
    esp_repo: EspecialidadeRepository = Depends(get_especialidade_repository),
) -> ConsultaAgendadaDTO:
    if body.paciente_id is not None and current_user.paciente_id is not None:
        if body.paciente_id != current_user.paciente_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="O paciente autenticado não corresponde ao agendamento.",
            )

    paciente_id = current_user.paciente_id
    if paciente_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Paciente autenticado inválido.",
        )

    especialidade = _validate_especialidade(body.especialidade, esp_repo)
    data_hora_str = f"{body.data.isoformat()} {body.hora}:00"
    try:
        conn.execute("BEGIN")
        medico_id = repo.get_primeiro_medico_disponivel(
            especialidade=especialidade,
            data=body.data,
            hora=body.hora,
        )
        if medico_id is None:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Nenhum médico disponível para o horário informado.",
            )

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO consultas (paciente_id, medico_id, data_hora, status)
            VALUES (?, ?, ?, ?)
            """,
            (paciente_id, medico_id, data_hora_str, "agendada"),
        )
        consulta_id = int(cursor.lastrowid)
        conn.commit()
    except HTTPException as e:
        conn.rollback()
        raise e
    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e

    return ConsultaAgendadaDTO(
        consulta_id=consulta_id,
        medico_id=medico_id,
        data_hora=datetime.fromisoformat(data_hora_str),
    )


@app.post(
    "/pacientes",
    response_model=PacienteCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_paciente(
    body: PacienteCreate,
    current_user: AuthUserDTO | None = Depends(get_current_user_optional),
    conn=Depends(get_db),
    pessoa_repo: PessoaRepository = Depends(get_pessoa_repository),
    paciente_repo: PacienteRepository = Depends(get_paciente_repository),
    convenio_repo: ConvenioRepository = Depends(get_convenio_repository),
    auth_repo: AuthRepository = Depends(get_auth_repository),
) -> PacienteCreatedDTO:
    if current_user is not None and current_user.role != "secretaria":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas a secretária pode cadastrar pacientes autenticada.",
        )

    email = normalize_email(body.email)
    cpf_digits = "".join(c for c in body.cpf if c.isdigit())
    convenio_codigo = _normalize_code(body.convenio)
    convenio_id = convenio_repo.get_id_by_codigo(convenio_codigo)
    if convenio_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Convênio inválido ou não cadastrado.",
        )

    senha_salt, senha_hash = hash_password(body.senha)
    try:
        conn.execute("BEGIN")
        pessoa_id = pessoa_repo.insert(
            nome=body.nome.strip(),
            cpf=cpf_digits,
            email=email,
            telefone=body.telefone,
        )
        paciente_id = paciente_repo.insert(
            pessoa_id=pessoa_id,
            convenio_id=convenio_id,
        )
        auth_repo.create_user(
            pessoa_id=pessoa_id,
            email=email,
            role="paciente",
            senha_salt=senha_salt,
            senha_hash=senha_hash,
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    return PacienteCreatedDTO(paciente_id=paciente_id, pessoa_id=pessoa_id)


@app.post(
    "/funcionarios",
    response_model=FuncionarioCreatedDTO,
    status_code=status.HTTP_201_CREATED,
)
def create_funcionario(
    body: FuncionarioCreate,
    _current_user: AuthUserDTO = Depends(require_roles("secretaria")),
    conn=Depends(get_db),
    pessoa_repo: PessoaRepository = Depends(get_pessoa_repository),
    func_repo: FuncionarioRepository = Depends(get_funcionario_repository),
    esp_repo: EspecialidadeRepository = Depends(get_especialidade_repository),
    auth_repo: AuthRepository = Depends(get_auth_repository),
) -> FuncionarioCreatedDTO:
    if body.cargo == "medico" and body.especialidade:
        _validate_especialidade(body.especialidade, esp_repo)
    cpf_digits = "".join(c for c in body.cpf if c.isdigit())
    cargo_db = CARGO_FRONT_TO_DB[body.cargo]
    crm_val = (body.crm or "").strip() or None
    role = "medico" if cargo_db == "medico" else "secretaria"
    email = normalize_email(body.email)
    senha_salt, senha_hash = hash_password(body.senha)
    try:
        conn.execute("BEGIN")
        pessoa_id = pessoa_repo.insert(
            nome=body.nome.strip(),
            cpf=cpf_digits,
            email=email,
            telefone=body.telefone,
        )
        funcionario_id = func_repo.insert(
            pessoa_id=pessoa_id,
            cargo=cargo_db,
            crm=crm_val,
            especialidade=body.especialidade,
        )
        auth_repo.create_user(
            pessoa_id=pessoa_id,
            email=email,
            role=role,
            senha_salt=senha_salt,
            senha_hash=senha_hash,
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    return FuncionarioCreatedDTO(
        funcionario_id=funcionario_id,
        pessoa_id=pessoa_id,
    )


@app.get(
    "/medicos/{medico_id}/perfil",
    response_model=MedicoPerfilDTO,
)
def get_medico_profile(
    medico_id: int,
    current_user: AuthUserDTO = Depends(require_roles("medico")),
    repo: FuncionarioRepository = Depends(get_funcionario_repository),
) -> MedicoPerfilDTO:
    _require_own_medico(current_user, medico_id)
    profile = repo.get_medico_profile(funcionario_id=medico_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Médico não encontrado.",
        )
    return MedicoPerfilDTO(
        funcionario_id=int(profile["funcionario_id"]),
        nome=str(profile["nome"]),
        crm=str(profile["crm"]) if profile.get("crm") is not None else None,
        especialidade_codigo=(
            str(profile["especialidade_codigo"])
            if profile.get("especialidade_codigo") is not None
            else None
        ),
        especialidade_nome=(
            str(profile["especialidade_nome"])
            if profile.get("especialidade_nome") is not None
            else None
        ),
    )


@app.get(
    "/medicos/{medico_id}/consultas",
    response_model=list[ConsultaVisaoMedicoDTO],
)
def get_consultas_visao_medico(
    medico_id: int,
    data: date,
    current_user: AuthUserDTO = Depends(require_roles("medico")),
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> list[ConsultaVisaoMedicoDTO]:
    _require_own_medico(current_user, medico_id)
    try:
        consultas = repo.get_consultas_visao_medico(medico_id=medico_id, data=data)
        return [
            ConsultaVisaoMedicoDTO(
                consulta_id=c["consulta_id"],
                data_hora=c["data_hora"],
                paciente_nome=c["paciente_nome"],
                status=c["status"],
                convenio_nome=c["convenio_nome"],
            )
            for c in consultas
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e


@app.get(
    "/medicos/{medico_id}/consultas/datas",
    response_model=list[date],
)
def get_datas_com_consultas_visao_medico(
    medico_id: int,
    ano: int,
    mes: int,
    current_user: AuthUserDTO = Depends(require_roles("medico")),
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> list[date]:
    _require_own_medico(current_user, medico_id)
    if mes < 1 or mes > 12:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Mês inválido.",
        )
    try:
        return repo.get_datas_com_consultas_visao_medico(
            medico_id=medico_id,
            ano=ano,
            mes=mes,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e


@app.get(
    "/medicos/{medico_id}/agenda/pdf",
)
def get_agenda_pdf_medico(
    medico_id: int,
    data: date,
    current_user: AuthUserDTO = Depends(require_roles("medico")),
    consulta_repo: ConsultaRepository = Depends(get_consulta_repository),
    funcionario_repo: FuncionarioRepository = Depends(get_funcionario_repository),
) -> Response:
    _require_own_medico(current_user, medico_id)

    profile = funcionario_repo.get_medico_profile(funcionario_id=medico_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Médico não encontrado.",
        )

    consultas = consulta_repo.get_consultas_para_impressao_agenda_medico(
        medico_id=medico_id,
        data=data,
    )
    if not consultas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Não há agendas para serem impressas nesse período.",
        )

    pdf_bytes = build_agenda_pdf(
        medico_nome=str(profile["nome"]),
        crm=str(profile["crm"]) if profile.get("crm") is not None else None,
        especialidade=(
            str(profile["especialidade_nome"])
            if profile.get("especialidade_nome") is not None
            else None
        ),
        data_agenda=data,
        consultas=consultas,
    )
    filename = f"agenda-medico-{data.isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@app.get(
    "/consultas/pendentes-de-confirmacao",
    response_model=list[ConsultaPendenteDeConfirmacaoDTO],
)
def get_consultas_pendentes_de_confirmacao(
    _current_user: AuthUserDTO = Depends(require_roles("secretaria")),
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> list[ConsultaPendenteDeConfirmacaoDTO]:
    consultas = repo.get_consultas_pendentes_de_confirmacao()
    return [
        ConsultaPendenteDeConfirmacaoDTO(
            consulta_id=c["consulta_id"],
            paciente_nome=c["paciente_nome"],
            medico_nome=c["medico_nome"],
            data_hora=c["data_hora"],
            status=c["status"],
        )
        for c in consultas
    ]


@app.patch(
    "/consultas/{consulta_id}/status",
    status_code=status.HTTP_204_NO_CONTENT,
)
def patch_consulta_status_secretaria(
    consulta_id: int,
    body: ConsultaStatusSecretariaRequest,
    _current_user: AuthUserDTO = Depends(require_roles("secretaria")),
    conn=Depends(get_db),
    repo: ConsultaRepository = Depends(get_consulta_repository),
) -> Response:
    try:
        conn.execute("BEGIN")
        ok = repo.update_consulta_status_secretaria(
            consulta_id=consulta_id,
            novo_status=body.status,
        )
        if not ok:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consulta não encontrada ou já processada.",
            )
        conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        ) from e
    return Response(status_code=status.HTTP_204_NO_CONTENT)
