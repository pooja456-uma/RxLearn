from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from mysql.connector import Error
import requests
import datetime
from typing import Optional, List

app = FastAPI()

# --- CORS SETTINGS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE CONNECTION WITH ERROR HANDLING ---
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Root",  # Ensure this matches your MySQL password
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
    name: str
    email: str
    message: str

# ---------------- LOGIN API ----------------
@app.post("/api/login")
async def login(data: LoginRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database connection offline")
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM users WHERE (registration_number=%s OR username=%s) AND password=%s"
        cursor.execute(query, (data.identifier, data.identifier, data.password))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Credentials")
            
        return {
            "status": "success",
            "registration_number": user['registration_number'],
            "full_name": user['full_name'],
            "role": user['role'],
            "profile_icon": user.get('profile_icon', 1)
        }
    finally:
        cursor.close()
        conn.close()

# ---------------- DRUG SEARCH API (CRITICAL FIX) ----------------
@app.get("/api/drugs/search")
async def search_drugs(query: str = "", category: str = "All"):
    conn = get_db_connection()
    if not conn:
        # Return empty list so frontend doesn't crash
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
        return results if results else [] # Always return a list
    except Exception as e:
        print(f"Search Error: {e}")
        return []
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
        cursor.execute("SELECT DISTINCT therapeutic_group FROM drugs WHERE therapeutic_group IS NOT NULL")
        categories = [row[0] for row in cursor.fetchall()]
        return {"categories": categories}
    except Exception as e:
        print(f"Category Error: {e}")
        return {"categories": []}
    finally:
        cursor.close()
        conn.close()

# ---------------- PROFILE APIs ----------------
@app.get("/api/user/profile")
async def get_profile(reg: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT full_name, registration_number, username, email, contact_number, profile_icon FROM users WHERE registration_number = %s", (reg,))
        user = cursor.fetchone()
        if user: return user
        raise HTTPException(status_code=404, detail="User not found")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/user/profile/update")
async def update_profile(data: dict):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")
    
    cursor = conn.cursor()
    try:
        query = "UPDATE users SET username=%s, email=%s, profile_icon=%s WHERE registration_number=%s"
        cursor.execute(query, (data['username'], data['email'], data['profile_icon'], data['registration_number']))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        print(f"Update Error: {e}")
        raise HTTPException(status_code=500, detail="Update failed")
    finally:
        cursor.close()
        conn.close()

# ---------------- SUPPORT TICKET API ----------------
@app.post("/api/support/ticket")
async def submit_support_ticket(ticket: TicketRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")
    
    cursor = conn.cursor()
    try:
        query = "INSERT INTO support_tickets (student_name, student_email, issue_description) VALUES (%s, %s, %s)"
        cursor.execute(query, (ticket.name, ticket.email, ticket.message))
        conn.commit()
        return {"status": "success"}
    finally:
        cursor.close()
        conn.close()

@app.get("/")
def root():
    return {"message": "RxLearn Institutional API is Online"}