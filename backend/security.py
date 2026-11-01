
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(registration_number: str, role: str) -> str:
    if not SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY is missing.")

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": registration_number,
        "role": role,
        "exp": expire,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    if not SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY is missing.")

    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )
