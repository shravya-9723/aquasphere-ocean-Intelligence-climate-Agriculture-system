import json
from pathlib import Path

import httpx

from server.config.settings import get_settings


settings = get_settings()
FALLBACK_PATH = Path(__file__).resolve().parent / "mock_data" / "noaa_ocean_temperature.json"
STATION_TO_REGION = {
    "72530094846": "North Atlantic",
    "72295023174": "South Atlantic",
    "47671099999": "Indian Ocean",
    "94326099999": "Pacific Warm Pool",
    "60155099999": "South Pacific",
}


def _load_fallback() -> list[dict]:
    return json.loads(FALLBACK_PATH.read_text(encoding="utf-8"))


def _normalize_noaa(payload: list[dict]) -> list[dict]:
    normalized: list[dict] = []
    for item in payload:
        station = str(item.get("STATION", ""))
        region = STATION_TO_REGION.get(station)
        date = str(item.get("DATE", ""))[:10]
        temp = item.get("TAVG")
        if not region or not date or temp in (None, ""):
            continue

        numeric_temp = float(temp)
        normalized.append(
            {
                "region": region,
                "date": date,
                "temperature": round(numeric_temp / 10 if numeric_temp > 45 else numeric_temp, 3),
            }
        )
    return normalized


def fetch_noaa_data() -> list[dict]:
    params = {
        "dataset": "global-summary-of-the-year",
        "stations": "72530094846,72295023174,47671099999,94326099999,60155099999",
        "startDate": "2000-01-01",
        "endDate": "2026-01-01",
        "format": "json",
        "dataTypes": "TAVG",
    }
    try:
        response = httpx.get(settings.noaa_source_url, params=params, timeout=10.0)
        response.raise_for_status()
        payload = response.json()
        normalized = _normalize_noaa(payload if isinstance(payload, list) else [])
        return normalized or _load_fallback()
    except Exception:
        return _load_fallback()
