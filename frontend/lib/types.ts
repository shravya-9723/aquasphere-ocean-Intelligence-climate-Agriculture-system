export interface MapDatum {
  country: string;
  crop: string;
  yield_tons: number;
  ocean_region: string;
  latitude: number;
  longitude: number;
  year: number;
  trade_hub: string;
  insight: string;
  biomass_index: number;
  soil_fertility_index: number;
  fertility_band: string;
}

export interface OceanDatum {
  region: string;
  temperature: number;
  latitude: number;
  longitude: number;
  year: number;
}

export interface MapFeature {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    name: string;
    ocean_region: string;
    temperature: number;
    crop: string;
    yield_tons: number;
    year: number;
    insight: string;
  };
}

export interface MapResponse {
  year: number;
  geojson: {
    type: string;
    features: MapFeature[];
  };
  ocean: OceanDatum[];
  agriculture: MapDatum[];
  agriculture_catalog: MapDatum[];
}

export interface AnalyticsResponse {
  region: string;
  correlation: {
    value: number;
    percent: number;
    direction: string;
  };
  trend: {
    temperature_delta: number;
    yield_delta: number;
    signal: string;
  };
  anomalies: {
    temperature_anomalies: Array<Record<string, number | string>>;
    yield_anomalies: Array<Record<string, number | string>>;
  };
}

export interface RegionResponse {
  region: string;
  year: number;
  ocean: {
    region: string;
    temperature: number;
    recorded_at: string;
    baseline_temperature: number;
  };
  agriculture: Array<{
    country: string;
    crop: string;
    yield_tons: number;
    year: number;
    biomass_index: number;
    soil_fertility_index: number;
    fertility_band: string;
  }>;
  analytics: AnalyticsResponse;
  trade: {
    hub: string;
    export_focus: string;
    shipping_risk: string;
  };
  insights: {
    summary: string;
    yield_baseline: number;
    temperature_vs_baseline: number;
    biomass_total: number;
    soil_fertility_average: number;
  };
  timeline: Array<{
    year: number;
    temperature: number;
    yield_tons: number;
  }>;
}

export interface AskResponse {
  answer: string;
  sources: string[];
  confidence: number;
  chat_id?: number | null;
  summary: string;
  analysis: string;
  risks: string[];
  suggested_action: string;
  why_this_answer: string[];
  risk_cards: Array<{
    name: string;
    score: number;
    level: string;
    evidence: string;
  }>;
  region_comparison: Array<{
    region: string;
    ocean_region: string;
    temperature: number;
    yield_baseline: number;
    fertility: number;
    shipping_risk: string;
    top_risk: string;
  }>;
  timeline_summaries: Array<{
    year: number;
    summary: string;
  }>;
  anomaly_alerts: Array<{
    type: string;
    level: string;
    message: string;
  }>;
  explanation_mode: "student" | "researcher";
}

export interface Profile {
  id: number;
  email: string;
  full_name: string;
  organization: string;
  favorite_region: string;
  theme: string;
}

export interface ChatRecord {
  id: number;
  question: string;
  answer: string;
  region: string | null;
  year: number | null;
  confidence: number;
  created_at: string;
}

export interface SavedInsight {
  id: number;
  title: string;
  summary: string;
  region: string;
  year: number;
  created_at: string;
}
