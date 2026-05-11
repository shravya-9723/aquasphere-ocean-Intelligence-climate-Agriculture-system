from datetime import datetime
from hashlib import sha256

from fastapi import APIRouter, HTTPException, Path
from sqlalchemy import select

from server.app.db.base import create_tables
from server.app.db.models import ChatHistory, SavedInsight, UserProfile
from server.app.db.session import SessionLocal
from server.app.schemas.user import (
    ChatRecordResponse,
    InsightCreateRequest,
    InsightResponse,
    LoginRequest,
    ProfileResponse,
    ProfileUpdateRequest,
    RegisterRequest,
)


router = APIRouter(tags=["user"])
create_tables()


def _hash_password(password: str) -> str:
    return sha256(password.encode("utf-8")).hexdigest()


def _profile_response(user: UserProfile) -> ProfileResponse:
    return ProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        organization=user.organization,
        favorite_region=user.favorite_region,
        theme=user.theme,
    )


@router.post("/auth/register", response_model=ProfileResponse)
def register_user(payload: RegisterRequest) -> ProfileResponse:
    with SessionLocal() as db:
        existing = db.scalar(select(UserProfile).where(UserProfile.email == payload.email))
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered.")

        user = UserProfile(
            email=payload.email,
            password_hash=_hash_password(payload.password),
            full_name=payload.full_name,
            organization=payload.organization,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return _profile_response(user)


@router.post("/auth/login", response_model=ProfileResponse)
def login_user(payload: LoginRequest) -> ProfileResponse:
    with SessionLocal() as db:
        user = db.scalar(select(UserProfile).where(UserProfile.email == payload.email))
        if not user or user.password_hash != _hash_password(payload.password):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        return _profile_response(user)


@router.get("/profile/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: int = Path(..., ge=1)) -> ProfileResponse:
    with SessionLocal() as db:
        user = db.get(UserProfile, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Profile not found.")
        return _profile_response(user)


@router.put("/profile/{user_id}", response_model=ProfileResponse)
def update_profile(payload: ProfileUpdateRequest, user_id: int = Path(..., ge=1)) -> ProfileResponse:
    with SessionLocal() as db:
        user = db.get(UserProfile, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Profile not found.")

        for field in ["full_name", "organization", "favorite_region", "theme"]:
            value = getattr(payload, field)
            if value is not None:
                setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return _profile_response(user)


@router.get("/chat/{user_id}", response_model=list[ChatRecordResponse])
def get_chat_history(user_id: int = Path(..., ge=1)) -> list[ChatRecordResponse]:
    with SessionLocal() as db:
        rows = db.scalars(
            select(ChatHistory)
            .where(ChatHistory.user_id == user_id)
            .order_by(ChatHistory.created_at.desc())
            .limit(50)
        ).all()
        return [
            ChatRecordResponse(
                id=row.id,
                question=row.question,
                answer=row.answer,
                region=row.region,
                year=row.year,
                confidence=row.confidence,
                created_at=row.created_at.isoformat(),
            )
            for row in rows
        ]


@router.post("/insights", response_model=InsightResponse)
def save_insight(payload: InsightCreateRequest) -> InsightResponse:
    with SessionLocal() as db:
        user = db.get(UserProfile, payload.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Profile not found.")

        insight = SavedInsight(
            user_id=payload.user_id,
            title=payload.title,
            summary=payload.summary,
            region=payload.region,
            year=payload.year,
        )
        db.add(insight)
        db.commit()
        db.refresh(insight)
        return InsightResponse(
            id=insight.id,
            title=insight.title,
            summary=insight.summary,
            region=insight.region,
            year=insight.year,
            created_at=insight.created_at.isoformat(),
        )


@router.get("/insights/{user_id}", response_model=list[InsightResponse])
def get_saved_insights(user_id: int = Path(..., ge=1)) -> list[InsightResponse]:
    with SessionLocal() as db:
        rows = db.scalars(
            select(SavedInsight)
            .where(SavedInsight.user_id == user_id)
            .order_by(SavedInsight.created_at.desc())
            .limit(50)
        ).all()
        return [
            InsightResponse(
                id=row.id,
                title=row.title,
                summary=row.summary,
                region=row.region,
                year=row.year,
                created_at=row.created_at.isoformat(),
            )
            for row in rows
        ]
