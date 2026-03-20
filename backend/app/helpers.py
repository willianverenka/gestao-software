from datetime import date


def calcular_idade(data_nascimento: date) -> int:
    """Retorna a idade em anos a partir da data de nascimento."""
    hoje = date.today()
    idade = hoje.year - data_nascimento.year
    if (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day):
        idade -= 1
    return idade


def limpar_cpf(cpf: str) -> str:
    """Remove pontos e traços do CPF."""
    return cpf.replace(".", "").replace("-", "")


def inserir_pessoa(conn, nome, cpf, email, data_nascimento, telefone=None, genero=None) -> int:
    """Insere uma pessoa na tabela e retorna o pessoa_id."""
    cursor = conn.execute(
        """
        INSERT INTO pessoas (nome, cpf, email, data_nascimento, telefone, genero)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (nome, cpf, email, data_nascimento.isoformat(), telefone, genero),
    )
    conn.commit()
    return cursor.lastrowid


def cpf_existe(conn, cpf: str) -> bool:
    """Verifica se já existe uma pessoa com esse CPF."""
    row = conn.execute("SELECT 1 FROM pessoas WHERE cpf = ?", (cpf,)).fetchone()
    return row is not None


def email_existe(conn, email: str) -> bool:
    """Verifica se já existe uma pessoa com esse email."""
    row = conn.execute("SELECT 1 FROM pessoas WHERE email = ?", (email,)).fetchone()
    return row is not None
