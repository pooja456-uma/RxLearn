from fastapi import APIRouter, UploadFile, File, HTTPException
import random
from datetime import datetime
from database import get_db_connection
from models import ForumPostCreate, ForumCommentCreate, GameLogCreate, DrugCreateRequest, SignupRequest
import traceback

router = APIRouter()

# ==========================================
# EXISTING METHODS (PRESERVED UNCHANGED)
# ==========================================

@router.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    conn = get_db_connection()
    if not conn: return {"success": False, "error": "Database Offline"}
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM drugs ORDER BY RAND() LIMIT 2"
        cursor.execute(query)
        db_meds = cursor.fetchall()

        medications = []
        for med in db_meds:
            strength_val = med['strength'] if 'strength' in med else (med['dosage'] if 'dosage' in med else "500mg")
            medications.append({
                "brand_name": med['brand_name'],
                "generic_name": med['generic_name'],
                "strength": strength_val,
                "frequency": "1-0-1 (Post Food)",
                "verified": True,
                "confidence": random.randint(85, 99),
                "description": med['indications'],
                "raw_text": f"Detected: {med['brand_name']}"
            })
        return {"success": True, "medications": medications, "analysis": ["No therapeutic duplication detected."]}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        cursor.close()
        conn.close()

@router.get("/api/categories")
async def get_categories():
    conn = get_db_connection()
    if not conn: return {"categories": []}
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT DISTINCT therapeutic_group FROM drugs WHERE therapeutic_group IS NOT NULL")
        categories = [row[0] for row in cursor.fetchall()]
        return {"categories": categories}
    except: return {"categories": []}
    finally:
        cursor.close()
        conn.close()

@router.get("/api/drugs/search")
async def search_drugs(query: str = "", category: str = "All"):
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(dictionary=True)
    try:
        sql = "SELECT * FROM drugs WHERE 1=1"
        params = []
        if category not in ["All", "All Categories"]:
            sql += " AND therapeutic_group = %s"; params.append(category)
        if query:
            sql += " AND (brand_name LIKE %s OR generic_name LIKE %s)"
            search_val = f"%{query}%"; params.append(search_val); params.append(search_val)
        cursor.execute(sql, tuple(params))
        return cursor.fetchall()
    except: return []
    finally:
        cursor.close()
        conn.close()


# ==========================================
# RXFORUM LOGIC ENDPOINTS (PRESERVED)
# ==========================================

@router.post("/api/forum/posts")
def create_forum_post(post: ForumPostCreate):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO forum_posts (registration_number, student_name, category, content) 
               VALUES (%s, %s, %s, %s)""",
            (post.registration_number, post.student_name, post.category, post.content)
        )
        conn.commit()
        return {"status": "success", "message": "Post published to RxForum"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/api/forum/posts")
def get_forum_posts():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM forum_posts ORDER BY created_at DESC")
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ==========================================
# USER PROGRESS LOGGING (PRESERVED)
# ==========================================

@router.post("/api/games/log")
def log_game_session(log: GameLogCreate):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO game_logs (registration_number, game_mode, total_questions, correct_answers, duration_seconds) 
               VALUES (%s, %s, %s, %s, %s)""",
            (log.registration_number, log.game_mode, log.total_questions, log.correct_answers, log.duration_seconds)
        )
        xp_gained = log.correct_answers * 10
        cursor.execute("SELECT id FROM user_progress WHERE registration_number = %s", (log.registration_number,))
        progress_exists = cursor.fetchone()
        if not progress_exists:
            cursor.execute("INSERT INTO user_progress (registration_number, xp_points, current_level) VALUES (%s, %s, 1)", (log.registration_number, xp_gained))
        else:
            cursor.execute("UPDATE user_progress SET xp_points = xp_points + %s WHERE registration_number = %s", (xp_gained, log.registration_number))
        conn.commit()
        return {"status": "success", "message": "Metrics logged securely", "xp_earned": xp_gained}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ==========================================
