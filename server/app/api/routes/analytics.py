from fastapi import APIRouter, Path, Query

from server.app.schemas.analytics import AnalyticsResponse
from server.app.services.data_service import data_service


router = APIRouter(tags=["analytics"])


@router.get("/analytics/{region}", response_model=AnalyticsResponse)
def get_region_analytics(
    region: str = Path(..., min_length=2),
    years: int = Query(10, ge=3, le=27),
) -> AnalyticsResponse:
    return data_service.get_analytics(region, years)
