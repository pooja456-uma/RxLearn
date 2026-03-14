from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import io
import mysql.connector
from pydantic import BaseModel

# === CONFIGURATION ===
# This points to the OCR software.
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# === APP SETUP ===
app = FastAPI()

# Allow your future Website (Frontend) to talk to this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DATABASE CONNECTION ===
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Root",  # <--- Your password is set here
        database="rxlearn_db"
    )

# === ROUTES ===

@app.get("/")
def home():
    return {"message": "RxLearn Backend is Running!"}

# 1. UPLOAD ROUTE (Writes to Database)
@app.post("/ocr")
async def read_prescription(file: UploadFile = File(...)):
    try:
        # A. Read the image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # B. Extract text (The OCR Part)
        extracted_text = pytesseract.image_to_string(image)
        
        # C. SAVE TO DATABASE
        connection = get_db_connection()
        cursor = connection.cursor()
        
        sql = "INSERT INTO prescriptions (image_path, extracted_text) VALUES (%s, %s)"
        val = (file.filename, extracted_text)
        
        cursor.execute(sql, val)
        connection.commit() # Save changes
        
        cursor.close()
        connection.close()
        
        return {"extracted_text": extracted_text, "success": True, "saved_to_db": True}
        
    except Exception as e:
        print(f"Error: {e}") 
        return {"extracted_text": str(e), "success": False}

# 2. HISTORY ROUTE (Reads from Database)
@app.get("/prescriptions")
def get_history():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True) 
        
        # Get all prescriptions, newest first
        cursor.execute("SELECT * FROM prescriptions ORDER BY created_at DESC")
        results = cursor.fetchall()
        
        cursor.close()
        connection.close()
        return results
        
    except Exception as e:
        return {"error": str(e)}

# 3. MASTER DRUG ROUTE (New Task for Today!)
# This route allows the system to fetch details for the Educational Lab
@app.get("/drugs/{drug_name}")
def get_drug_info(drug_name: str):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Search for the drug in your Master Table
        sql = "SELECT * FROM drugs WHERE brand_name LIKE %s OR generic_name LIKE %s"
        search_term = f"%{drug_name}%"
        cursor.execute(sql, (search_term, search_term))
        result = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if result:
            return result
        return {"message": "Drug not found in master database."}
        
    except Exception as e:
        return {"error": str(e)}