"use client";

import type { AnalyticsResponse, RegionResponse } from "@/lib/types";


interface DataPanelProps {
  regionName: string | null;
  regionData?: RegionResponse;
  analytics?: AnalyticsResponse;
}

const PLANTATION_CATALOG: Record<string, string[]> = {
  India: ["Rice", "Wheat", "Tea", "Spices", "Sugarcane"],
  "United States": ["Corn", "Soybeans", "Wheat", "Cotton"],
  Brazil: ["Soybeans", "Sugarcane", "Coffee", "Cocoa"],
  Australia: ["Wheat", "Barley", "Canola", "Sugarcane", "Grapes"],
  Indonesia: ["Palm Oil", "Rice", "Coffee", "Seaweed"],
  Japan: ["Rice", "Tea", "Vegetables", "Premium fruit"],
  "South Africa": ["Maize", "Citrus", "Grapes", "Sugarcane"],
  Canada: ["Wheat", "Canola", "Potatoes", "Barley"],
  Mexico: ["Maize", "Sugarcane", "Avocado", "Coffee"],
  Spain: ["Olives", "Citrus", "Wheat", "Grapes"],
  Nigeria: ["Cassava", "Cocoa", "Maize", "Oil palm"],
  Thailand: ["Rice", "Cassava", "Sugarcane", "Rubber"],
};

const EARTH_SYSTEM_INTELLIGENCE: Record<string, {
  soil: string;
  water: string;
  irrigation: string;
  disease: string;
  oceanLink: string;
}> = {
  Australia: {
    soil: "Ancient, highly weathered soils; many inland and western zones are nutrient-poor, sandy, acidic, saline, or low in phosphorus.",
    water: "Drought, irregular rainfall, groundwater limits, and river-basin stress shape farm stability.",
    irrigation: "Irrigation must manage salinity carefully, especially in dryland and basin agriculture.",
    disease: "Wheat rusts, crown rot, root diseases, canola blackleg, and fungal pressure after wet years.",
    oceanLink: "South Pacific and Indian Ocean patterns influence rainfall swings, drought years, and export timing.",
  },
  India: {
    soil: "Alluvial plains, black cotton soils, red soils, and laterite belts support very different crop systems.",
    water: "Monsoon variability, floods, droughts, and groundwater depletion are the main water pressures.",
    irrigation: "Canals and tube wells support food production but can increase salinity and aquifer stress.",
    disease: "Rice blast, wheat rust, bacterial blight, sugarcane red rot, and humidity-linked pest outbreaks.",
    oceanLink: "Indian Ocean warming can affect monsoon timing, rainfall intensity, cyclones, and coastal agriculture.",
  },
  Brazil: {
    soil: "Highly weathered tropical soils, Cerrado soils needing lime/nutrients, and stronger southern farming zones.",
    water: "Rainfall volatility, drought pockets, flood pulses, and watershed pressure affect plantation reliability.",
    irrigation: "Irrigation and soil correction help Cerrado farming but need careful watershed management.",
    disease: "Soybean rust, coffee leaf rust, cocoa witches' broom, nematodes, and fungal crop diseases.",
    oceanLink: "South Atlantic conditions interact with rainfall, ports, and soybean/sugarcane export timing.",
  },
  Mexico: {
    soil: "Volcanic soils, arid northern soils, alluvial valleys, and tropical southern soils with erosion risk.",
    water: "Drought, aquifer stress, irrigation demand, and hurricane-linked flooding affect plantations.",
    irrigation: "Irrigation supports maize, avocado, and sugarcane but increases pressure on dry basins.",
    disease: "Maize diseases, avocado root rot, coffee rust, and sugarcane fungal disease risk.",
    oceanLink: "Gulf, Pacific, and Caribbean climate signals influence storms, rainfall, and export reliability.",
  },
};

function getEarthIntelligence(region: string | null) {
  return EARTH_SYSTEM_INTELLIGENCE[region ?? ""] ?? {
    soil: "Soil evolution depends on parent rock, rainfall, erosion, organic matter, and long-term land use.",
    water: "Water stress comes from drought, floods, salinity, groundwater pressure, and polluted runoff.",
    irrigation: "Irrigation can stabilize production but may create salinity, drainage, and aquifer problems.",
    disease: "Plant disease risk rises with humidity, weak soil, pests, monocropping, and heat stress.",
    oceanLink: "Ocean temperature changes can shift rainfall, storms, humidity, pest pressure, and trade windows.",
  };
}

