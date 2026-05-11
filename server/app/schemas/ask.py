from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(..., min_length=5)
    region: str | None = None
    year: int | None = Field(default=None, ge=2000, le=2026)
    user_id: int | None = None
    explanation_mode: str = Field(default="student", pattern="^(student|researcher)$")
    compare_regions: bool = False


class AskResponse(BaseModel):
    answer: str
    sources: list[str]
    confidence: float
    chat_id: int | None = None
    summary: str
    analysis: str
    risks: list[str]
    suggested_action: str
    why_this_answer: list[str]
    risk_cards: list[dict]
    region_comparison: list[dict]
    timeline_summaries: list[dict]
    anomaly_alerts: list[dict]
    explanation_mode: str
