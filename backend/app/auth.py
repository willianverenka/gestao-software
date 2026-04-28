from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

PASSWORD_HASH_ITERATIONS = 210_000
PASSWORD_SALT_BYTES = 16
SESSION_TTL_HOURS = 24


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_bytes(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    )
    return salt.hex(), digest.hex()


def verify_password(password: str, salt_hex: str, hash_hex: str) -> bool:
    candidate_salt = bytes.fromhex(salt_hex)
    _, candidate_hash = hash_password(password, candidate_salt)
    return hmac.compare_digest(candidate_hash, hash_hex)


def create_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def session_expiry(hours: int = SESSION_TTL_HOURS) -> datetime:
    return datetime.utcnow() + timedelta(hours=hours)