export function DataPanel({ regionName, regionData, analytics }: DataPanelProps) {
  const riskCards = regionData ? buildRiskCards(regionData) : [];
  const earth = getEarthIntelligence(regionName);
  const plantations = PLANTATION_CATALOG[regionName ?? ""] ?? regionData?.agriculture.map((item) => item.crop) ?? [];

  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-glow">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">Interactive Dashboard</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{regionName ?? "Select a region"}</h3>
        </div>
        <div className="rounded-full border border-cyan-100/10 bg-cyan-100/5 px-3 py-1 text-xs text-cyan-50/70">
          {regionData ? `${regionData.year} snapshot` : "Awaiting map click"}
        </div>
      </div>

      {regionData && analytics ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Ocean Temp" value={`${regionData.ocean.temperature.toFixed(1)} C`} />
            <StatCard label="Crop Yield Baseline" value={`${regionData.insights.yield_baseline.toFixed(1)} t`} />
            <StatCard label="Correlation" value={`${analytics.correlation.percent.toFixed(1)}%`} />
            <StatCard label="Trade Hub" value={regionData.trade.hub} />
            <StatCard label="Biomass Total" value={`${regionData.insights.biomass_total.toFixed(1)}`} />
            <StatCard label="Soil Fertility" value={`${regionData.insights.soil_fertility_average.toFixed(1)} / 100`} />
          </div>

          <NarrativeBlock
            title="Regional insight"
            text={regionData.insights.summary}
          />

          <div className="rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Soil, water and plant health intelligence</p>
            <p className="mt-2 text-sm leading-7 text-cyan-50/70">
              This is the project layer that connects oceans with agriculture, water, soil, plantations, and crop disease.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InsightCard title="Soil evolution" value={earth.soil} />
              <InsightCard title="Plantations / crops" value={plantations.length ? plantations.join(", ") : "Select a region to load crops."} />
              <InsightCard title="Water stress" value={earth.water} />
              <InsightCard title="Irrigation / salinity / drought" value={earth.irrigation} />
              <InsightCard title="Plant disease and pest risk" value={earth.disease} />
              <InsightCard title="Ocean-climate-agriculture link" value={earth.oceanLink} />
            </div>
          </div>

          <div className="rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Risk score cards</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {riskCards.map((card) => (
                <div className="rounded-[18px] border border-cyan-100/8 bg-slate-950/25 p-4" key={card.label}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{card.label}</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-cyan-50/70">{card.level}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-900/70">
                    <div className="confidence-bar h-2 rounded-full" style={{ width: `${card.score}%` }} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-cyan-50/62">{card.score}/100 - {card.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InsightCard title="Trade focus" value={regionData.trade.export_focus} />
            <InsightCard title="Shipping risk" value={regionData.trade.shipping_risk} />
            <InsightCard title="Trend signal" value={analytics.trend.signal} />
            <InsightCard
              title="Temperature vs baseline"
              value={`${regionData.insights.temperature_vs_baseline.toFixed(1)} C`}
            />
          </div>

          <div className="rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Timeline summary</p>
            <div className="mt-4 space-y-3">
              {regionData.timeline.map((item) => (
                <div
                  key={item.year}
                  className="grid grid-cols-3 rounded-[18px] border border-cyan-100/8 bg-slate-950/25 px-4 py-3 text-sm text-cyan-50/78"
                >
                  <span>{item.year}</span>
                  <span>{item.temperature.toFixed(1)} C</span>
                  <span>{item.yield_tons.toFixed(1)} t</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Agriculture profile</p>
            <div className="mt-4 space-y-3">
              {regionData.agriculture.map((item) => (
                <div
                  key={`${item.country}-${item.crop}-${item.year}`}
                  className="rounded-[18px] border border-cyan-100/8 bg-slate-950/25 px-4 py-3 text-sm text-cyan-50/78"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{item.crop}</span>
                    <span>{item.yield_tons.toFixed(1)} t</span>
                  </div>
                  <p className="mt-2 text-cyan-50/62">
                    {item.country} · Biomass {item.biomass_index.toFixed(1)} · Fertility {item.soil_fertility_index.toFixed(1)} ({item.fertility_band})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-cyan-100/10 bg-cyan-100/5 p-6 text-sm leading-7 text-cyan-50/68">
          Click a map pointer to load its ocean information, climate signal, crop outlook, and trade insight.
        </div>
      )}
    </section>
  );
}

function riskLevel(score: number) {
  if (score >= 75) {
    return "High";
  }
  if (score >= 50) {
    return "Moderate";
  }
  return "Low";
}

function buildRiskCards(regionData: RegionResponse) {
  const tempDelta = Math.max(0, regionData.insights.temperature_vs_baseline);
  const fertility = regionData.insights.soil_fertility_average;
  const shippingText = regionData.trade.shipping_risk.toLowerCase();
  const weatherExposed = ["cyclone", "hurricane", "storm", "typhoon", "flood", "swell"].some((term) =>
    shippingText.includes(term),
  );
  const scores = [
    {
      label: "Warming",
      score: Math.min(95, Math.round(42 + tempDelta * 24)),
      evidence: `${regionData.insights.temperature_vs_baseline.toFixed(1)} C versus baseline`,
    },
    {
      label: "Pollution",
      score: Math.min(88, Math.round(34 + (100 - fertility) * 0.32 + regionData.agriculture.length * 2)),
      evidence: `fertility proxy at ${fertility.toFixed(1)}/100`,
    },
    {
      label: "Biodiversity",
      score: Math.min(92, Math.round(38 + tempDelta * 16 + (100 - fertility) * 0.22)),
      evidence: `${regionData.ocean.region} habitat stress proxy`,
    },
    {
      label: "Shipping",
      score: Math.min(94, Math.round(40 + (weatherExposed ? 18 : 6) + tempDelta * 9)),
      evidence: regionData.trade.shipping_risk,
    },
  ];

  return scores.map((item) => ({ ...item, level: riskLevel(item.score) }));
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card rounded-[22px] p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/52">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function InsightCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-cyan-100/10 bg-slate-950/25 p-4">
      <p className="text-sm text-cyan-50/68">{title}</p>
      <p className="mt-2 text-sm leading-7 text-white">{value}</p>
    </div>
  );
}

function NarrativeBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-cyan-50/78">{text}</p>
    </div>
  );
}
