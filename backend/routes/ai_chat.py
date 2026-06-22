import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai                
from google.genai import types

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/api/chat/query")
async def ask_ai_preceptor(data: ChatRequest):
    # Field validation to ensure it's not empty text
    if not data.message or data.message.strip() == "":
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI Service configuration key missing from backend.")

    try:
        client = genai.Client(api_key=api_key)
        
        # Establishing our custom virtual pharmacology instructor boundaries
        system_instruction = (
            "You are 'RxLearn Preceptor', an expert pharmacology instructor for a virtual pharmacy lab. "
            "Your job is to guide university pharmacy students. Answer questions strictly related to "
            "medicines, drug classes, mechanisms of action, counseling points, and contraindications. "
            "Keep your answers clinically accurate, professional, short, and clear. If a user asks something "
            "outside of pharmacy, medicine, or biochemistry, politely decline to answer."
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=data.message,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3, # Keeps responses completely factual and non-creative
            ),
        )
        return {"status": "success", "response": response.text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")