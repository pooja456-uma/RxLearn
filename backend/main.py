from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import io
import mysql.connector
from pydantic import BaseModel

# === CONFIGURATION ===
# Ensure this path matches where Tesseract is installed on your PC
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# === APP SETUP ===
app = FastAPI()

# Allow your Next.js Frontend (Port 3000) to talk to this Backend
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
        password="Root",  # Corrected with your password!
        database="rxlearn_db"
    )

# === ROUTES ===

@app.get("/")
def home():
    return {"message": "RxLearn Backend is Running!", "status": "Connected to MySQL"}

# 1. OCR UPLOAD ROUTE
@app.post("/ocr")
async def read_prescription(file: UploadFile = File(...)):
    try:
        # A. Read the image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # B. Extract text (The OCR Part)
        extracted_text = pytesseract.image_to_string(image)
        
        # C. SAVE TO DATABASE (Prescriptions Table)
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Note: Make sure you have created the 'prescriptions' table in MySQL too!
        sql = "INSERT INTO prescriptions (image_path, extracted_text) VALUES (%s, %s)"
        val = (file.filename, extracted_text)
        
        cursor.execute(sql, val)
        connection.commit() 
        
        cursor.close()
        connection.close()
        
        return {"extracted_text": extracted_text, "success": True, "saved_to_db": True}
        
    except Exception as e:
        print(f"Error: {e}") 
        return {"error": str(e), "success": False}

# 2. HISTORY ROUTE (List previous scans)
@app.get("/prescriptions")
def get_history():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True) 
        
        cursor.execute("SELECT * FROM prescriptions ORDER BY created_at DESC")
        results = cursor.fetchall()
        
        cursor.close()
        connection.close()
        return results
        
    except Exception as e:
        return {"error": str(e)}

# 3. MASTER DRUG SEARCH (For the Educational Lab)
@app.get("/drugs/{drug_name}")
def get_drug_info(drug_name: str):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Search logic remains the same (searching by Brand or Generic name)
        sql = "SELECT * FROM drugs WHERE brand_name LIKE %s OR generic_name LIKE %s"
        search_term = f"%{drug_name}%"
        cursor.execute(sql, (search_term, search_term))
        result = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if result:
            # === PROFESSIONAL LABELS FOR USERS ===
            return {
                "Medicine_Name": result["brand_name"],
                "Active_Ingredient": result["generic_name"],
                "Usage_Category": result["category"],
                "How_to_Use": result["description"]
            }
        
        # Simple message if nothing is found
        return {"Status": "Search Complete", "Result": "Medicine not found in our records."}
        
    except Exception as e:
        return {"error_details": str(e)}