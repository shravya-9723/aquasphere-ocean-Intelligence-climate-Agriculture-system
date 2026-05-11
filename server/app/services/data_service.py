from datetime import datetime
from statistics import mean

from fastapi import HTTPException
from sqlalchemy import select

from server.app.core.analytics import anomaly_detection, correlation, trend_detection
from server.app.db.models import AgricultureYield, OceanTemperature
from server.app.db.session import SessionLocal
from server.app.schemas.analytics import AnalyticsResponse
from server.app.schemas.map import FeatureCollectionResponse, MapDataResponse, RegionResponse


COUNTRY_METADATA = {
    "India": {
        "ocean_region": "Indian Ocean",
        "latitude": 20.5937,
        "longitude": 78.9629,
        "insight": "Monsoon-sensitive rice systems respond quickly to ocean warming and rainfall timing shifts.",
        "trade": {
            "hub": "Mumbai and Chennai corridors",
            "export_focus": "Rice, spices, aquaculture inputs",
            "shipping_risk": "Cyclones and monsoon congestion can slow export flows.",
        },
    },
    "United States": {
        "ocean_region": "North Atlantic",
        "latitude": 38.9072,
        "longitude": -77.0369,
        "insight": "Atlantic warming can intensify storm-linked logistics pressure on grain and seafood corridors.",
        "trade": {
            "hub": "Gulf and Atlantic terminals",
            "export_focus": "Corn, soy, seafood logistics",
            "shipping_risk": "Storm surge and hurricane exposure near coastal infrastructure.",
        },
    },
    "Brazil": {
        "ocean_region": "South Atlantic",
        "latitude": -14.2350,
        "longitude": -51.9253,
        "insight": "Soybean strength remains high, but rainfall volatility can shift planting and freight timing.",
        "trade": {
            "hub": "Santos and Paranagua",
            "export_focus": "Soybeans and tropical commodities",
            "shipping_risk": "Heavy rain and sediment buildup can pressure port throughput.",
        },
    },
    "Australia": {
        "ocean_region": "South Pacific",
        "latitude": -25.2744,
        "longitude": 133.7751,
        "insight": "Marine heat and rainfall swings shape wheat resilience and export timing.",
        "trade": {
            "hub": "Brisbane and Fremantle",
            "export_focus": "Wheat and marine products",
            "shipping_risk": "Drought years increase inland freight stress before export.",
        },
    },
    "Indonesia": {
        "ocean_region": "Pacific Warm Pool",
        "latitude": -0.7893,
        "longitude": 113.9213,
        "insight": "Warm-pool variability strongly influences fisheries productivity, rain bands, and palm oil routing.",
        "trade": {
            "hub": "Jakarta and Surabaya",
            "export_focus": "Palm oil, tuna, seaweed",
            "shipping_risk": "Monsoon shifts and reef-sensitive lanes complicate shipping.",
        },
    },
    "Japan": {
        "ocean_region": "North Pacific",
        "latitude": 36.2048,
        "longitude": 138.2529,
        "insight": "North Pacific changes can stress coastal biodiversity and premium rice stability.",
        "trade": {
            "hub": "Yokohama and Kobe",
            "export_focus": "Processed food, premium seafood, marine technology",
            "shipping_risk": "Typhoon exposure and energy-cost sensitivity.",
        },
    },
    "South Africa": {
        "ocean_region": "South Indian",
        "latitude": -30.5595,
        "longitude": 22.9375,
        "insight": "Ocean-driven moisture variability affects maize outlooks and seasonal food security.",
        "trade": {
            "hub": "Durban and Cape Town",
            "export_focus": "Maize, fruit, fisheries",
            "shipping_risk": "Strong swell and wind events can interrupt container operations.",
        },
    },
    "Canada": {
        "ocean_region": "North Atlantic",
        "latitude": 56.1304,
        "longitude": -106.3468,
        "insight": "Cold-ocean variability and shifting rainfall windows influence wheat, canola, and storage planning.",
        "trade": {
            "hub": "Halifax and Montreal gateways",
            "export_focus": "Wheat, canola, potatoes",
            "shipping_risk": "Atlantic storms and winter port delays can affect outbound timing.",
        },
    },
    "Mexico": {
        "ocean_region": "North Atlantic",
        "latitude": 23.6345,
        "longitude": -102.5528,
        "insight": "Gulf and Caribbean climate shifts interact with maize, sugarcane, and fruit logistics.",
        "trade": {
            "hub": "Veracruz and Gulf corridors",
            "export_focus": "Maize, sugarcane, avocado",
            "shipping_risk": "Hurricane exposure and heat stress affect inland-to-port movement.",
        },
    },
    "Spain": {
        "ocean_region": "North Atlantic",
        "latitude": 40.4637,
        "longitude": -3.7492,
        "insight": "Atlantic moisture variability and heat stress shape olive, citrus, and wheat resilience.",
        "trade": {
            "hub": "Valencia and Algeciras links",
            "export_focus": "Olives, citrus, cereals",
            "shipping_risk": "Heatwaves and low-rainfall years can tighten export quality margins.",
        },
    },
    "Nigeria": {
        "ocean_region": "South Atlantic",
        "latitude": 9.0820,
        "longitude": 8.6753,
        "insight": "Atlantic humidity, flood pulses, and infrastructure stress shape cassava, cocoa, and maize flows.",
        "trade": {
            "hub": "Lagos and Port Harcourt",
            "export_focus": "Cassava, cocoa, maize",
            "shipping_risk": "Flooding and congestion can reduce reliability of coastal export corridors.",
        },
    },
    "Thailand": {
        "ocean_region": "Pacific Warm Pool",
        "latitude": 15.8700,
        "longitude": 100.9925,
        "insight": "Warm-pool shifts can change rainfall timing, aquaculture exposure, and rice-cassava supply stability.",
        "trade": {
            "hub": "Laem Chabang and Bangkok",
            "export_focus": "Rice, cassava, sugarcane",
            "shipping_risk": "Monsoon swings and flood exposure influence port and farm timing.",
        },
    },
}

