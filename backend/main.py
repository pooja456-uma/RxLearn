import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --- FORCE LOAD ENVIRONMENT VARIABLES FROM CURRENT DIRECTORY BACKEND FOLDER ---
current_directory = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_directory, ".env")
load_dotenv(dotenv_path=env_path)

# This imports the 'router' variable from each of your modular route engines
from routes import auth, clinical, support, ai_chat

app = FastAPI(
    title="RxLearn Virtual Lab API",
    description="Central Database Management and AI Preceptor Gateway Engine",
    version="1.0.0"
)

# --- CORS MIDDLEWARE SETTINGS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTER ALL ROUTER SUBSYSTEMS ---
app.include_router(auth.router, tags=["Authentication"])
app.include_router(clinical.router, tags=["Clinical Logic"])
app.include_router(support.router, tags=["Support Desk"])
app.include_router(ai_chat.router, tags=["AI Preceptor Assistant"])

@app.get("/")
def root():
    return {"message": "RxLearn Institutional API is Modular & Online"}