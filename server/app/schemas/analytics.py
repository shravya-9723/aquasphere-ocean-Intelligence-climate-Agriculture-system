from pydantic import BaseModel


class AnalyticsResponse(BaseModel):
    region: str
    correlation: dict
    trend: dict
    anomalies: dict
