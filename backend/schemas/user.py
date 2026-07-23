from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional
from datetime import datetime
from models.user import UserRole

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, json_schema_extra={"example": "John Doe"}, description="User full name")
    email: EmailStr = Field(..., json_schema_extra={"example": "johndoe@example.com"}, description="User email address")
    password: str = Field(..., min_length=8, max_length=100, json_schema_extra={"example": "strongpassword123"}, description="User password")
    image: Optional[str] = Field(None, max_length=1024, json_schema_extra={"example": "https://example.com/avatar.png"}, description="URL to profile picture")

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="User full name")
    email: Optional[EmailStr] = Field(None, description="User email address")
    password: Optional[str] = Field(None, min_length=8, max_length=100, description="User password")
    image: Optional[str] = Field(None, max_length=1024, description="URL to profile picture")

class UserAdminUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="User full name")
    email: Optional[EmailStr] = Field(None, description="User email address")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., json_schema_extra={"example": "johndoe@example.com"}, description="User email address")
    password: str = Field(..., min_length=8, max_length=100, json_schema_extra={"example": "strongpassword123"}, description="User password")

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    image: Optional[str] = None
    role: UserRole
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserEnrichedResponse(UserResponse):
    last_login_at: Optional[datetime] = None

class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
