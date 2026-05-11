from sqlalchemy import select

from server.app.db.models import AgricultureYield, OceanTemperature
from server.app.db.session import SessionLocal
from server.data_pipeline.fetch_fao import fetch_fao_data
from server.data_pipeline.fetch_noaa import fetch_noaa_data


SUPPLEMENTAL_YIELD_ROWS = [
    {"country": "Canada", "crop": "Wheat", "year": 2000, "yield_tons": 82.4},
    {"country": "Canada", "crop": "Canola", "year": 2000, "yield_tons": 64.8},
    {"country": "Canada", "crop": "Potatoes", "year": 2000, "yield_tons": 38.6},
    {"country": "Canada", "crop": "Wheat", "year": 2005, "yield_tons": 86.1},
    {"country": "Canada", "crop": "Canola", "year": 2005, "yield_tons": 69.9},
    {"country": "Canada", "crop": "Potatoes", "year": 2005, "yield_tons": 41.2},
    {"country": "Canada", "crop": "Wheat", "year": 2010, "yield_tons": 91.7},
    {"country": "Canada", "crop": "Canola", "year": 2010, "yield_tons": 74.5},
    {"country": "Canada", "crop": "Potatoes", "year": 2010, "yield_tons": 45.4},
    {"country": "Canada", "crop": "Wheat", "year": 2015, "yield_tons": 96.2},
    {"country": "Canada", "crop": "Canola", "year": 2015, "yield_tons": 79.8},
    {"country": "Canada", "crop": "Potatoes", "year": 2015, "yield_tons": 48.1},
    {"country": "Canada", "crop": "Wheat", "year": 2020, "yield_tons": 102.8},
    {"country": "Canada", "crop": "Canola", "year": 2020, "yield_tons": 84.7},
    {"country": "Canada", "crop": "Potatoes", "year": 2020, "yield_tons": 51.9},
    {"country": "Canada", "crop": "Wheat", "year": 2025, "yield_tons": 108.6},
    {"country": "Canada", "crop": "Canola", "year": 2025, "yield_tons": 88.1},
    {"country": "Canada", "crop": "Potatoes", "year": 2025, "yield_tons": 55.2},
    {"country": "Mexico", "crop": "Maize", "year": 2000, "yield_tons": 104.3},
    {"country": "Mexico", "crop": "Sugarcane", "year": 2000, "yield_tons": 88.2},
    {"country": "Mexico", "crop": "Avocado", "year": 2000, "yield_tons": 29.7},
    {"country": "Mexico", "crop": "Maize", "year": 2005, "yield_tons": 111.8},
    {"country": "Mexico", "crop": "Sugarcane", "year": 2005, "yield_tons": 93.6},
    {"country": "Mexico", "crop": "Avocado", "year": 2005, "yield_tons": 32.1},
    {"country": "Mexico", "crop": "Maize", "year": 2010, "yield_tons": 117.4},
    {"country": "Mexico", "crop": "Sugarcane", "year": 2010, "yield_tons": 98.9},
    {"country": "Mexico", "crop": "Avocado", "year": 2010, "yield_tons": 36.4},
    {"country": "Mexico", "crop": "Maize", "year": 2015, "yield_tons": 123.2},
    {"country": "Mexico", "crop": "Sugarcane", "year": 2015, "yield_tons": 103.3},
    {"country": "Mexico", "crop": "Avocado", "year": 2015, "yield_tons": 39.8},
    {"country": "Mexico", "crop": "Maize", "year": 2020, "yield_tons": 129.5},
    {"country": "Mexico", "crop": "Sugarcane", "year": 2020, "yield_tons": 108.7},
    {"country": "Mexico", "crop": "Avocado", "year": 2020, "yield_tons": 44.6},
    {"country": "Mexico", "crop": "Maize", "year": 2025, "yield_tons": 134.2},
    {"country": "Mexico", "crop": "Sugarcane", "year": 2025, "yield_tons": 113.4},
    {"country": "Mexico", "crop": "Avocado", "year": 2025, "yield_tons": 48.2},
    {"country": "Spain", "crop": "Olives", "year": 2000, "yield_tons": 44.1},
    {"country": "Spain", "crop": "Citrus", "year": 2000, "yield_tons": 39.4},
    {"country": "Spain", "crop": "Wheat", "year": 2000, "yield_tons": 36.8},
    {"country": "Spain", "crop": "Olives", "year": 2005, "yield_tons": 47.5},
    {"country": "Spain", "crop": "Citrus", "year": 2005, "yield_tons": 41.6},
    {"country": "Spain", "crop": "Wheat", "year": 2005, "yield_tons": 38.7},
    {"country": "Spain", "crop": "Olives", "year": 2010, "yield_tons": 50.2},
    {"country": "Spain", "crop": "Citrus", "year": 2010, "yield_tons": 43.5},
    {"country": "Spain", "crop": "Wheat", "year": 2010, "yield_tons": 40.9},
    {"country": "Spain", "crop": "Olives", "year": 2015, "yield_tons": 52.9},
    {"country": "Spain", "crop": "Citrus", "year": 2015, "yield_tons": 45.7},
    {"country": "Spain", "crop": "Wheat", "year": 2015, "yield_tons": 42.3},
    {"country": "Spain", "crop": "Olives", "year": 2020, "yield_tons": 56.7},
    {"country": "Spain", "crop": "Citrus", "year": 2020, "yield_tons": 48.8},
    {"country": "Spain", "crop": "Wheat", "year": 2020, "yield_tons": 44.1},
    {"country": "Spain", "crop": "Olives", "year": 2025, "yield_tons": 59.8},
    {"country": "Spain", "crop": "Citrus", "year": 2025, "yield_tons": 51.2},
    {"country": "Spain", "crop": "Wheat", "year": 2025, "yield_tons": 46.0},
    {"country": "Nigeria", "crop": "Cassava", "year": 2000, "yield_tons": 118.2},
    {"country": "Nigeria", "crop": "Cocoa", "year": 2000, "yield_tons": 27.5},
    {"country": "Nigeria", "crop": "Maize", "year": 2000, "yield_tons": 48.9},
    {"country": "Nigeria", "crop": "Cassava", "year": 2005, "yield_tons": 124.6},
    {"country": "Nigeria", "crop": "Cocoa", "year": 2005, "yield_tons": 29.1},
    {"country": "Nigeria", "crop": "Maize", "year": 2005, "yield_tons": 52.7},
    {"country": "Nigeria", "crop": "Cassava", "year": 2010, "yield_tons": 131.8},
    {"country": "Nigeria", "crop": "Cocoa", "year": 2010, "yield_tons": 31.4},
    {"country": "Nigeria", "crop": "Maize", "year": 2010, "yield_tons": 56.3},
    {"country": "Nigeria", "crop": "Cassava", "year": 2015, "yield_tons": 138.5},
    {"country": "Nigeria", "crop": "Cocoa", "year": 2015, "yield_tons": 33.2},
    {"country": "Nigeria", "crop": "Maize", "year": 2015, "yield_tons": 60.1},
    {"country": "Nigeria", "crop": "Cassava", "year": 2020, "yield_tons": 146.7},
    {"country": "Nigeria", "crop": "Cocoa", "year": 2020, "yield_tons": 35.6},
    {"country": "Nigeria", "crop": "Maize", "year": 2020, "yield_tons": 64.8},
    {"country": "Nigeria", "crop": "Cassava", "year": 2025, "yield_tons": 153.9},
    {"country": "Nigeria", "crop": "Cocoa", "year": 2025, "yield_tons": 38.1},
    {"country": "Nigeria", "crop": "Maize", "year": 2025, "yield_tons": 68.3},
    {"country": "Thailand", "crop": "Rice", "year": 2000, "yield_tons": 122.7},
    {"country": "Thailand", "crop": "Cassava", "year": 2000, "yield_tons": 78.4},
    {"country": "Thailand", "crop": "Sugarcane", "year": 2000, "yield_tons": 83.1},
    {"country": "Thailand", "crop": "Rice", "year": 2005, "yield_tons": 128.2},
    {"country": "Thailand", "crop": "Cassava", "year": 2005, "yield_tons": 81.6},
    {"country": "Thailand", "crop": "Sugarcane", "year": 2005, "yield_tons": 87.8},
    {"country": "Thailand", "crop": "Rice", "year": 2010, "yield_tons": 134.8},
    {"country": "Thailand", "crop": "Cassava", "year": 2010, "yield_tons": 85.5},
    {"country": "Thailand", "crop": "Sugarcane", "year": 2010, "yield_tons": 92.4},
    {"country": "Thailand", "crop": "Rice", "year": 2015, "yield_tons": 140.9},
    {"country": "Thailand", "crop": "Cassava", "year": 2015, "yield_tons": 89.7},
    {"country": "Thailand", "crop": "Sugarcane", "year": 2015, "yield_tons": 97.1},
    {"country": "Thailand", "crop": "Rice", "year": 2020, "yield_tons": 147.3},
    {"country": "Thailand", "crop": "Cassava", "year": 2020, "yield_tons": 94.8},
    {"country": "Thailand", "crop": "Sugarcane", "year": 2020, "yield_tons": 102.6},
    {"country": "Thailand", "crop": "Rice", "year": 2025, "yield_tons": 153.4},
    {"country": "Thailand", "crop": "Cassava", "year": 2025, "yield_tons": 99.1},
    {"country": "Thailand", "crop": "Sugarcane", "year": 2025, "yield_tons": 108.9},
]


def seed_database() -> None:
    with SessionLocal() as db:
        ocean_exists = db.scalar(select(OceanTemperature.id).limit(1))
        yield_exists = db.scalar(select(AgricultureYield.id).limit(1))

        if not ocean_exists:
            for record in fetch_noaa_data():
                db.add(OceanTemperature(**record))

        if not yield_exists:
            for record in fetch_fao_data():
                db.add(AgricultureYield(**record))

        existing_keys = {
            (row.country, row.crop, row.year)
            for row in db.scalars(select(AgricultureYield))
        }
        for record in SUPPLEMENTAL_YIELD_ROWS:
            key = (record["country"], record["crop"], record["year"])
            if key not in existing_keys:
                db.add(AgricultureYield(**record))
                existing_keys.add(key)

        db.commit()
