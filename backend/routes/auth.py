from fastapi import APIRouter, HTTPException
from database import get_db_connection
from models import SignupRequest, LoginRequest, UserProfileUpdate

# THIS LINE IS CRITICAL - it must be exactly 'router'
router = APIRouter()

# --- 1. SIGNUP LOGIC ---
@router.post("/api/signup")
async def signup(data: SignupRequest):
    conn = get_db_connection()
    if not conn: 
        raise HTTPException(status_code=503, detail="Database offline")
    
    cursor = conn.cursor(dictionary=True)
    try:
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
        
        values = (reg_no, data.full_name, data.username, data.email, data.password, 
                  data.gender, data.age, data.contact_number, data.nic_number)
        
        cursor.execute(query, values)
        conn.commit()
        return {"status": "success", "registration_number": reg_no}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# --- 2. LOGIN LOGIC ---
@router.post("/api/login")
async def login(data: LoginRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM users WHERE (registration_number=%s OR username=%s) AND password=%s"
        cursor.execute(query, (data.identifier, data.identifier, data.password))
        user = cursor.fetchone()
        if not user: raise HTTPException(status_code=401, detail="Invalid Credentials")
        
        # Return extra fields for the frontend to save in localStorage for autofill
        return {
            "status": "success", 
            "registration_number": user['registration_number'], 
            "full_name": user['full_name'], 
            "username": user['username'],
            "email": user['email'],
            "role": user['role'],
            "profile_icon": user.get('profile_icon', 1)
        }
    finally:
        cursor.close()
        conn.close()

# --- 3. GET PROFILE LOGIC (For Autofill) ---
@router.get("/api/user/profile")
async def get_profile(reg: str):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT registration_number, full_name, username, email, profile_icon FROM users WHERE registration_number = %s", (reg,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    finally:
        cursor.close()
        conn.close()

# --- 4. UPDATE PROFILE LOGIC (Includes Password) ---
@router.put("/api/user/profile/update")
async def update_profile(data: UserProfileUpdate):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        # Check if a new password was provided in the text field
        if data.password and data.password.strip() != "":
            query = """UPDATE users SET username=%s, email=%s, password=%s, profile_icon=%s 
                       WHERE registration_number=%s"""
            values = (data.username, data.email, data.password, data.profile_icon, data.registration_number)
        else:
            query = """UPDATE users SET username=%s, email=%s, profile_icon=%s 
                       WHERE registration_number=%s"""
            values = (data.username, data.email, data.profile_icon, data.registration_number)
            
        cursor.execute(query, values)
        conn.commit()
        return {"status": "success", "message": "Profile updated successfully"}
    except Exception as e:
        if conn: conn.rollback()
        print(f"Update Error: {e}")
        raise HTTPException(status_code=500, detail="Update failed")
    finally:
        cursor.close()
        conn.close()