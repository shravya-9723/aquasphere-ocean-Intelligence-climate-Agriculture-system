from fastapi import APIRouter, Query

from server.app.schemas.map import MapDataResponse
from server.app.services.data_service import data_service


router = APIRouter(tags=["map"])


@router.get("/map-data", response_model=MapDataResponse)
def get_map_data(year: int = Query(..., ge=2000, le=2026)) -> MapDataResponse:
    return data_service.get_map_data(year)
