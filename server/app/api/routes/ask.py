from fastapi import APIRouter

from server.app.core.rag_service import rag_service
from server.app.schemas.ask import AskRequest, AskResponse


router = APIRouter(tags=["ask"])


@router.post("/ask", response_model=AskResponse)
async def ask_question(payload: AskRequest) -> AskResponse:
    return await rag_service.answer_question(
        question=payload.question,
        region=payload.region,
        year=payload.year,
        user_id=payload.user_id,
        explanation_mode=payload.explanation_mode,
        compare_regions=payload.compare_regions,
    )
