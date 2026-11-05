
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# --------------------------------------------------

# Force load environment variables from the backend folder
current_directory = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_directory, ".env")

load_dotenv(dotenv_path=env_path)


# --------------------------------------------------
# IMPORT ALL ROUTERS
# --------------------------------------------------

from routes import (
    auth,
    clinical,
    support,
    ai_chat,
    prescription_history,
)


# --------------------------------------------------
# INITIALIZE FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="RxLearn Virtual Lab API",
    description="Central Database Management and AI Preceptor Gateway Engine",
    version="1.0.0"
)


# --------------------------------------------------
# CORS MIDDLEWARE SETTINGS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# REGISTER ALL ROUTER SUBSYSTEMS
# --------------------------------------------------

# Authentication: signup, login, profile, JWT
app.include_router(
    auth.router,
    tags=["Authentication"]
)

# Clinical logic: OCR, drug dictionary, forum,
# educational game logging, and admin management
app.include_router(
    clinical.router,
    tags=["Clinical Logic"]
)

# Support desk
app.include_router(
    support.router,
    tags=["Support Desk"]
)

# AI Preceptor chatbot
app.include_router(
    ai_chat.router,
    tags=["AI Preceptor Assistant"]
)

# NEW: Prescription Practice History
# Save, search, retrieve, rename, and delete saved reports
app.include_router(
    prescription_history.router
)


# --------------------------------------------------
# API HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "RxLearn Institutional API is Modular & Online"
    }
