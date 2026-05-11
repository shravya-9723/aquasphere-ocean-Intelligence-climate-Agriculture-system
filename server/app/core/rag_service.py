from server.app.core.openrouter import generate_ollama_response, generate_openrouter_response
from server.app.db.base import create_tables
from server.app.db.models import ChatHistory
from server.app.db.session import SessionLocal
from server.app.schemas.ask import AskResponse
from server.app.services.data_service import data_service
from server.app.services.data_service import COUNTRY_METADATA


PLANTATION_CATALOG = {
    "India": ["rice", "wheat", "tea", "spices", "sugarcane"],
    "United States": ["corn", "soybeans", "wheat", "cotton"],
    "Brazil": ["soybeans", "sugarcane", "coffee", "cocoa"],
    "Australia": ["wheat", "barley", "canola", "sugarcane", "grapes"],
    "Indonesia": ["palm oil", "rice", "coffee", "seaweed"],
    "Japan": ["rice", "tea", "vegetables", "premium fruit"],
    "South Africa": ["maize", "citrus", "grapes", "sugarcane"],
    "Canada": ["wheat", "canola", "potatoes", "barley"],
    "Mexico": ["maize", "sugarcane", "avocado", "coffee"],
    "Spain": ["olives", "citrus", "wheat", "grapes"],
    "Nigeria": ["cassava", "cocoa", "maize", "oil palm"],
    "Thailand": ["rice", "cassava", "sugarcane", "rubber"],
}

SOIL_WATER_PLANT_HEALTH = {
    "Australia": {
        "soil": (
            "Australia has some of the world's oldest and most weathered soils. Over long geological time, "
            "limited mountain building, ancient landscapes, wind erosion, and low rainfall removed many nutrients. "
            "Large inland and western areas are sandy, acidic, saline, or low in phosphorus, while river valleys "
            "and coastal belts support stronger farming where water and soil management are better."
        ),
        "water": "Main water issues are drought, irrigation stress, salinity, groundwater limits, and irregular rainfall.",
        "diseases": "Key plant-health risks include wheat rusts, crown rot, root diseases, canola blackleg, and fungal pressure after wet years.",
    },
    "India": {
        "soil": "India has alluvial soils in river plains, black cotton soils in the Deccan, red soils in peninsular zones, and laterite soils in humid regions.",
        "water": "Main water issues are monsoon variability, groundwater depletion, floods, drought, and salinity in irrigated belts.",
        "diseases": "Important risks include rice blast, wheat rust, bacterial blight, sugarcane red rot, and pest outbreaks after humid periods.",
    },
    "Brazil": {
        "soil": "Brazil includes highly weathered tropical soils, fertile southern agricultural zones, and Cerrado soils that often need lime and nutrient management.",
        "water": "Main water issues are rainfall volatility, drought in some growing zones, flood pulses, and watershed pressure from land conversion.",
        "diseases": "Soybean rust, coffee leaf rust, cocoa witches' broom, nematodes, and fungal diseases are major crop-health concerns.",
    },
    "Mexico": {
        "soil": "Mexico has volcanic soils, arid northern soils, alluvial farming valleys, and tropical southern soils with erosion risk.",
        "water": "Main water issues are drought, irrigation pressure, aquifer stress, and hurricane-linked flooding on coasts.",
        "diseases": "Maize diseases, avocado root rot, coffee rust, and sugarcane fungal diseases are key risks.",
    },
}


