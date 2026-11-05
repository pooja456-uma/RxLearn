
import base64
import binascii
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from database import get_db_connection
from routes.auth import get_current_user


router = APIRouter(
    prefix="/api/prescriptions",
    tags=["Prescription History"]
)


# ------------------------------------------
# REQUEST MODELS
# ------------------------------------------

class SavePrescription(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    image_data_url: str
    medications: list[dict[str, Any]] = Field(default_factory=list)
    analysis: list[str] = Field(default_factory=list)
    educational_report: dict[str, Any] = Field(default_factory=dict)


class RenamePrescription(BaseModel):
    title: str = Field(min_length=1, max_length=160)


# ------------------------------------------
# HELPERS
# ------------------------------------------

def get_registration(user: dict) -> str:
    reg = user.get("registration_number")

    if not isinstance(reg, str) or not reg:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user"
        )

    return reg


def get_connection():
    conn = get_db_connection()

    if not conn:
        raise HTTPException(
            status_code=503,
            detail="Database offline"
        )

    return conn


def validate_title(title: str) -> str:
    title = title.strip()

    if not title:
        raise HTTPException(
            status_code=422,
            detail="Prescription title cannot be empty"
        )

    return title


# ------------------------------------------
# 1. SAVE PRESCRIPTION
# ------------------------------------------

@router.post("", status_code=201)
def save_prescription(
    data: SavePrescription,
    user: dict = Depends(get_current_user)
):
    reg = get_registration(user)
    title = validate_title(data.title)

    try:
        header, encoded = data.image_data_url.split(",", 1)

        mime = header.removeprefix("data:").split(";", 1)[0]

        if (
            mime not in {"image/jpeg", "image/png", "image/webp"}
            or ";base64" not in header
        ):
            raise ValueError("Unsupported image format")

        if len(encoded) > 8_000_000:
            raise ValueError("Image exceeds size limit")

        image_bytes = base64.b64decode(
            encoded,
            validate=True
        )

        if not image_bytes or len(image_bytes) > 6_000_000:
            raise ValueError("Image exceeds 6 MB limit")

    except (ValueError, TypeError, binascii.Error) as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc)
        ) from exc

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO prescription_history
            (
                registration_number,
                title,
                image_data,
                image_mime,
                medications,
                analysis,
                educational_report
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                reg,
                title,
                image_bytes,
                mime,
                json.dumps(data.medications),
                json.dumps(data.analysis),
                json.dumps(data.educational_report)
            )
        )

        conn.commit()

        return {
            "id": cursor.lastrowid,
            "message": "Prescription saved successfully"
        }

    except Exception:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save prescription"
        )

    finally:
        cursor.close()
        conn.close()


# ------------------------------------------
# 2. LIST AND SEARCH SAVED PRESCRIPTIONS
# ------------------------------------------

@router.get("")
def list_prescriptions(
    search: str = Query(default="", max_length=160),
    user: dict = Depends(get_current_user)
):
    reg = get_registration(user)

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, title, created_at
            FROM prescription_history
            WHERE registration_number = %s
              AND title LIKE %s
            ORDER BY created_at DESC, id DESC
            """,
            (reg, f"%{search}%")
        )

        return cursor.fetchall()

    finally:
        cursor.close()
        conn.close()


# ------------------------------------------
# 3. OPEN SAVED PRESCRIPTION
# ------------------------------------------

@router.get("/{case_id}")
def get_prescription(
    case_id: int,
    user: dict = Depends(get_current_user)
):
    reg = get_registration(user)

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                id,
                title,
                image_data,
                image_mime,
                medications,
                analysis,
                educational_report,
                created_at
            FROM prescription_history
            WHERE id = %s
              AND registration_number = %s
            """,
            (case_id, reg)
        )

        item = cursor.fetchone()

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Prescription not found"
            )

        encoded_image = base64.b64encode(
            item.pop("image_data")
        ).decode("utf-8")

        mime = item.pop("image_mime")

        item["image_data_url"] = (
            f"data:{mime};base64,{encoded_image}"
        )

        for field in (
            "medications",
            "analysis",
            "educational_report"
        ):
            if isinstance(item[field], str):
                item[field] = json.loads(item[field])

        return item

    finally:
        cursor.close()
        conn.close()


# ------------------------------------------
# 4. RENAME SAVED PRESCRIPTION
# ------------------------------------------

@router.patch("/{case_id}")
def rename_prescription(
    case_id: int,
    data: RenamePrescription,
    user: dict = Depends(get_current_user)
):
    reg = get_registration(user)
    title = validate_title(data.title)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            UPDATE prescription_history
            SET title = %s
            WHERE id = %s
              AND registration_number = %s
            """,
            (title, case_id, reg)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Prescription not found"
            )

        conn.commit()

        return {
            "message": "Prescription renamed successfully"
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()


# ------------------------------------------
# 5. DELETE SAVED PRESCRIPTION
# ------------------------------------------

@router.delete("/{case_id}")
def delete_prescription(
    case_id: int,
    user: dict = Depends(get_current_user)
):
    reg = get_registration(user)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            DELETE FROM prescription_history
            WHERE id = %s
              AND registration_number = %s
            """,
            (case_id, reg)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Prescription not found"
            )

        conn.commit()

        return {
            "message": "Prescription deleted successfully"
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()
