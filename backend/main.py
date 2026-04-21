from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import requests
import re
from rapidfuzz import fuzz

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB ----------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Root",
        database="rxlearn_db"
    )

# ---------------- SEARCH API ----------------
@app.get("/api/drugs/search")
async def search_drugs(query: str = "", category: str = "All"):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT * FROM drugs WHERE 1=1"
    params = []

    if category != "All":
        sql += " AND therapeutic_group = %s"
        params.append(category)

    if query:
        sql += " AND (brand_name LIKE %s OR generic_name LIKE %s)"
        params.append(f"%{query}%")
        params.append(f"%{query}%")

    cursor.execute(sql, tuple(params))
    results = cursor.fetchall()

    cursor.close()
    conn.close()
    return results

# ---------------- CATEGORY API ----------------
@app.get("/api/categories")
async def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT therapeutic_group FROM drugs")
    categories = [row[0] for row in cursor.fetchall()]

    cursor.close()
    conn.close()
    return {"categories": categories}

# ---------------- openFDA ----------------
@app.get("/dictionary/{drug_name}")
async def get_drug_details(drug_name: str):
    try:
        url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:{drug_name}&limit=1"
        res = requests.get(url).json()

        if "results" not in res:
            return {"success": False}

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