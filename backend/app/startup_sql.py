"""SQL de criação e seed executado na inicialização da aplicação."""

from __future__ import annotations

from datetime import datetime, timedelta

from .auth import hash_password, normalize_email

STARTUP_SQL = """
CREATE TABLE IF NOT EXISTS pessoas (
    pessoa_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    data_nascimento DATE,
    genero CHAR(1) CHECK (genero IN ('M', 'F', 'O'))
);

CREATE TABLE IF NOT EXISTS convenios (
    convenio_id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE,
    nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS especialidades (
    codigo TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS funcionarios (
    funcionario_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa_id INTEGER NOT NULL UNIQUE,
    cargo TEXT NOT NULL CHECK (cargo IN ('backoffice', 'medico', 'secretaria')),
    crm TEXT,
    especialidade TEXT,
    FOREIGN KEY (pessoa_id) REFERENCES pessoas(pessoa_id),
    FOREIGN KEY (especialidade) REFERENCES especialidades(codigo)
);

CREATE TABLE IF NOT EXISTS pacientes (
    paciente_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa_id INTEGER NOT NULL UNIQUE,
    convenio_id INTEGER,
    FOREIGN KEY (pessoa_id) REFERENCES pessoas(pessoa_id),
    FOREIGN KEY (convenio_id) REFERENCES convenios(convenio_id)
);

CREATE TABLE IF NOT EXISTS consultas (
    consulta_id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    medico_id INTEGER NOT NULL,
    data_hora DATETIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('agendada', 'confirmada', 'cancelada')),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(paciente_id),
    FOREIGN KEY (medico_id) REFERENCES funcionarios(funcionario_id)
);

CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa_id INTEGER NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('secretaria', 'medico', 'paciente')),
    senha_salt TEXT NOT NULL,
    senha_hash TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pessoa_id) REFERENCES pessoas(pessoa_id)
);

CREATE TABLE IF NOT EXISTS sessoes (
    sessao_id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expira_em TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
);
"""


def _table_column_names(conn, table: str) -> set[str]:
    cur = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}


def _fetch_one(conn, query: str, params: tuple = ()) -> dict | None:
    row = conn.execute(query, params).fetchone()
    return dict(row) if row else None


def ensure_convenio_codigo_column(conn) -> None:
    cur = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='convenios'"
    )
    if cur.fetchone() is None:
        return
    cols = _table_column_names(conn, "convenios")
    if "codigo" not in cols:
        conn.execute("ALTER TABLE convenios ADD COLUMN codigo TEXT")


def seed_convenios(conn) -> None:
    rows = (
        ("unimed", "Unimed"),
        ("bradesco", "Bradesco Saúde"),
        ("amil", "Amil"),
    )
    for codigo, nome in rows:
        conn.execute(
            "INSERT OR IGNORE INTO convenios (codigo, nome) VALUES (?, ?)",
            (codigo, nome),
        )


def seed_especialidades(conn) -> None:
    rows = (
        ("cardiologia", "Cardiologia"),
        ("clinico_geral", "Clínico Geral"),
        ("dermatologia", "Dermatologia"),
        ("ginecologia", "Ginecologia"),
        ("neurologia", "Neurologia"),
        ("oftalmologia", "Oftalmologia"),
        ("ortopedia", "Ortopedia"),
        ("pediatria", "Pediatria"),
        ("psiquiatria", "Psiquiatria"),
    )
    for codigo, nome in rows:
        conn.execute(
            "INSERT OR IGNORE INTO especialidades (codigo, nome) VALUES (?, ?)",
            (codigo, nome),
        )


def ensure_funcionario_extra_columns(conn) -> None:
    cur = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='funcionarios'"
    )
    if cur.fetchone() is None:
        return
    cols = _table_column_names(conn, "funcionarios")
    if "crm" not in cols:
        conn.execute("ALTER TABLE funcionarios ADD COLUMN crm TEXT")
    if "especialidade" not in cols:
        conn.execute("ALTER TABLE funcionarios ADD COLUMN especialidade TEXT")


def _get_or_create_person(
    conn,
    *,
    nome: str,
    cpf: str,
    email: str,
    telefone: str | None = None,
) -> int:
    email = normalize_email(email)
    row = _fetch_one(conn, "SELECT pessoa_id FROM pessoas WHERE email = ?", (email,))
    if row is not None:
        return int(row["pessoa_id"])
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO pessoas (nome, cpf, email, telefone)
        VALUES (?, ?, ?, ?)
        """,
        (nome, cpf, email, telefone),
    )
    return int(cur.lastrowid)


def _get_or_create_secretaria(conn) -> int:
    person = _fetch_one(
        conn,
        "SELECT pessoa_id FROM pessoas WHERE email = ?",
        (normalize_email("secretaria.demo@medsystem.local"),),
    )
    if person is not None:
        pessoa_id = int(person["pessoa_id"])
    else:
        pessoa_id = _get_or_create_person(
            conn,
            nome="Secretaria Demo",
            cpf="90000000001",
            email="secretaria.demo@medsystem.local",
            telefone="(11) 90000-0001",
        )
    funcionario = _fetch_one(
        conn,
        "SELECT funcionario_id FROM funcionarios WHERE pessoa_id = ?",
        (pessoa_id,),
    )
    if funcionario is None:
        conn.execute(
            """
            INSERT INTO funcionarios (pessoa_id, cargo, crm, especialidade)
            VALUES (?, 'secretaria', NULL, NULL)
            """,
            (pessoa_id,),
        )
    return pessoa_id


def _get_demo_patient_person_id(conn) -> int:
    row = _fetch_one(
        conn,
        """
        SELECT p.pessoa_id
        FROM pacientes pa
        JOIN pessoas p ON p.pessoa_id = pa.pessoa_id
        ORDER BY pa.paciente_id ASC
        LIMIT 1
        """,
    )
    if row is not None:
        return int(row["pessoa_id"])
    pessoa_id = _get_or_create_person(
        conn,
        nome="Paciente Demo",
        cpf="90000000002",
        email="paciente.demo@medsystem.local",
        telefone="(11) 90000-0002",
    )
    paciente = _fetch_one(
        conn,
        "SELECT paciente_id FROM pacientes WHERE pessoa_id = ?",
        (pessoa_id,),
    )
    if paciente is None:
        conn.execute(
            "INSERT INTO pacientes (pessoa_id, convenio_id) VALUES (?, NULL)",
            (pessoa_id,),
        )
    return pessoa_id


def _get_demo_medico_person_id(conn) -> int:
    row = _fetch_one(
        conn,
        """
        SELECT p.pessoa_id
        FROM funcionarios f
        JOIN pessoas p ON p.pessoa_id = f.pessoa_id
        WHERE f.cargo = 'medico'
        ORDER BY f.funcionario_id ASC
        LIMIT 1
        """,
    )
    if row is not None:
        return int(row["pessoa_id"])
    pessoa_id = _get_or_create_person(
        conn,
        nome="Medico Demo",
        cpf="90000000003",
        email="medico.demo@medsystem.local",
        telefone="(11) 90000-0003",
    )
    conn.execute(
        """
        INSERT INTO funcionarios (pessoa_id, cargo, crm, especialidade)
        VALUES (?, 'medico', '900000', 'cardiologia')
        """,
        (pessoa_id,),
    )
    return pessoa_id


def seed_demo_auth_users(conn) -> None:
    demo_accounts = (
        ("paciente.demo@medsystem.local", "paciente", _get_demo_patient_person_id(conn)),
        ("medico.demo@medsystem.local", "medico", _get_demo_medico_person_id(conn)),
        ("secretaria.demo@medsystem.local", "secretaria", _get_or_create_secretaria(conn)),
    )

    for email, role, pessoa_id in demo_accounts:
        senha_salt, senha_hash = hash_password("demo123")
        conn.execute(
            """
            INSERT INTO usuarios (pessoa_id, email, role, senha_salt, senha_hash, ativo)
            VALUES (?, ?, ?, ?, ?, 1)
            ON CONFLICT(email) DO UPDATE SET
                pessoa_id = excluded.pessoa_id,
                role = excluded.role,
                senha_salt = excluded.senha_salt,
                senha_hash = excluded.senha_hash,
                ativo = excluded.ativo
            """,
            (pessoa_id, normalize_email(email), role, senha_salt, senha_hash),
        )


def seed_demo_consultas(conn) -> None:
    consultas_existentes = _fetch_one(
        conn,
        "SELECT consulta_id FROM consultas LIMIT 1",
    )
    if consultas_existentes is not None:
        return
    paciente_id_row = _fetch_one(
        conn,
        "SELECT paciente_id FROM pacientes ORDER BY paciente_id ASC LIMIT 1",
    )
    medico_id_row = _fetch_one(
        conn,
        """
        SELECT funcionario_id
        FROM funcionarios
        WHERE cargo = 'medico'
        ORDER BY funcionario_id ASC
        LIMIT 1
        """,
    )
    if paciente_id_row is None or medico_id_row is None:
        return
    data_hora = (datetime.now() + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
    conn.execute(
        """
        INSERT INTO consultas (paciente_id, medico_id, data_hora, status)
        VALUES (?, ?, ?, 'agendada')
        """,
        (int(paciente_id_row["paciente_id"]), int(medico_id_row["funcionario_id"]), data_hora.isoformat(sep=" ")),
    )


def run_startup_sql(conn) -> None:
    """Executa os statements de STARTUP_SQL na conexão fornecida (sqlite3)."""
    for raw in STARTUP_SQL.split(";"):
        stmt = raw.strip()
        while stmt and stmt.split("\n")[0].strip().startswith("--"):
            stmt = "\n".join(stmt.split("\n")[1:]).strip()
        if stmt:
            conn.execute(stmt)
    ensure_convenio_codigo_column(conn)
    seed_convenios(conn)
    seed_especialidades(conn)
    ensure_funcionario_extra_columns(conn)
    seed_demo_auth_users(conn)
    seed_demo_consultas(conn)
    conn.commit()