CROP_FACTORS = {
    "Rice": {"biomass_factor": 1.28, "fertility_offset": 6},
    "Wheat": {"biomass_factor": 1.18, "fertility_offset": 4},
    "Corn": {"biomass_factor": 1.25, "fertility_offset": 5},
    "Maize": {"biomass_factor": 1.26, "fertility_offset": 5},
    "Soybeans": {"biomass_factor": 1.11, "fertility_offset": 7},
    "Palm Oil": {"biomass_factor": 1.42, "fertility_offset": 2},
    "Canola": {"biomass_factor": 1.15, "fertility_offset": 6},
    "Potatoes": {"biomass_factor": 0.94, "fertility_offset": 9},
    "Sugarcane": {"biomass_factor": 1.58, "fertility_offset": 3},
    "Avocado": {"biomass_factor": 0.88, "fertility_offset": 8},
    "Olives": {"biomass_factor": 0.91, "fertility_offset": 7},
    "Citrus": {"biomass_factor": 1.02, "fertility_offset": 8},
    "Cassava": {"biomass_factor": 1.36, "fertility_offset": 4},
    "Cocoa": {"biomass_factor": 0.74, "fertility_offset": 6},
}


class DataService:
    def _crop_metrics(self, crop: str, yield_tons: float, temperature: float, baseline_temperature: float) -> dict:
        factors = CROP_FACTORS.get(crop, {"biomass_factor": 1.0, "fertility_offset": 5})
        biomass_index = round(yield_tons * factors["biomass_factor"], 1)
        fertility_score = round(
            max(
                35.0,
                min(
                    96.0,
                    56
                    + factors["fertility_offset"]
                    + (yield_tons / 5.2)
                    - max(0.0, temperature - baseline_temperature) * 8.5,
                ),
            ),
            1,
        )
        fertility_band = "High" if fertility_score >= 76 else "Moderate" if fertility_score >= 58 else "Stressed"
        return {
            "biomass_index": biomass_index,
            "soil_fertility_index": fertility_score,
            "fertility_band": fertility_band,
        }

    def _load_ocean_rows(self) -> list[OceanTemperature]:
        with SessionLocal() as db:
            return list(db.scalars(select(OceanTemperature).order_by(OceanTemperature.region, OceanTemperature.date)))

    def _load_yield_rows(self) -> list[AgricultureYield]:
        with SessionLocal() as db:
            return list(
                db.scalars(
                    select(AgricultureYield).order_by(
                        AgricultureYield.country,
                        AgricultureYield.crop,
                        AgricultureYield.year,
                    )
                )
            )

    def _resolve_year(self, years: list[int], target_year: int) -> int:
        if not years:
            raise HTTPException(status_code=404, detail="No data")
        eligible = [year for year in years if year <= target_year]
        return max(eligible) if eligible else min(years)

    def _temperature_for_year(self, ocean_rows: list[OceanTemperature], ocean_region: str, year: int) -> OceanTemperature:
        candidates = [row for row in ocean_rows if row.region == ocean_region]
        if not candidates:
            raise HTTPException(status_code=404, detail=f"No ocean data for {ocean_region}")
        resolved_year = self._resolve_year([int(row.date[:4]) for row in candidates], year)
        return next(row for row in reversed(candidates) if int(row.date[:4]) == resolved_year)

    def _series_for_country(self, country: str) -> list[dict]:
        metadata = COUNTRY_METADATA.get(country)
        if not metadata:
            raise HTTPException(status_code=404, detail="Region not found")

        ocean_rows = self._load_ocean_rows()
        yield_rows = [row for row in self._load_yield_rows() if row.country == country]
        if not yield_rows:
            raise HTTPException(status_code=404, detail="No agriculture data")

        grouped: dict[int, list[AgricultureYield]] = {}
        for row in yield_rows:
            grouped.setdefault(row.year, []).append(row)

        timeline = []
        for year, rows in sorted(grouped.items()):
            ocean_row = self._temperature_for_year(ocean_rows, metadata["ocean_region"], year)
            timeline.append(
                {
                    "year": year,
                    "temperature": ocean_row.temperature,
                    "yield_tons": round(sum(row.yield_tons for row in rows), 2),
                }
            )
        return timeline

    def _snapshot_for_country(
        self,
        country: str,
        year: int,
        ocean_rows: list[OceanTemperature],
        yield_rows: list[AgricultureYield],
    ) -> dict:
        metadata = COUNTRY_METADATA.get(country)
        if not metadata:
            raise HTTPException(status_code=404, detail=f"No metadata for {country}")

        country_yields = [row for row in yield_rows if row.country == country]
        if not country_yields:
            raise HTTPException(status_code=404, detail=f"No agriculture data for {country}")

        resolved_year = self._resolve_year([row.year for row in country_yields], year)
        year_rows = [row for row in country_yields if row.year == resolved_year]
        ocean_row = self._temperature_for_year(ocean_rows, metadata["ocean_region"], resolved_year)
        historical_temps = [
            row.temperature for row in ocean_rows if row.region == metadata["ocean_region"]
        ]
        temp_baseline = round(mean(historical_temps), 2) if historical_temps else ocean_row.temperature
        enriched_rows = [
            {
                "country": row.country,
                "crop": row.crop,
                "yield_tons": row.yield_tons,
                "year": row.year,
                **self._crop_metrics(row.crop, row.yield_tons, ocean_row.temperature, temp_baseline),
            }
            for row in year_rows
        ]

        return {
            "country": country,
            "year": resolved_year,
            "ocean_region": metadata["ocean_region"],
            "latitude": metadata["latitude"],
            "longitude": metadata["longitude"],
            "temperature": ocean_row.temperature,
            "crop": year_rows[0].crop,
            "yield_tons": round(sum(row.yield_tons for row in year_rows), 2),
            "agriculture": enriched_rows,
            "trade": metadata["trade"],
            "insight": metadata["insight"],
            "soil_fertility_average": round(mean(item["soil_fertility_index"] for item in enriched_rows), 1),
            "biomass_total": round(sum(item["biomass_index"] for item in enriched_rows), 1),
        }

    def get_map_data(self, year: int) -> MapDataResponse:
        ocean_rows = self._load_ocean_rows()
        yield_rows = self._load_yield_rows()
        points = [
            self._snapshot_for_country(country, year, ocean_rows, yield_rows)
            for country in COUNTRY_METADATA
        ]

        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [point["longitude"], point["latitude"]],
                    },
                    "properties": {
                        "name": point["country"],
                        "ocean_region": point["ocean_region"],
                        "temperature": point["temperature"],
                        "crop": point["crop"],
                        "yield_tons": point["yield_tons"],
                        "year": point["year"],
                        "insight": point["insight"],
                    },
                }
                for point in points
            ],
        }

        return MapDataResponse(
            year=year,
            geojson=FeatureCollectionResponse(**geojson),
            ocean=[
                {
                    "region": point["ocean_region"],
                    "temperature": point["temperature"],
                    "latitude": point["latitude"],
                    "longitude": point["longitude"],
                    "year": point["year"],
                }
                for point in points
            ],
            agriculture=[
                {
                    "country": point["country"],
                    "crop": point["crop"],
                    "yield_tons": point["yield_tons"],
                    "ocean_region": point["ocean_region"],
                    "latitude": point["latitude"],
                    "longitude": point["longitude"],
                    "year": point["year"],
                    "trade_hub": point["trade"]["hub"],
                    "insight": point["insight"],
                    "biomass_index": point["biomass_total"],
                    "soil_fertility_index": point["soil_fertility_average"],
                    "fertility_band": "High" if point["soil_fertility_average"] >= 76 else "Moderate" if point["soil_fertility_average"] >= 58 else "Stressed",
                }
                for point in points
            ],
            agriculture_catalog=[
                {
                    "country": point["country"],
                    "crop": row["crop"],
                    "yield_tons": row["yield_tons"],
                    "ocean_region": point["ocean_region"],
                    "latitude": point["latitude"],
                    "longitude": point["longitude"],
                    "year": row["year"],
                    "trade_hub": point["trade"]["hub"],
                    "insight": point["insight"],
                    "biomass_index": row["biomass_index"],
                    "soil_fertility_index": row["soil_fertility_index"],
                    "fertility_band": row["fertility_band"],
                }
                for point in points
                for row in point["agriculture"]
            ],
        )

    def get_analytics(self, region: str, years: int) -> AnalyticsResponse:
        timeline = self._series_for_country(region)
        return AnalyticsResponse(
            region=region,
            correlation=correlation(region, timeline, years),
            trend=trend_detection(region, timeline, years),
            anomalies=anomaly_detection(region, timeline, years),
        )

    def get_region_details(self, name: str, year: int) -> RegionResponse:
        ocean_rows = self._load_ocean_rows()
        yield_rows = self._load_yield_rows()
        snapshot = self._snapshot_for_country(name, year, ocean_rows, yield_rows)
        timeline = self._series_for_country(name)
        avg_temperature = round(mean(point["temperature"] for point in timeline), 2)
        avg_yield = round(mean(point["yield_tons"] for point in timeline), 2)

        return RegionResponse(
            region=name,
            year=snapshot["year"],
            ocean={
                "region": snapshot["ocean_region"],
                "temperature": snapshot["temperature"],
                "recorded_at": datetime(snapshot["year"], 1, 1).date().isoformat(),
                "baseline_temperature": avg_temperature,
            },
            agriculture=[
                row
                for row in snapshot["agriculture"]
            ],
            analytics=self.get_analytics(name, 10).model_dump(),
            trade=snapshot["trade"],
            insights={
                "summary": snapshot["insight"],
                "yield_baseline": avg_yield,
                "temperature_vs_baseline": round(snapshot["temperature"] - avg_temperature, 2),
                "biomass_total": snapshot["biomass_total"],
                "soil_fertility_average": snapshot["soil_fertility_average"],
            },
            timeline=timeline,
        )


data_service = DataService()
