from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from .base import BaseRepository


class AuthRepository(BaseRepository):
    def get_user_by_email(self, email: str) -> Optional[dict[str, Any]]:
        cur = self.conn.execute(
            """
            SELECT
                u.usuario_id,
                u.pessoa_id,
                u.email AS login_email,
                u.role,
                u.senha_salt,
                u.senha_hash,
                u.ativo,
                p.nome,
                p.email AS pessoa_email,
                f.funcionario_id,
                pa.paciente_id
            FROM usuarios u
            JOIN pessoas p ON p.pessoa_id = u.pessoa_id
            LEFT JOIN funcionarios f ON f.pessoa_id = p.pessoa_id
            LEFT JOIN pacientes pa ON pa.pessoa_id = p.pessoa_id
            WHERE lower(u.email) = lower(?)
            """,
            (email,),
        )
        row = cur.fetchone()
        return dict(row) if row else None

    def get_user_by_id(self, usuario_id: int) -> Optional[dict[str, Any]]:
        cur = self.conn.execute(
            """
            SELECT
                u.usuario_id,
                u.pessoa_id,
                u.email AS login_email,
                u.role,
                u.senha_salt,
                u.senha_hash,
                u.ativo,
                p.nome,
                p.email AS pessoa_email,
                f.funcionario_id,
                pa.paciente_id
            FROM usuarios u
            JOIN pessoas p ON p.pessoa_id = u.pessoa_id
            LEFT JOIN funcionarios f ON f.pessoa_id = p.pessoa_id
            LEFT JOIN pacientes pa ON pa.pessoa_id = p.pessoa_id
            WHERE u.usuario_id = ?
            """,
            (usuario_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None

    def get_user_by_session_token(self, token_hash: str) -> Optional[dict[str, Any]]:
        cur = self.conn.execute(
            """
            SELECT
                s.sessao_id,
                s.expira_em,
                u.usuario_id,
                u.pessoa_id,
                u.email AS login_email,
                u.role,
                u.senha_salt,
                u.senha_hash,
                u.ativo,
                p.nome,
                p.email AS pessoa_email,
                f.funcionario_id,
                pa.paciente_id
            FROM sessoes s
            JOIN usuarios u ON u.usuario_id = s.usuario_id
            JOIN pessoas p ON p.pessoa_id = u.pessoa_id
            LEFT JOIN funcionarios f ON f.pessoa_id = p.pessoa_id
            LEFT JOIN pacientes pa ON pa.pessoa_id = p.pessoa_id
            WHERE s.token_hash = ?
            """,
            (token_hash,),
        )
        row = cur.fetchone()
        if row is None:
            return None
        payload = dict(row)
        expira_em = payload.get("expira_em")
        if expira_em:
            try:
                expira_dt = datetime.fromisoformat(str(expira_em))
            except ValueError:
                expira_dt = None
            if expira_dt is not None and expira_dt <= datetime.utcnow():
                self.delete_session_by_token_hash(token_hash)
                return None
        return payload

    def create_user(
        self,
        pessoa_id: int,
        email: str,
        role: str,
        senha_salt: str,
        senha_hash: str,
        ativo: bool = True,
    ) -> int:
        cur = self.conn.cursor()
        cur.execute(
            """
            INSERT INTO usuarios (pessoa_id, email, role, senha_salt, senha_hash, ativo)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (pessoa_id, email.lower().strip(), role, senha_salt, senha_hash, int(ativo)),
        )
        return int(cur.lastrowid)

    def create_session(
        self,
        usuario_id: int,
        token_hash: str,
        expira_em: str,
    ) -> int:
        cur = self.conn.cursor()
        cur.execute(
            """
            INSERT INTO sessoes (usuario_id, token_hash, expira_em)
            VALUES (?, ?, ?)
            """,
            (usuario_id, token_hash, expira_em),
        )
        return int(cur.lastrowid)

    def delete_sessions_for_user(self, usuario_id: int) -> None:
        self.conn.execute(
            "DELETE FROM sessoes WHERE usuario_id = ?",
            (usuario_id,),
        )

    def delete_session_by_token_hash(self, token_hash: str) -> None:
        self.conn.execute(
            "DELETE FROM sessoes WHERE token_hash = ?",
            (token_hash,),
        )

