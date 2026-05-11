from fastapi import APIRouter, Path, Query

from server.app.schemas.map import RegionResponse
from server.app.services.data_service import data_service


router = APIRouter(tags=["region"])


@router.get("/region/{name}", response_model=RegionResponse)
def get_region_data(
    name: str = Path(..., min_length=2),
    year: int = Query(..., ge=2000, le=2026),
) -> RegionResponse:
    return data_service.get_region_details(name, year)