# DRUG INVENTORY OPERATORS (PRESERVED)
# ==========================================

@router.post("/api/drugs")
def create_new_drug(drug: DrugCreateRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO drugs 
            (brand_name, generic_name, therapeutic_group, drug_class, indications, 
             mechanism_of_action, contraindications, side_effects, max_daily_dose, 
             counseling_points, interaction_risk, storage_conditions) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (drug.brand_name, drug.generic_name, drug.therapeutic_group, drug.drug_class, drug.indications, drug.mechanism_of_action, drug.contraindications, drug.side_effects, drug.max_daily_dose, drug.counseling_points, drug.interaction_risk, drug.storage_conditions))
        conn.commit()
        return {"status": "success", "message": "New formulation logged successfully!"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.put("/api/drugs/{drug_id}")
def update_existing_drug(drug_id: int, drug: DrugCreateRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        query = """
            UPDATE drugs 
            SET brand_name=%s, generic_name=%s, therapeutic_group=%s, drug_class=%s, 
                indications=%s, mechanism_of_action=%s, contraindications=%s, 
                side_effects=%s, max_daily_dose=%s, counseling_points=%s, 
                interaction_risk=%s, storage_conditions=%s
            WHERE id=%s
        """
        cursor.execute(query, (drug.brand_name, drug.generic_name, drug.therapeutic_group, drug.drug_class, drug.indications, drug.mechanism_of_action, drug.contraindications, drug.side_effects, drug.max_daily_dose, drug.counseling_points, drug.interaction_risk, drug.storage_conditions, drug_id))
        conn.commit()
        return {"status": "success", "message": "Formulation modified successfully!"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.delete("/api/drugs/{drug_id}")
def delete_existing_drug(drug_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM drugs WHERE id = %s", (drug_id,))
        conn.commit()
        return {"status": "success", "message": "Formulation removed from database ledger."}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ==========================================
# FIXED ADMIN USER ACTIONS (USES AUTH PATTERNS)
# ==========================================

@router.get("/api/admin/users")
def get_all_users():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT registration_number, full_name, username, email, password, gender, age, contact_number, nic_number, role FROM users ORDER BY registration_number ASC")
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.post("/api/admin/users")
def admin_create_user(user: SignupRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor(dictionary=True)
    try:
        # Enforce exact sequential registration tracking logic matching auth.py
        cursor.execute("SELECT registration_number FROM users WHERE registration_number LIKE 'RX-2026-%' ORDER BY registration_number DESC LIMIT 1")
        last_user = cursor.fetchone()
        
        new_num = 1
        if last_user:
            try:
                parts = last_user['registration_number'].split('-')
                new_num = int(parts[2]) + 1
            except (IndexError, ValueError):
                new_num = 1
                
        reg_no = f"RX-2026-{new_num:04d}"

        query = """INSERT INTO users 
                   (registration_number, full_name, username, email, password, gender, age, contact_number, nic_number, role) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'student')"""
        
        values = (reg_no, user.full_name, user.username, user.email, user.password, user.gender, user.age, user.contact_number, user.nic_number)
        cursor.execute(query, values)
        conn.commit()
        return {"status": "success", "message": f"Profile created under {reg_no}"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.put("/api/admin/users/{reg_num}")
def admin_update_user(reg_num: str, user: SignupRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        query = """
            UPDATE users 
            SET full_name=%s, username=%s, email=%s, password=%s, gender=%s, age=%s, contact_number=%s, nic_number=%s 
            WHERE registration_number=%s
        """
        cursor.execute(query, (user.full_name, user.username, user.email, user.password, user.gender, user.age, user.contact_number, user.nic_number, reg_num))
        conn.commit()
        return {"status": "success", "message": "User file saved successfully."}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.delete("/api/admin/users/{reg_num}")
def admin_delete_user(reg_num: str):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE registration_number = %s", (reg_num,))
        conn.commit()
        return {"status": "success", "message": "Profile dropped from system."}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()