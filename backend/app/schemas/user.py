from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import RoleEnum

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: str
    password: str
