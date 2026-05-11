from pydantic import BaseModel


class FeatureCollectionResponse(BaseModel):
    type: str
    features: list[dict]


class MapMetric(BaseModel):
    name: str
    ocean_region: str
    latitude: float
    longitude: float
    temperature: float
    crop: str
    yield_tons: float


class MapDataResponse(BaseModel):
    year: int
    geojson: FeatureCollectionResponse
    ocean: list[dict]
    agriculture: list[dict]
    agriculture_catalog: list[dict]


class RegionResponse(BaseModel):
    region: str
    year: int
    ocean: dict
    agriculture: list[dict]
    analytics: dict
    trade: dict
    insights: dict
    timeline: list[dict]
