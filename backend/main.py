from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import cv2
import numpy as np
import mysql.connector
import re
import requests
from rapidfuzz import fuzz

app = FastAPI()

# -------- CORS --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- OCR --------
reader = easyocr.Reader(['en'], gpu=False)

# -------- DATABASE --------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Root",
        database="rxlearn_db"
    )

# -------- HELPERS --------
def clean_text(line):
    line = line.upper()
    line = re.sub(r'[^A-Z0-9 ]', ' ', line)
    line = re.sub(r'\s+', ' ', line)
    return line.strip()

def extract_details(line):
    strength = re.findall(r'\d+\s?(MG|ML|G|TAB|CAP)', line, re.IGNORECASE)
    freq = re.findall(r'(BD|TDS|QID|OD|HS|Q4H|MANE|NOCTE)', line, re.IGNORECASE)
    return {
        "strength": strength[0].upper() if strength else "Not specified",
        "frequency": freq[0].upper() if freq else "Not specified"
    }

def get_drug_info(text):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM drugs")
    drugs = cursor.fetchall()

    best = None
    score_max = 0

    for d in drugs:
        score = max(
            fuzz.partial_ratio(text, d['brand_name'].upper()),
            fuzz.partial_ratio(text, d['generic_name'].upper())
        )
        if score > 55 and score > score_max:
            best = d
            score_max = score

    cursor.close()
    conn.close()
    return best, score_max

def analyze_safety(meds):
    warnings = []
    names = [m["generic_name"].upper() for m in meds if m["verified"]]

    if len(names) != len(set(names)):
        warnings.append("⚠️ Duplicate drug detected")

    if any("PARACETAMOL" in n for n in names):
        warnings.append("⚠️ Check max dose of Paracetamol (4g/day)")

    if any("PANTOPRAZOLE" in n for n in names):
        warnings.append("💡 Take PPI before meals")

    return warnings

# -------- OCR ENDPOINT --------
@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        enhanced = cv2.equalizeHist(gray)

        results = reader.readtext(enhanced)

        detected = []
        ignore_list = ["NAME", "AGE", "SEX", "DATE", "LIC", "MBBS", "SIGN"]

        for (_, text, conf) in results:
            upper = text.upper().strip()

            if conf < 0.2 or len(upper) < 3 or any(x in upper for x in ignore_list):
                continue

            clean = clean_text(upper)
            match, score = get_drug_info(clean)
            details = extract_details(upper)

            if match:
                detected.append({
                    "raw_text": text,
                    "brand_name": match["brand_name"],
                    "generic_name": match["generic_name"],
                    "category": match["category"],
                    "description": match["description"],
                    "confidence": round(score, 2),
                    "verified": True,
                    "strength": details["strength"],
                    "frequency": details["frequency"]
                })
            else:
                detected.append({
                    "raw_text": text,
                    "brand_name": clean,
                    "generic_name": "Unknown",
                    "category": "Review",
                    "description": "Not found in database",
                    "confidence": 0,
                    "verified": False,
                    "strength": details["strength"],
                    "frequency": details["frequency"]
                })

        return {
            "success": True,
            "medications": detected,
            "analysis": analyze_safety(detected)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

# -------- openFDA DICTIONARY --------
@app.get("/dictionary/{drug_name}")
async def get_drug_details(drug_name: str):
    try:
        # Try GENERIC name first (more reliable)
        url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:{drug_name}&limit=1"

        response = requests.get(url)
        data = response.json()

        # If not found → try brand name
        if "results" not in data:
            url = f"https://api.fda.gov/drug/label.json?search=openfda.brand_name:{drug_name}&limit=1"
            response = requests.get(url)
            data = response.json()

        if "results" not in data:
            return {"success": False}

        result = data["results"][0]

        return {
            "success": True,
            "indications": result.get("indications_and_usage", ["No data"])[0],
            "side_effects": result.get("adverse_reactions", ["No data"])[0],
            "dosage": result.get("dosage_and_administration", ["No data"])[0],
            "warnings": result.get("warnings", ["No data"])[0]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}