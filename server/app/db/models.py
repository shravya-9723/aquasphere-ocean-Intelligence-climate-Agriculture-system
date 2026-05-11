from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from server.app.db.base import Base


class OceanTemperature(Base):
    __tablename__ = "ocean_temperatures"
    __table_args__ = (UniqueConstraint("region", "date", name="uq_ocean_region_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    region: Mapped[str] = mapped_column(String(120), index=True)
    date: Mapped[str] = mapped_column(String(10), index=True)
    temperature: Mapped[float] = mapped_column(Float)


class AgricultureYield(Base):
    __tablename__ = "agriculture_yields"
    __table_args__ = (UniqueConstraint("country", "crop", "year", name="uq_yield_country_crop_year"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    country: Mapped[str] = mapped_column(String(120), index=True)
    crop: Mapped[str] = mapped_column(String(120), index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    yield_tons: Mapped[float] = mapped_column(Float)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(160))
    organization: Mapped[str] = mapped_column(String(160), default="AquaSphere Lab")
    favorite_region: Mapped[str] = mapped_column(String(120), default="Indian Ocean")
    theme: Mapped[str] = mapped_column(String(80), default="aurora")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SavedInsight(Base):
    __tablename__ = "saved_insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user_profiles.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(Text)
    region: Mapped[str] = mapped_column(String(120))
    year: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
