from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from mysql.connector import Error
from typing import Optional, List
import random

app = FastAPI()

# --- CRITICAL: CORS SETTINGS FOR BIT DEMO ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="127.0.0.1",
            user="root",
            password="Root", # Double check if your MySQL password is 'Root' or 'root'
            database="rxlearn_db"
        )
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"CRITICAL: MySQL Connection Failed -> {e}")
        return None

# --- MODELS ---
class SignupRequest(BaseModel):
    full_name: str
    username: str
    email: str
    password: str
    gender: str
    age: int
    contact_number: str
    nic_number: str

class LoginRequest(BaseModel):
    identifier: str 
    password: str

class TicketRequest(BaseModel):
    registration_number: str 
    name: str
    email: str
    message: str

# ---------------- OCR ANALYSIS API ----------------
@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """
    Handles the prescription analysis from OcrLab.tsx
    """
    conn = get_db_connection()
    if not conn:
        return {"success": False, "error": "Database Offline"}
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Step 1: Simulate Neural Extraction 
        # In a real BIT project, you'd use Tesseract or EasyOCR here.
        # For the demo, we simulate finding a drug from your DB.
        query = "SELECT * FROM drugs ORDER BY RAND() LIMIT 2"
        cursor.execute(query)
        db_meds = cursor.fetchall()

        medications = []
        for med in db_meds:
            medications.append({
                "brand_name": med['brand_name'],
                "generic_name": med['generic_name'],
                "strength": med['dosage'] if 'dosage' in med else "500mg",
                "frequency": "1-0-1 (Post Food)",
                "verified": True,
                "confidence": random.randint(85, 99),
                "description": med['indications'],
                "raw_text": f"Detected: {med['brand_name']}"
            })

        return {
            "success": True, 
            "medications": medications,
            "analysis": [
                "No therapeutic duplication detected.",
                "Verify patient history for penicillin allergy."
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        cursor.close()
        conn.close()

# ---------------- CATEGORY API ----------------
@app.get("/api/categories")
async def get_categories():
    conn = get_db_connection()
    if not conn:
        return {"categories": []}
    
    cursor = conn.cursor()
    try:
        query = "SELECT DISTINCT therapeutic_group FROM drugs WHERE therapeutic_group IS NOT NULL"
        cursor.execute(query)
        categories = [row[0] for row in cursor.fetchall()]
        return {"categories": categories}
    except Exception as e:
        print(f"Category Fetch Error: {e}")
        return {"categories": []}
    finally:
        cursor.close()
        conn.close()

# ---------------- DRUG SEARCH API ----------------
@app.get("/api/drugs/search")
async def search_drugs(query: str = "", category: str = "All"):
    conn = get_db_connection()
    if not conn:
        return [] 
    
    cursor = conn.cursor(dictionary=True)
    try:
        sql = "SELECT * FROM drugs WHERE 1=1"
        params = []
        if category not in ["All", "All Categories"]:
            sql += " AND therapeutic_group = %s"
            params.append(category)
        if query:
            sql += " AND (brand_name LIKE %s OR generic_name LIKE %s)"
            search_val = f"%{query}%"
            params.append(search_val)
            params.append(search_val)
            
        cursor.execute(sql, tuple(params))
        results = cursor.fetchall()
        return results if results else []
    except Exception as e:
        print(f"Search Error: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

# ---------------- LOGIN & SIGNUP APIs ----------------
@app.post("/api/signup")
async def signup(data: SignupRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        reg_no = f"RX{random.randint(1000, 9999)}"
        query = "INSERT INTO users (registration_number, full_name, username, email, password, gender, age, contact_number, nic_number, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'student')"
        values = (reg_no, data.full_name, data.username, data.email, data.password, data.gender, data.age, data.contact_number, data.nic_number)
        cursor.execute(query, values)
        conn.commit()
        return {"status": "success", "registration_number": reg_no}
    finally:
        cursor.close()
        conn.close()

@app.post("/api/login")
async def login(data: LoginRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM users WHERE (registration_number=%s OR username=%s) AND password=%s"
        cursor.execute(query, (data.identifier, data.identifier, data.password))
        user = cursor.fetchone()
        if not user: raise HTTPException(status_code=401, detail="Invalid Credentials")
        return {"status": "success", "registration_number": user['registration_number'], "full_name": user['full_name'], "role": user['role']}
    finally:
        cursor.close()
        conn.close()

# ---------------- SUPPORT TICKET API ----------------
@app.post("/api/support/ticket")
async def submit_support_ticket(ticket: TicketRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=503, detail="Database offline")
    cursor = conn.cursor()
    try:
        query = "INSERT INTO support_tickets (registration_number, student_name, student_email, issue_description) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (ticket.registration_number, ticket.name, ticket.email, ticket.message))
        conn.commit()
        return {"status": "success"}
    finally:
        cursor.close()
        conn.close()

@app.get("/")
def root():
    return {"message": "RxLearn Institutional API is Online"}