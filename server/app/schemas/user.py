from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    organization: str = "AquaSphere Lab"


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)


class ProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    organization: str
    favorite_region: str
    theme: str


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    organization: str | None = None
    favorite_region: str | None = None
    theme: str | None = None


class ChatRecordResponse(BaseModel):
    id: int
    question: str
    answer: str
    region: str | None
    year: int | None
    confidence: float
    created_at: str


class InsightCreateRequest(BaseModel):
    user_id: int
    title: str = Field(..., min_length=3)
    summary: str = Field(..., min_length=10)
    region: str
    year: int = Field(..., ge=2000, le=2026)


class InsightResponse(BaseModel):
    id: int
    title: str
    summary: str
    region: str
    year: int
    created_at: str