class RagService:
    def __init__(self) -> None:
        create_tables()

    def refresh_knowledge_base(self) -> None:
        # Compatibility hook for app startup after removing vector-store refresh logic.
        # The current AI flow is direct generation plus SQLite-backed regional context.
        create_tables()

    def _region_context(self, region: str | None, year: int | None) -> str:
        if not region:
            return "No specific region selected."
        try:
            details = data_service.get_region_details(region, year or 2020)
        except Exception:
            return f"Selected region: {region}."

        agriculture_lines = [
            f"{item['crop']}: {item['yield_tons']} tons"
            for item in details.agriculture
        ]
        return (
            f"Selected region: {details.region}. "
            f"Ocean region: {details.ocean['region']}. "
            f"Water temperature: {details.ocean['temperature']}C in {details.year}. "
            f"Trade hub: {details.trade['hub']}. "
            f"Export focus: {details.trade['export_focus']}. "
            f"Shipping risk: {details.trade['shipping_risk']}. "
            f"Regional insight: {details.insights['summary']}. "
            f"Agriculture snapshot: {'; '.join(agriculture_lines)}."
        )

    def _is_aquasphere_question(self, question: str) -> bool:
        normalized = question.lower()
        domain_terms = [
            "ocean",
            "sea",
            "marine",
            "climate",
            "warming",
            "temperature",
            "crop",
            "yield",
            "agriculture",
            "plantation",
            "plantations",
            "farm",
            "farming",
            "fertility",
            "soil",
            "biomass",
            "biodiversity",
            "pollution",
            "ecosystem",
            "fisheries",
            "aquaculture",
            "shipping",
            "port",
            "trade",
            "export",
            "monsoon",
            "cyclone",
            "hurricane",
            "rainfall",
            "drought",
            "flood",
            "water",
            "irrigation",
            "salinity",
            "disease",
            "diseases",
            "pest",
            "pests",
            "plant health",
            "geographical",
            "geology",
            "evolution",
            "trend",
            "anomaly",
            "risk",
        ]
        return any(term in normalized for term in domain_terms)

    def _resolve_effective_region(self, question: str, region: str | None) -> str | None:
        if not self._is_aquasphere_question(question):
            return None

        normalized = question.lower()

        for country in COUNTRY_METADATA:
            if country.lower() in normalized:
                return country

        ocean_terms = [
            "atlantic ocean",
            "pacific ocean",
            "indian ocean",
            "arctic ocean",
            "southern ocean",
            "atlantic",
            "pacific",
            "indian ocean",
            "arctic",
        ]
        if any(term in normalized for term in ocean_terms):
            return None

        return region

    def _knowledge_for_region(self, region: str | None) -> dict:
        if not region:
            return {
                "soil": "Soil conditions vary by region, climate, parent rock, water availability, and land management.",
                "water": "Water risk usually comes from drought, flooding, salinity, pollution, and irrigation demand.",
                "diseases": "Plant disease risk increases when crop variety, humidity, heat, pests, and weak soil health combine.",
            }
        return SOIL_WATER_PLANT_HEALTH.get(region, self._knowledge_for_region(None))

    def _local_domain_answer(self, question: str, region: str | None, year: int | None, mode: str) -> str:
        normalized = question.lower()
        details = data_service.get_region_details(region, year or 2020) if region else None
        knowledge = self._knowledge_for_region(region)
        plantations = PLANTATION_CATALOG.get(region or "", [])
        place = region or "the selected region"

        if details:
            header = (
                f"Direct answer\n"
                f"For {place}, the key link is soil + water + ocean climate + plantations. "
                f"The local AquaSphere snapshot shows {details.ocean['region']} influence, "
                f"{details.ocean['temperature']:.1f} C ocean temperature in {details.year}, "
                f"and {details.insights['soil_fertility_average']:.1f}/100 soil fertility."
            )
        else:
            header = "Direct answer\nThis is an AquaSphere agriculture and ocean-intelligence question, so I am answering from the built-in free project knowledge base."

        if "soil" in normalized or "geographical" in normalized or "geology" in normalized or "evolution" in normalized:
            body = (
                f"\n\nGeographical evolution of soil\n{knowledge['soil']}\n\n"
                f"Plantations and crops\n"
                f"{place} is best shown with these plantations/crops in the app: {', '.join(plantations) if plantations else 'regional staple crops, plantation crops, and coastal farming systems'}.\n\n"
                f"Water connection\n{knowledge['water']}\n\n"
                f"Plant disease angle\n{knowledge['diseases']}\n\n"
                "Why it matters\nSoil evolution decides what can grow, water decides how stable production is, "
                "and ocean-climate signals can change rainfall, heat stress, pest pressure, and export timing.\n\n"
                "Suggested action\nShow this in AquaSphere as a simple chain: ancient soil condition -> water stress -> plantation choice -> disease risk -> yield/trade impact."
            )
            return header + body

        if "disease" in normalized or "pest" in normalized or "plant health" in normalized:
            return (
                f"{header}\n\n"
                f"Plant disease risk\n{knowledge['diseases']}\n\n"
                "What increases disease pressure\n"
                "- high humidity after rainfall\n"
                "- warmer nights and heat stress\n"
                "- weak soil fertility\n"
                "- repeated cropping without rotation\n"
                "- pests spreading pathogens\n\n"
                f"Plantations to monitor\n{', '.join(plantations) if plantations else 'local crop systems'}.\n\n"
                "Suggested action\nAdd a Plant Health card that shows crop, likely disease, climate trigger, and prevention step."
            )

        if "water" in normalized or "irrigation" in normalized or "salinity" in normalized or "drought" in normalized:
            return (
                f"{header}\n\n"
                f"Water intelligence\n{knowledge['water']}\n\n"
                "How water affects plantations\n"
                "Too little water reduces growth and yield. Too much water increases fungal disease and root stress. "
                "Salinity makes it harder for roots to absorb water even when soil looks moist.\n\n"
                f"Plantations to connect\n{', '.join(plantations) if plantations else 'regional crops'}.\n\n"
                "Suggested action\nShow a Water Stress indicator beside each country: drought, flood, salinity, irrigation pressure."
            )

        if "plantation" in normalized or "crop" in normalized or "agriculture" in normalized:
            return (
                f"{header}\n\n"
                f"Main plantations/crops\n{', '.join(plantations) if plantations else 'No predefined plantation list is available for this region yet.'}\n\n"
                f"Soil context\n{knowledge['soil']}\n\n"
                f"Water context\n{knowledge['water']}\n\n"
                "Suggested action\nUse the Data page to show each country with crops, soil type, water stress, plant disease risk, and trade hub."
            )

        return (
            f"{header}\n\n"
            f"Soil\n{knowledge['soil']}\n\n"
            f"Water\n{knowledge['water']}\n\n"
            f"Plant health\n{knowledge['diseases']}\n\n"
            f"Plantations\n{', '.join(plantations) if plantations else 'regional crops'}.\n\n"
            "Suggested action\nKeep the answer simple: what is happening, why it matters, and what the farmer, researcher, or planner should monitor."
        )

    def _offline_answer(self, question: str, region: str | None, context: str, is_domain_question: bool, year: int | None, mode: str) -> str:
        normalized = question.lower()

        if not is_domain_question:
            return (
                "I cannot give a properly researched general answer right now because the live AI connection is unavailable.\n\n"
                "This question is outside the local AquaSphere dataset, so I will not mix in ocean temperature, crop yield, or regional risk cards. "
                "Please add a working OpenRouter API key to enable general research-style answers for any topic."
            )

        if "atlantic" in normalized and ("plantation" in normalized or "plantations" in normalized):
            return (
                "Plantations near the Atlantic Ocean are commonly found along the Atlantic-facing parts of "
                "West Africa, Brazil, the Caribbean, and parts of Central America.\n\n"
                "Examples include cocoa and oil-palm systems in countries like Ghana and Cote d'Ivoire, "
                "sugarcane in Brazil and the Caribbean, banana production in tropical Atlantic-facing zones, "
                "and some timber or eucalyptus plantations in coastal Brazil.\n\n"
                "Why these areas matter:\n"
                "- warm humid coastal climates support tropical crops\n"
                "- ports make export easier\n"
                "- ocean conditions can affect rainfall, storms, salinity, and shipping reliability\n\n"
                "If you want, ask me for plantations near the North Atlantic, South Atlantic, Brazil, West Africa, or the Caribbean and I can narrow it down."
            )

        if "trade risk" in normalized or ("trade" in normalized and "risk" in normalized):
            return (
                "A simple trade-risk view looks at three things: weather disruption, port congestion, and crop sensitivity.\n\n"
                f"For the currently selected region{f' ({region})' if region else ''}, the local context says:\n"
                f"{context}\n\n"
                "That means the main operational risks are shipment delays, climate-linked production swings, and pressure on export timing."
            )

        if "marine food security" in normalized:
            return (
                "A practical five-year marine food security plan would focus on:\n"
                "1. protecting nursery habitats and coastal ecosystems\n"
                "2. improving fisheries monitoring and catch controls\n"
                "3. expanding resilient aquaculture\n"
                "4. reducing post-harvest loss through cold-chain and port upgrades\n"
                "5. using climate and ocean forecasts for early action\n\n"
                "This works best when marine policy, trade logistics, and local farming or fishing communities are planned together."
            )

        if "ocean warming" in normalized and ("crop" in normalized or "yield" in normalized or "agriculture" in normalized):
            return (
                "Ocean warming can reduce crop yield indirectly by changing rainfall patterns, monsoon timing, humidity, coastal flooding risk, and storm intensity.\n\n"
                "Cause to effect:\n"
                "- warmer oceans change atmospheric moisture and circulation\n"
                "- rainfall becomes less reliable or more extreme\n"
                "- crops face planting stress, waterlogging, drought, salinity, or heat pressure\n"
                "- yields and trade reliability become more volatile\n\n"
                f"Current selected-region context: {context}"
            )

        if region:
            return self._local_domain_answer(question, region, year, mode)

        return (
            "AquaSphere free AI can answer project topics like oceans, water, soil, plantations, plant disease, agriculture, trade, and trends.\n\n"
            "Pick a region or mention a country, then ask about soil, water, crop disease, plantations, ocean warming, or trade risk."
        )

    def _score_label(self, score: int) -> str:
        if score >= 75:
            return "High"
        if score >= 50:
            return "Moderate"
        return "Low"

    def _risk_cards(self, region: str | None, year: int | None) -> list[dict]:
        if not region:
            return [
                {"name": "Warming", "score": 58, "level": "Moderate", "evidence": "General ocean warming pressure is present across major basins."},
                {"name": "Pollution", "score": 46, "level": "Low", "evidence": "No selected region, so pollution pressure is estimated conservatively."},
                {"name": "Biodiversity", "score": 54, "level": "Moderate", "evidence": "Marine habitat stress rises when heat and coastal pressure combine."},
                {"name": "Shipping", "score": 50, "level": "Moderate", "evidence": "Shipping exposure depends on port, storm, and trade-lane conditions."},
            ]

        details = data_service.get_region_details(region, year or 2020)
        temp_delta = max(0.0, float(details.insights["temperature_vs_baseline"]))
        fertility = float(details.insights["soil_fertility_average"])
        shipping_text = str(details.trade["shipping_risk"]).lower()
        storm_terms = ["cyclone", "hurricane", "storm", "typhoon", "swell", "flood"]

        warming = min(95, round(42 + temp_delta * 24))
        pollution = min(88, round(34 + (100 - fertility) * 0.32 + len(details.agriculture) * 2))
        biodiversity = min(92, round(38 + temp_delta * 16 + (100 - fertility) * 0.22))
        shipping = min(94, round(40 + (18 if any(term in shipping_text for term in storm_terms) else 6) + temp_delta * 9))

        return [
            {
                "name": "Warming",
                "score": warming,
                "level": self._score_label(warming),
                "evidence": f"Temperature is {details.insights['temperature_vs_baseline']:.1f} C versus the regional baseline.",
            },
            {
                "name": "Pollution",
                "score": pollution,
                "level": self._score_label(pollution),
                "evidence": f"Soil fertility average is {fertility:.1f}/100, a proxy for land-water stress.",
            },
            {
                "name": "Biodiversity",
                "score": biodiversity,
                "level": self._score_label(biodiversity),
                "evidence": f"Heat pressure plus {details.ocean['region']} ecosystem exposure can affect habitat stability.",
            },
            {
                "name": "Shipping",
                "score": shipping,
                "level": self._score_label(shipping),
                "evidence": details.trade["shipping_risk"],
            },
        ]

    def _region_comparison(self, year: int | None) -> list[dict]:
        comparison = []
        for region in ["India", "Mexico", "Brazil"]:
            details = data_service.get_region_details(region, year or 2020)
            cards = self._risk_cards(region, year)
            comparison.append(
                {
                    "region": region,
                    "ocean_region": details.ocean["region"],
                    "temperature": details.ocean["temperature"],
                    "yield_baseline": details.insights["yield_baseline"],
                    "fertility": details.insights["soil_fertility_average"],
                    "shipping_risk": details.trade["shipping_risk"],
                    "top_risk": max(cards, key=lambda item: item["score"])["name"],
                }
            )
        return comparison

    def _timeline_summaries(self, region: str | None, year: int | None, mode: str) -> list[dict]:
        if not region:
            return []
        details = data_service.get_region_details(region, year or 2020)
        summaries = []
        for point in details.timeline:
            temp_gap = point["temperature"] - details.ocean["baseline_temperature"]
            pressure = "warming pressure" if temp_gap > 0.15 else "near-baseline conditions"
            if mode == "researcher":
                text = (
                    f"{point['year']}: {point['temperature']:.1f} C ocean signal with "
                    f"{point['yield_tons']:.1f} t aggregate yield; classify as {pressure}."
                )
            else:
                text = (
                    f"{point['year']}: the ocean was {point['temperature']:.1f} C and farms produced "
                    f"{point['yield_tons']:.1f} t, so this year shows {pressure}."
                )
            summaries.append({"year": point["year"], "summary": text})
        return summaries

    def _anomaly_alerts(self, region: str | None, year: int | None) -> list[dict]:
        if not region:
            return [
                {"type": "temperature spike", "level": "Watch", "message": "Select a region to compute exact heat anomalies."},
                {"type": "fertility stress", "level": "Watch", "message": "Fertility stress needs a regional crop profile."},
                {"type": "trade disruption risk", "level": "Watch", "message": "Shipping risk depends on the selected trade hub."},
            ]
        details = data_service.get_region_details(region, year or 2020)
        analytics = details.analytics
        alerts = []
        temp_count = len(analytics["anomalies"]["temperature_anomalies"])
        yield_count = len(analytics["anomalies"]["yield_anomalies"])
        fertility = details.insights["soil_fertility_average"]
        shipping = details.trade["shipping_risk"]
        alerts.append(
            {
                "type": "temperature spike",
                "level": "Alert" if temp_count else "Watch",
                "message": f"{temp_count} temperature anomaly point(s) found in the regional timeline.",
            }
        )
        alerts.append(
            {
                "type": "fertility stress",
                "level": "Alert" if fertility < 58 or yield_count else "Watch",
                "message": f"Fertility score is {fertility:.1f}/100 with {yield_count} yield anomaly point(s).",
            }
        )
        alerts.append(
            {
                "type": "trade disruption risk",
                "level": "Alert" if any(term in shipping.lower() for term in ["cyclone", "hurricane", "storm", "typhoon", "flood"]) else "Watch",
                "message": shipping,
            }
        )
        return alerts

    def _premium_sections(
        self,
        question: str,
        answer: str,
        region: str | None,
        year: int | None,
        mode: str,
        compare_regions: bool,
    ) -> dict:
        is_domain_question = self._is_aquasphere_question(question)
        details = data_service.get_region_details(region, year or 2020) if region and is_domain_question else None
        if details:
            knowledge = self._knowledge_for_region(details.region)
            plantations = PLANTATION_CATALOG.get(details.region, [item["crop"] for item in details.agriculture])
            summary = f"{details.region}: {', '.join(plantations)} linked with {details.ocean['region']} climate, water stress, soil fertility {details.insights['soil_fertility_average']:.1f}/100, and trade via {details.trade['hub']}."
            analysis = (
                f"The answer uses the selected region, local crop data, soil/water knowledge, plant-health risk, "
                f"and {details.ocean['region']} ocean-climate context for {details.year}."
            )
            suggested_action = (
                "Track four simple indicators together: water stress, soil fertility, plant disease risk, and export-route risk. "
                f"For {details.region}, watch {details.trade['hub']} and plantations such as {', '.join(plantations[:4])}."
            )
            risks = [
                f"Warming: {details.insights['temperature_vs_baseline']:.1f} C versus baseline.",
                f"Fertility: {details.insights['soil_fertility_average']:.1f}/100 across current crops.",
                f"Water: {knowledge['water']}",
                f"Plant disease: {knowledge['diseases']}",
                f"Shipping: {details.trade['shipping_risk']}",
            ]
            why = [
                f"Selected region: {details.region}.",
                f"Selected year: {details.year}.",
                "Sources include AquaSphere regional context and the generated answer.",
            ]
        else:
            first_sentence = answer.split(".")[0].strip()
            summary = f"{first_sentence}." if first_sentence else "This answer uses general ocean-climate knowledge with AquaSphere context."
            analysis = "This question is not an AquaSphere climate-data question, so local region metrics were not forced into the answer."
            risks = []
            suggested_action = "For general research questions, use the live AI connection; for AquaSphere analysis, choose a region and ask about climate, crops, ocean health, trade, or trends."
            why = [
                "The question did not match the local AquaSphere climate/agriculture/trade dataset.",
                "Regional cards were hidden to avoid misleading context.",
            ]

        if mode == "researcher":
            analysis = f"{analysis} Interpretation is framed for evidence, variables, and uncertainty."
            suggested_action = f"{suggested_action} Record assumptions and validate against NOAA, FAO, or port data before operational use."
        else:
            analysis = f"{analysis} In student mode, the key idea is: warmer oceans can change farms, ecosystems, and trade routes."

        return {
            "summary": summary,
            "analysis": analysis,
            "risks": risks,
            "suggested_action": suggested_action,
            "why_this_answer": why,
            "risk_cards": self._risk_cards(region, year) if details else [],
            "region_comparison": self._region_comparison(year) if details and compare_regions else [],
            "timeline_summaries": self._timeline_summaries(region, year, mode) if details else [],
            "anomaly_alerts": self._anomaly_alerts(region, year) if details else [],
            "explanation_mode": mode,
        }

    async def answer_question(
        self,
        question: str,
        region: str | None,
        year: int | None,
        user_id: int | None = None,
        explanation_mode: str = "student",
        compare_regions: bool = False,
    ) -> AskResponse:
        is_domain_question = self._is_aquasphere_question(question)
        effective_region = self._resolve_effective_region(question, region)
        context = self._region_context(effective_region, year) if is_domain_question else ""
        mode = explanation_mode if explanation_mode in {"student", "researcher"} else "student"
        model_question = (
            f"{question}\n\n"
            "Format preference: answer the actual user question first. Include concise sections named Summary, Analysis, and Suggested Action when useful. "
            "Only mention AquaSphere regional data if the question is about ocean, climate, agriculture, biodiversity, pollution, shipping, trade, or trends. "
            f"Explain like a {mode}."
        )

        try:
            answer = await generate_openrouter_response(model_question, context)
            sources = ["OpenRouter generative answer"]
            if effective_region:
                sources.append("AquaSphere regional context")
            confidence = 0.72 if effective_region else 0.62
        except Exception:
            try:
                answer = await generate_ollama_response(model_question, context)
                sources = ["Local Ollama AI"]
                if effective_region:
                    sources.append("AquaSphere regional context")
                confidence = 0.68 if effective_region else 0.6
            except Exception:
                answer = self._offline_answer(question, effective_region, context, is_domain_question, year, mode)
                sources = ["AquaSphere fallback answer"]
                if effective_region:
                    sources.append("AquaSphere regional context")
                confidence = 0.55 if effective_region else 0.45

        premium = self._premium_sections(question, answer, effective_region, year, mode, compare_regions)

        chat_id: int | None = None
        if user_id is not None:
            with SessionLocal() as db:
                record = ChatHistory(
                    user_id=user_id,
                    question=question,
                    answer=answer,
                    region=effective_region,
                    year=year,
                    confidence=confidence,
                )
                db.add(record)
                db.commit()
                db.refresh(record)
                chat_id = record.id

        return AskResponse(
            answer=answer,
            sources=sources,
            confidence=confidence,
            chat_id=chat_id,
            **premium,
        )


rag_service = RagService()
