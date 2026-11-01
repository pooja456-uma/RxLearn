
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db_connection
from models import SignupRequest, LoginRequest, UserProfileUpdate
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter()
bearer_scheme = HTTPBearer()


# --------------------------------------------------
# AUTHENTICATION HELPER
# --------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    payload = decode_access_token(credentials.credentials)
    reg_no = payload.get("sub")

    if not reg_no:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT registration_number, username, role
            FROM users
            WHERE registration_number = %s
            """,
            (reg_no,)
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User no longer exists"
            )

        return user
    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# 1. SIGNUP
# --------------------------------------------------

@router.post("/api/signup")
async def signup(data: SignupRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT registration_number
            FROM users
            WHERE registration_number LIKE 'RX-2026-%'
            ORDER BY registration_number DESC
            LIMIT 1
            """
        )

        last_user = cursor.fetchone()
        new_num = 1

        if last_user:
            try:
                new_num = int(
                    last_user["registration_number"].split("-")[2]
                ) + 1
            except (IndexError, ValueError):
                new_num = 1

        reg_no = f"RX-2026-{new_num:04d}"

        hashed_password = hash_password(data.password)

        cursor.execute(
            """
            INSERT INTO users
            (
                registration_number,
                full_name,
                username,
                email,
                password,
                gender,
                age,
                contact_number,
                nic_number,
                role
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'student')
            """,
            (
                reg_no,
                data.full_name,
                data.username,
                data.email,
                hashed_password,
                data.gender,
                data.age,
                data.contact_number,
                data.nic_number
            )
        )

        conn.commit()

        return {
            "status": "success",
            "registration_number": reg_no
        }

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Registration failed"
        )

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# 2. LOGIN
# --------------------------------------------------

@router.post("/api/login")
async def login(data: LoginRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT *
            FROM users
            WHERE registration_number=%s OR username=%s
            """,
            (data.identifier, data.identifier)
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )

        stored_password = user["password"]

        # Existing Argon2 account
        if stored_password.startswith("$argon2"):
            password_valid = verify_password(
                data.password,
                stored_password
            )

        # Temporary migration for old plaintext accounts
        else:
            password_valid = data.password == stored_password

            if password_valid:
                new_hash = hash_password(data.password)

                cursor.execute(
                    """
                    UPDATE users
                    SET password=%s
                    WHERE registration_number=%s
                    """,
                    (new_hash, user["registration_number"])
                )

                conn.commit()

        if not password_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid credentials"
            )

        access_token = create_access_token(
            user["registration_number"],
            user["role"]
        )

        return {
            "status": "success",
            "registration_number": user["registration_number"],
            "full_name": user["full_name"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "profile_icon": user.get("profile_icon", 1),
            "access_token": access_token,
            "token_type": "bearer"
        }

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# 3. GET PROFILE
# --------------------------------------------------

@router.get("/api/user/profile")
async def get_profile(
    reg: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["registration_number"] != reg:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another user's profile"
        )

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT registration_number, full_name,
                   username, email, profile_icon
            FROM users
            WHERE registration_number=%s
            """,
            (reg,)
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return user

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# 4. UPDATE PROFILE
# --------------------------------------------------

@router.put("/api/user/profile/update")
async def update_profile(
    data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["registration_number"] != data.registration_number:
        raise HTTPException(
            status_code=403,
            detail="You cannot update another user's profile"
        )

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")

    cursor = conn.cursor()

    try:
        if data.password and data.password.strip():
            cursor.execute(
                """
                UPDATE users
                SET username=%s,
                    email=%s,
                    password=%s,
                    profile_icon=%s
                WHERE registration_number=%s
                """,
                (
                    data.username,
                    data.email,
                    hash_password(data.password),
                    data.profile_icon,
                    data.registration_number
                )
            )
        else:
            cursor.execute(
                """
                UPDATE users
                SET username=%s,
                    email=%s,
                    profile_icon=%s
                WHERE registration_number=%s
                """,
                (
                    data.username,
                    data.email,
                    data.profile_icon,
                    data.registration_number
                )
            )

        conn.commit()

        return {
            "status": "success",
            "message": "Profile updated successfully"
        }

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Profile update failed"
        )

    finally:
        cursor.close()
        conn.close()
