"""SQL de criação de tabelas executado na inicialização da aplicação."""

from __future__ import annotations

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

INSERT OR IGNORE INTO especialidades (codigo, nome) VALUES
('cardiologia', 'Cardiologia'),
('clinico_geral', 'Clínico Geral'),
('dermatologia', 'Dermatologia'),
('ginecologia', 'Ginecologia'),
('neurologia', 'Neurologia'),
('oftalmologia', 'Oftalmologia'),
('ortopedia', 'Ortopedia'),
('pediatria', 'Pediatria'),
('psiquiatria', 'Psiquiatria');

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
"""


def _table_column_names(conn, table: str) -> set[str]:
    cur = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}


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
    ensure_funcionario_extra_columns(conn)
    conn.commit()
