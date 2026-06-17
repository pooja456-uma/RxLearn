from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# This imports the 'router' variable from each of your files
from routes import auth, clinical, support

app = FastAPI()

# --- CORS SETTINGS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTER THE ROUTES ---
app.include_router(auth.router, tags=["Authentication"])
app.include_router(clinical.router, tags=["Clinical Logic"])
app.include_router(support.router, tags=["Support"])

@app.get("/")
def root():
    return {"message": "RxLearn Institutional API is Modular & Online"}