from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

# ==========================================
# EXISTING MODELS (PRESERVED UNCHANGED)
# ==========================================

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
    registration_number: str 
    name: str
    email: str
    message: str

class UserProfileUpdate(BaseModel):
    registration_number: str
    full_name: str
    username: str
    email: str
    password: Optional[str] = None
    profile_icon: int


# ==========================================
# FORUM & PROGRESS DATA MODELS (PRESERVED)
# ==========================================

class ForumPostCreate(BaseModel):
    registration_number: str
    student_name: str
    category: str
    content: str

class ForumPostResponse(ForumPostCreate):
    id: int
    likes_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class ForumCommentCreate(BaseModel):
    post_id: int
    registration_number: str
    student_name: str
    comment_text: str

class GameLogCreate(BaseModel):
    registration_number: str
    game_mode: str
    total_questions: int
    correct_answers: int
    duration_seconds: int

class UserProgressResponse(BaseModel):
    registration_number: str
    xp_points: int
    current_level: int
    current_streak: int
    last_active_date: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# STRICTLY VALIDATED DRUG SCHEMA
# ==========================================

class DrugCreateRequest(BaseModel):
    brand_name: str
    generic_name: str
    therapeutic_group: str
    drug_class: str
    indications: str
    mechanism_of_action: str
    contraindications: str
    side_effects: str
    max_daily_dose: str
    counseling_points: str
    interaction_risk: str
    storage_conditions: str

    @field_validator('*')
    @classmethod
    def check_not_blank_spaces(cls, v: str) -> str:
        if not v or v.strip() == "":
            raise ValueError("Field parameters cannot be left blank or contain only spaces.")
        return v.strip()