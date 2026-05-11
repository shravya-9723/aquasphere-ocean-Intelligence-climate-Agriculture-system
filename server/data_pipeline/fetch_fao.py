import json
from pathlib import Path

import httpx

from server.config.settings import get_settings


settings = get_settings()
FALLBACK_PATH = Path(__file__).resolve().parent / "mock_data" / "fao_agriculture_yield.json"


def _load_fallback() -> list[dict]:
    return json.loads(FALLBACK_PATH.read_text(encoding="utf-8"))


def _normalize_fao(payload: dict) -> list[dict]:
    normalized: list[dict] = []
    rows = payload.get("data", []) if isinstance(payload, dict) else []
    for item in rows:
        country = item.get("area") or item.get("area_name")
        crop = item.get("item") or item.get("item_name")
        year = item.get("year")
        yield_value = item.get("value")
        if not country or not crop or not year or yield_value in (None, ""):
            continue

        normalized.append(
            {
                "country": str(country),
                "crop": str(crop),
                "year": int(year),
                "yield_tons": round(float(yield_value), 3),
            }
        )
    return normalized


def fetch_fao_data() -> list[dict]:
    params = {"item_code": "15", "year": "*", "page_size": 50}
    try:
        response = httpx.get(settings.fao_source_url, params=params, timeout=10.0)
        response.raise_for_status()
        payload = response.json()
        normalized = _normalize_fao(payload if isinstance(payload, dict) else {})
        return normalized or _load_fallback()
    except Exception:
        return _load_fallback()
