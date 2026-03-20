"""SQL de criação das tabelas, executado no startup."""

TABLES_SQL = """
CREATE TABLE IF NOT EXISTS pessoas (
    pessoa_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    nome            TEXT NOT NULL,
    cpf             TEXT NOT NULL UNIQUE,
    email           TEXT NOT NULL UNIQUE,
    telefone        TEXT,
    data_nascimento DATE NOT NULL,
    genero          CHAR(1) CHECK (genero IN ('M', 'F', 'O'))
);

CREATE TABLE IF NOT EXISTS convenios (
    convenio_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS funcionarios (
    funcionario_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa_id      INTEGER NOT NULL UNIQUE,
    cargo          TEXT NOT NULL CHECK (cargo IN ('backoffice', 'medico', 'secretaria')),
    crm            TEXT,
    especialidade  TEXT,
    FOREIGN KEY (pessoa_id) REFERENCES pessoas(pessoa_id)
);

CREATE TABLE IF NOT EXISTS pacientes (
    paciente_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa_id   INTEGER NOT NULL UNIQUE,
    convenio_id INTEGER,
    FOREIGN KEY (pessoa_id)   REFERENCES pessoas(pessoa_id),
    FOREIGN KEY (convenio_id) REFERENCES convenios(convenio_id)
);

CREATE TABLE IF NOT EXISTS consultas (
    consulta_id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    medico_id   INTEGER NOT NULL,
    data_hora   DATETIME NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('agendada', 'confirmada', 'cancelada')),
    protocolo   TEXT UNIQUE,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(paciente_id),
    FOREIGN KEY (medico_id)   REFERENCES funcionarios(funcionario_id)
);
"""


def criar_tabelas(conn) -> None:
    """Executa cada CREATE TABLE do script acima."""
    for statement in TABLES_SQL.split(";"):
        sql = statement.strip()
        if sql:
            conn.execute(sql)
    conn.commit()
