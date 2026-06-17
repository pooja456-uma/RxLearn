from pydantic import BaseModel

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


from pydantic import BaseModel
from typing import Optional

class UserProfileUpdate(BaseModel):
    registration_number: str
    full_name: str
    username: str
    email: str
    password: Optional[str] = None
    profile_icon: int