from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import requests
import datetime
from typing import Optional

app = FastAPI()

# --- CORS SETTINGS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE CONNECTION ---
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Root", 
        database="rxlearn_db"
    )

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
    identifier: str  # Can be Registration Number OR Username
    password: str

class TicketRequest(BaseModel):
    name: str
    email: str
    message: str

# ---------------- SIGNUP API (STUDENTS) ----------------
@app.post("/api/signup")
async def signup(data: SignupRequest):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Check if user already exists (Username, Email, or NIC)
        check_query = "SELECT registration_number FROM users WHERE username=%s OR email=%s OR nic_number=%s"
        cursor.execute(check_query, (data.username, data.email, data.nic_number))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User already registered with this NIC, Email, or Username.")

        # 2. Generate Registration Number (Format: RX-YEAR-0001)
        year = datetime.datetime.now().year
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'student'")
        count = cursor.fetchone()['total']
        reg_num = f"RX-{year}-{(count + 1):04d}"

        # 3. Insert Data (Role is forced to 'student' for security)
        insert_query = """
            INSERT INTO users (registration_number, full_name, username, email, password, gender, age, contact_number, nic_number, role)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'student')
        """
        values = (reg_num, data.full_name, data.username, data.email, data.password, 
                  data.gender, data.age, data.contact_number, data.nic_number)
        
        cursor.execute(insert_query, values)
        conn.commit()
        
        return {"status": "success", "registration_number": reg_num}

    except Exception as e:
        print(f"Signup Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during registration")
    finally:
        cursor.close()
        conn.close()

# ---------------- LOGIN API (STUDENTS & ADMINS) ----------------
@app.post("/api/login")
async def login(data: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Allows login using either Registration Number OR Username
        query = "SELECT * FROM users WHERE (registration_number=%s OR username=%s) AND password=%s"
        cursor.execute(query, (data.identifier, data.identifier, data.password))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Registration Number/Username or Password")
            
        return {
            "status": "success",
            "registration_number": user['registration_number'],
            "full_name": user['full_name'],
            "role": user['role']
        }
    except Exception as e:
        print(f"Login Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during login")
    finally:
        cursor.close()
        conn.close()

# ---------------- SUPPORT TICKET API ----------------
@app.post("/api/support/ticket")
async def submit_support_ticket(ticket: TicketRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO support_tickets (student_name, student_email, issue_description) 
            VALUES (%s, %s, %s)
        """
        values = (ticket.name, ticket.email, ticket.message)
        cursor.execute(query, values)
        conn.commit()
        return {"status": "success", "message": "Ticket collected successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database Error: Could not save ticket")
    finally:
        cursor.close()
        conn.close()

# ---------------- DRUG SEARCH API ----------------
@app.get("/api/drugs/search")
async def search_drugs(query: str = "", category: str = "All"):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql = "SELECT * FROM drugs WHERE 1=1"
        params = []
        if category not in ["All", "All Categories"]:
            sql += " AND therapeutic_group = %s"
            params.append(category)
        if query:
            sql += " AND (brand_name LIKE %s OR generic_name LIKE %s)"
            params.append(f"%{query}%")
            params.append(f"%{query}%")
        cursor.execute(sql, tuple(params))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

# ---------------- CATEGORY API ----------------
@app.get("/api/categories")
async def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT DISTINCT therapeutic_group FROM drugs WHERE therapeutic_group IS NOT NULL")
        categories = [row[0] for row in cursor.fetchall()]
        return {"categories": categories}
    finally:
        cursor.close()
        conn.close()

# ---------------- openFDA API ----------------
@app.get("/dictionary/{drug_name}")
async def get_drug_details(drug_name: str):
    try:
        url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:{drug_name}&limit=1"
        res = requests.get(url).json()
        if "results" not in res:
            return {"success": False, "message": "No FDA data"}
        r = res["results"][0]
        return {
            "success": True,
            "indications": r.get("indications_and_usage", ["N/A"])[0],
            "side_effects": r.get("adverse_reactions", ["N/A"])[0],
            "dosage": r.get("dosage_and_administration", ["N/A"])[0],
            "warnings": r.get("warnings", ["N/A"])[0],
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/")
def root():
    return {"message": "RxLearn Institutional API is Online"}