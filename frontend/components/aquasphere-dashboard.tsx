"use client";

import type { Route } from "next";
import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useSWR from "swr";

import { ChatPanel, type ChatOptions } from "@/components/chat-panel";
import { DataPanel } from "@/components/data-panel";
import { MapCanvas } from "@/components/map-canvas";
import { TimeSlider } from "@/components/time-slider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getJson, postJson, putJson } from "@/lib/api";
import type { AnalyticsResponse, AskResponse, ChatRecord, MapResponse, Profile, RegionResponse, SavedInsight } from "@/lib/types";


const NAV_ITEMS = [
  { key: "map", label: "Map", href: "/map" },
  { key: "ai", label: "AI", href: "/ai" },
  { key: "data", label: "Data", href: "/data" },
  { key: "trends", label: "Trends", href: "/trends" },
  { key: "trade", label: "Trade", href: "/trade" },
  { key: "links", label: "Links", href: "/links" },
];

const RESOURCE_LINKS = [
  { title: "NOAA Ocean Climate Data", href: "https://www.noaa.gov/" },
  { title: "FAO Statistics", href: "https://www.fao.org/faostat/" },
  { title: "Copernicus Marine", href: "https://marine.copernicus.eu/" },
  { title: "World Ocean Assessment", href: "https://www.un.org/regularprocess/" },
];

const PLANTATION_CATALOG: Record<string, string[]> = {
  India: ["Rice", "Wheat", "Tea", "Spices", "Sugarcane", "Cotton", "Pulses"],
  "United States": ["Corn", "Soybeans", "Wheat", "Cotton", "Almonds", "Grapes", "Rice"],
  Brazil: ["Soybeans", "Sugarcane", "Coffee", "Cocoa", "Corn", "Cotton", "Orange"],
  Australia: ["Wheat", "Barley", "Canola", "Sugarcane", "Grapes", "Cotton", "Almonds"],
  Indonesia: ["Palm Oil", "Rice", "Coffee", "Seaweed", "Cocoa", "Rubber", "Spices"],
  Japan: ["Rice", "Tea", "Vegetables", "Premium fruit", "Soybeans", "Barley"],
  "South Africa": ["Maize", "Citrus", "Grapes", "Sugarcane", "Wheat", "Apples"],
  Canada: ["Wheat", "Canola", "Potatoes", "Barley", "Soybeans", "Pulses"],
  Mexico: ["Maize", "Sugarcane", "Avocado", "Coffee", "Tomato", "Citrus", "Beans"],
  Spain: ["Olives", "Citrus", "Wheat", "Grapes", "Almonds", "Vegetables"],
  Nigeria: ["Cassava", "Cocoa", "Maize", "Oil palm", "Rice", "Yam", "Sorghum"],
  Thailand: ["Rice", "Cassava", "Sugarcane", "Rubber", "Palm Oil", "Tropical fruit"],
};

const COUNTRY_PRACTICE_CATALOG: Record<string, { diseases: string[]; practices: string[]; water: string }> = {
  India: {
    diseases: ["Rice blast", "Wheat rust", "Bacterial blight", "Sugarcane red rot", "Cotton bollworm"],
    practices: ["Monsoon planning", "drip irrigation", "crop rotation", "seed treatment", "integrated pest management"],
    water: "Monsoon variability, groundwater depletion, floods, drought, and salinity in irrigated belts.",
  },
  "United States": {
    diseases: ["Corn leaf blight", "Soybean rust", "Wheat rust", "Cotton root rot", "Grape powdery mildew"],
    practices: ["precision farming", "crop insurance", "conservation tillage", "irrigation scheduling", "pest scouting"],
    water: "Drought in western states, aquifer pressure, flood risk in river basins, and irrigation demand.",
  },
  Brazil: {
    diseases: ["Soybean rust", "Coffee leaf rust", "Cocoa witches' broom", "Nematodes", "Citrus greening"],
    practices: ["lime correction for Cerrado soils", "no-till farming", "disease-resistant cultivars", "watershed protection", "port-season planning"],
    water: "Rainfall volatility, drought pockets, flood pulses, and watershed pressure from land conversion.",
  },
  Australia: {
    diseases: ["Wheat rusts", "Crown rot", "Canola blackleg", "Root diseases", "Grape downy mildew"],
    practices: ["dryland farming", "salinity management", "rotational grazing", "drought-tolerant varieties", "biosecurity monitoring"],
    water: "Drought, irregular rainfall, groundwater limits, river-basin stress, and irrigation salinity.",
  },
  Indonesia: {
    diseases: ["Rice blast", "Palm oil basal stem rot", "Coffee rust", "Cocoa pod borer", "Rubber leaf fall"],
    practices: ["agroforestry", "terracing", "water control in rice fields", "shade management", "integrated pest management"],
    water: "Monsoon rainfall, peatland drainage, flooding, coastal salinity, and warm-pool climate variability.",
  },
  Japan: {
    diseases: ["Rice blast", "Bacterial leaf blight", "Tea anthracnose", "Fruit scab", "Vegetable mildew"],
    practices: ["precision irrigation", "greenhouse control", "seedling protection", "terraced rice systems", "typhoon preparedness"],
    water: "Typhoon rainfall, river flooding, humid summers, and coastal storm exposure.",
  },
  "South Africa": {
    diseases: ["Maize streak virus", "Citrus black spot", "Grape downy mildew", "Sugarcane smut", "Wheat rust"],
    practices: ["drought planning", "mulching", "drip irrigation", "disease surveillance", "soil moisture conservation"],
    water: "Drought, uneven rainfall, reservoir stress, and irrigation pressure.",
  },
  Canada: {
    diseases: ["Wheat rust", "Canola blackleg", "Potato late blight", "Fusarium head blight", "Soybean cyst nematode"],
    practices: ["short-season cultivars", "crop rotation", "soil conservation", "cold-chain storage", "field scouting"],
    water: "Spring floods, prairie drought, snowmelt timing, and wet harvest years.",
  },
  Mexico: {
    diseases: ["Maize tar spot", "Avocado root rot", "Coffee rust", "Sugarcane smut", "Citrus greening"],
    practices: ["irrigation efficiency", "shade coffee systems", "hurricane preparedness", "soil erosion control", "orchard sanitation"],
    water: "Drought, aquifer stress, irrigation demand, and hurricane-linked flooding.",
  },
  Spain: {
    diseases: ["Olive verticillium wilt", "Citrus greening risk", "Grape powdery mildew", "Wheat rust", "Almond fungal diseases"],
    practices: ["deficit irrigation", "olive grove soil cover", "drought-tolerant varieties", "pest monitoring", "water reuse"],
    water: "Mediterranean drought, heatwaves, reservoir pressure, and irrigation limits.",
  },
  Nigeria: {
    diseases: ["Cassava mosaic disease", "Cocoa black pod", "Maize streak", "Rice blast", "Oil palm bud rot"],
    practices: ["resistant varieties", "flood-aware planting", "agroforestry", "storage improvement", "field sanitation"],
    water: "Flooding, rainfall variability, erosion, and irrigation gaps.",
  },
  Thailand: {
    diseases: ["Rice blast", "Cassava mosaic disease", "Sugarcane white leaf", "Rubber leaf fall", "Fruit anthracnose"],
    practices: ["paddy water control", "flood adaptation", "crop rotation", "disease-free planting material", "monsoon timing"],
    water: "Monsoon swings, flood exposure, drought periods, and irrigation scheduling.",
  },
};

const TRADE_HISTORY = [
  {
    year: 1000,
    era: "Early maritime exchange",
    summary: "Regional coastal trade moved spices, grains, timber, and textiles through monsoon and ocean-current knowledge.",
  },
  {
    year: 1400,
    era: "Ocean route expansion",
    summary: "Long-distance sailing networks became more important, linking ports, crops, and coastal markets across oceans.",
  },
  {
    year: 1600,
    era: "Plantation trade age",
    summary: "Sugar, spices, coffee, cotton, and plantation commodities became tied to ports, ships, land use, and colonial trade systems.",
  },
  {
    year: 1800,
    era: "Industrial shipping",
    summary: "Steamships, railways, and larger ports connected inland farms to global commodity markets more quickly.",
  },
  {
    year: 1950,
    era: "Modern commodity chains",
    summary: "Cold chains, bulk carriers, fertilizers, irrigation, and mechanized farming changed how crops moved from fields to ports.",
  },
  {
    year: 2000,
    era: "Globalized logistics",
    summary: "Container shipping and global demand made port congestion, fuel prices, weather, and export timing central trade risks.",
  },
  {
    year: 2026,
    era: "Climate-smart trade intelligence",
    summary: "Ocean warming, water stress, plant disease, crop yield, and shipping disruption must be monitored together.",
  },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>) {
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDoc(filename: string, title: string, intro: string, rows: Array<{ label: string; value: string }>) {
  const content = rows
    .map((row) => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`)
    .join("");
  const html = `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #10202f; padding: 28px; }
          h1 { margin: 0 0 8px; }
          p { color: #425466; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th, td { border: 1px solid #d8e2ea; padding: 10px; text-align: left; vertical-align: top; }
          th { width: 28%; background: #edf7fb; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(intro)}</p>
        <table>${content}</table>
      </body>
    </html>
  `;
  const url = URL.createObjectURL(new Blob([html], { type: "application/msword;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}


export function AquaSphereDashboard({ activeSection }: { activeSection: string }) {
  const [year, setYear] = useState(2020);
  const [selectedRegion, setSelectedRegion] = useState<string>("India");
  const [aiRegionEnabled, setAiRegionEnabled] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const debouncedYear = useDebouncedValue(year, 180);

  useEffect(() => {
    const stored = localStorage.getItem("aquasphere-profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Profile;
        setProfile(parsed);
        const persistedRegion = localStorage.getItem("aquasphere-selected-region");
        if (persistedRegion) {
          setSelectedRegion(persistedRegion);
          setAiRegionEnabled(true);
        } else if (parsed.favorite_region) {
          setSelectedRegion(parsed.favorite_region);
        }
      } catch {}
    } else {
      const persistedRegion = localStorage.getItem("aquasphere-selected-region");
      if (persistedRegion) {
        setSelectedRegion(persistedRegion);
        setAiRegionEnabled(true);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("aquasphere-selected-region", selectedRegion);
  }, [selectedRegion]);

  const { data: mapData } = useSWR<MapResponse>(`/map-data?year=${debouncedYear}`, getJson, {
    revalidateOnFocus: false,
  });
  const { data: regionData } = useSWR<RegionResponse>(
    `/region/${encodeURIComponent(selectedRegion)}?year=${debouncedYear}`,
    getJson,
    { revalidateOnFocus: false },
  );
  const { data: analyticsData } = useSWR<AnalyticsResponse>(
    `/analytics/${encodeURIComponent(selectedRegion)}?years=10`,
    getJson,
    { revalidateOnFocus: false },
  );
  const { data: savedChats, mutate: refreshChats } = useSWR<ChatRecord[]>(
    profile ? `/chat/${profile.id}` : null,
    getJson,
    { revalidateOnFocus: false },
  );
  const { data: savedInsights, mutate: refreshInsights } = useSWR<SavedInsight[]>(
    profile ? `/insights/${profile.id}` : null,
    getJson,
    { revalidateOnFocus: false },
  );

  const selectedMapPoint = useMemo(
    () => mapData?.agriculture.find((item) => item.country === selectedRegion) ?? null,
    [mapData, selectedRegion],
  );

  async function handleChatSubmit(question: string, options: ChatOptions) {
    setChatBusy(true);
    setChatError(null);
    try {
      const result = await postJson<AskResponse>("/ask", {
        question,
        region: aiRegionEnabled ? selectedRegion : null,
        year: debouncedYear,
        user_id: profile?.id ?? null,
        explanation_mode: options.explanationMode,
        compare_regions: false,
      });
      if (profile) {
        void refreshChats();
      }
      return result;
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "AI request failed.");
      throw error;
    } finally {
      setChatBusy(false);
    }
  }

  async function saveCurrentInsight() {
    if (!profile || !regionData) {
      setSaveMessage("Login first to save insights.");
      return;
    }
    const title = `${selectedRegion} insight ${debouncedYear}`;
    const summary = `${regionData.insights.summary} Trade focus: ${regionData.trade.export_focus}.`;
    await postJson<SavedInsight>("/insights", {
      user_id: profile.id,
      title,
      summary,
      region: selectedRegion,
      year: debouncedYear,
    });
    setSaveMessage("Insight saved to your SQLite profile.");
    void refreshInsights();
  }

  async function updateProfile(partial: Partial<Profile>) {
    if (!profile) {
      return;
    }
    const updated = await putJson<Profile>(`/profile/${profile.id}`, partial);
    localStorage.setItem("aquasphere-profile", JSON.stringify(updated));
    setProfile(updated);
    if (partial.favorite_region) {
      setSelectedRegion(partial.favorite_region);
      localStorage.setItem("aquasphere-selected-region", partial.favorite_region);
      setAiRegionEnabled(true);
    }
    setSaveMessage("Profile updated.");
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1580px] flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
      <header className="glass-panel rounded-[28px] px-5 py-4 shadow-glow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-200/10 text-lg font-semibold" href={"/map" as Route}>
              AS
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-100/55">AquaSphere</p>
              <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">
                Ocean-climate-agriculture intelligence system
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Link className="aurora-pill flex items-center gap-3 rounded-full px-4 py-2 text-sm text-cyan-50/80" href={"/ai" as Route}>
              <span className="status-dot bg-emerald-300 text-emerald-300" />
              Live generative AI + map insights
            </Link>
            <div className="flex items-center gap-2">
              <Link className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/75" href={"/map" as Route}>
                Search oceans, crops, regions
              </Link>
              <Link className="rounded-full border border-cyan-100/10 bg-white/5 px-3 py-2 text-sm" href={"/profile" as Route}>
                Theme
              </Link>
              <Link className="rounded-full border border-cyan-100/10 bg-white/5 px-3 py-2 text-sm" href={"/profile" as Route}>
                Profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="hero-grid glass-panel relative overflow-hidden rounded-[34px] px-6 py-8 shadow-glow md:px-8 md:py-10">
        <div className="ocean-ring left-[-6%] top-[-22%] h-64 w-64" />
        <div className="ocean-ring right-[-4%] top-[18%] h-80 w-80" />
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.9fr]">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-100/55">Project Vision</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">
              A living world map for ocean heat, crop resilience, trade risk, and grounded AI insight.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-cyan-50/72 md:text-lg">
              Inspired by your project idea, this dashboard connects climate, agriculture, marine health, and trade
              through a single glassmorphism workspace with aurora lighting.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HeroStat label="Ocean Temp" value={regionData ? `${regionData.ocean.temperature.toFixed(1)} C` : "--"} hint={selectedMapPoint?.ocean_region ?? "Awaiting region"} />
            <HeroStat label="Crop Yield" value={selectedMapPoint ? `${selectedMapPoint.yield_tons.toFixed(1)} t` : "--"} hint={selectedMapPoint?.crop ?? "No crop selected"} />
            <HeroStat label="Trade Hub" value={regionData?.trade.hub ?? "--"} hint="Maritime corridor" />
            <HeroStat label="Profile" value={profile?.full_name ?? "Guest"} hint={profile ? profile.organization : "Login to persist chats"} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
        <aside className="glass-panel rounded-[30px] p-4 shadow-glow">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-cyan-100/55">Navigation</p>
          <div className="space-y-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                className={`nav-pill block rounded-2xl px-4 py-3 text-sm text-cyan-50/78 ${activeSection === item.key ? "border-orange-300/40 bg-orange-300/10 text-white" : ""}`}
                href={item.href as Route}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 rounded-[22px] border border-cyan-100/10 bg-slate-950/25 p-4">
            <p className="text-sm font-semibold text-white">{profile ? profile.full_name : "Guest mode"}</p>
            <p className="mt-2 text-sm leading-7 text-cyan-50/70">
              {profile ? `Theme ${profile.theme}, favorite region ${profile.favorite_region}.` : "Login to save profile, chats, and insights in SQLite."}
            </p>
            <Link className="mt-3 inline-block rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm" href={(profile ? "/profile" : "/login") as Route}>
              {profile ? "Open profile" : "Go to login"}
            </Link>
          </div>
        </aside>

        <section className="space-y-6">
          <TimeSlider year={year} onChange={setYear} />
          {renderSection({
            activeSection,
            analyticsData,
            chatBusy,
            chatError,
            handleChatSubmit,
            mapData,
            profile,
            regionData,
            saveCurrentInsight,
            saveMessage,
            savedChats,
            savedInsights,
            selectedRegion,
            aiRegionEnabled,
            setAiRegionEnabled,
            setSelectedRegion,
            updateProfile,
          })}
        </section>
      </div>
    </div>
  );
}


function renderSection(args: {
  activeSection: string;
  analyticsData?: AnalyticsResponse;
  chatBusy: boolean;
  chatError: string | null;
  handleChatSubmit: (question: string, options: ChatOptions) => Promise<AskResponse>;
  mapData?: MapResponse;
  profile: Profile | null;
  regionData?: RegionResponse;
  saveCurrentInsight: () => Promise<void>;
  saveMessage: string | null;
  savedChats?: ChatRecord[];
  savedInsights?: SavedInsight[];
  selectedRegion: string;
  aiRegionEnabled: boolean;
  setAiRegionEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedRegion: React.Dispatch<React.SetStateAction<string>>;
  updateProfile: (partial: Partial<Profile>) => Promise<void>;
}) {
  const commonMap = (
    <MapCanvas
      data={args.mapData}
      onSelectRegion={(region) =>
        startTransition(() => {
          args.setSelectedRegion(region);
          args.setAiRegionEnabled(true);
        })
      }
      selectedRegion={args.selectedRegion}
    />
  );

  switch (args.activeSection) {
    case "map":
      return (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">{commonMap}</div>
          <div className="space-y-6">
            <DataPanel analytics={args.analyticsData} regionData={args.regionData} regionName={args.selectedRegion} />
          </div>
        </div>
      );
    case "ai":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <ChatPanel
            busy={args.chatBusy}
            error={args.chatError}
            onSubmit={args.handleChatSubmit}
            onClearRegionContext={() => args.setAiRegionEnabled(false)}
            regionName={args.aiRegionEnabled ? args.selectedRegion : null}
          />
          <InfoListCard
            title="Saved Chats"
            items={(args.savedChats ?? []).map((item) => `${item.question} (${Math.round(item.confidence * 100)}%)`)}
            empty="Login and ask questions to store SQLite chat history."
          />
        </div>
      );
    case "data":
      return (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <DataExplorer data={args.mapData} selectedRegion={args.selectedRegion} />
          </div>
          <ActionCard
            description="Save the current region insight into your local profile database."
            onClick={args.saveCurrentInsight}
            title="Save Insight"
            note={args.saveMessage}
          />
        </div>
      );
    case "trends":
      return (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <TrendsWorkspace
            analytics={args.analyticsData}
            onSelectRegion={(region) => {
              args.setSelectedRegion(region);
              args.setAiRegionEnabled(true);
            }}
            regionData={args.regionData}
            regionOptions={(args.mapData?.agriculture ?? []).map((item) => item.country)}
            selectedRegion={args.selectedRegion}
          />
          <NarrativeCard
            title="Trend Engine"
            lines={[
              `Selected region: ${args.selectedRegion}`,
              `Signal: ${args.analyticsData?.trend.signal ?? "loading"}`,
              `Correlation: ${args.analyticsData?.correlation.percent.toFixed(1) ?? "--"}%`,
              "Use this page to explain ocean warming, crop stress, and trade knock-on effects in one story.",
            ]}
          />
        </div>
      );
    case "trade":
      return (
        <TradeWorkspace
          mapData={args.mapData}
          onSelectRegion={(region) =>
            startTransition(() => {
              args.setSelectedRegion(region);
              args.setAiRegionEnabled(true);
            })
          }
          regionData={args.regionData}
          selectedRegion={args.selectedRegion}
        />
      );
    case "links":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <InfoListCard
            title="Research Links"
            items={RESOURCE_LINKS.map((item) => `${item.title} - ${item.href}`)}
            empty="No links configured."
          />
          <NarrativeCard
            title="Project Sources"
            lines={[
              "NOAA, FAO, Copernicus Marine, and UN assessments inspired the multi-source AquaSphere design.",
              "This page gives you direct inspiration links and source targets for future data upgrades.",
            ]}
          />
        </div>
      );
    case "profile":
      return (
        <ProfileWorkspace profile={args.profile} savedChats={args.savedChats} savedInsights={args.savedInsights} updateProfile={args.updateProfile} />
      );
    default:
      return commonMap;
  }
}


function HeroStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="metric-card rounded-[26px] p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/52">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-cyan-50/70">{hint}</p>
    </div>
  );
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


function InfoListCard({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-glow">
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => <div key={item} className="rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4 text-sm text-cyan-50/78">{item}</div>) : <div className="rounded-[20px] border border-dashed border-cyan-100/10 bg-slate-950/25 p-4 text-sm text-cyan-50/68">{empty}</div>}
      </div>
    </section>
  );
}


function NarrativeCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-glow">
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {lines.map((line) => (
          <div key={line} className="rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4 text-sm leading-7 text-cyan-50/78">
            {line}
          </div>
        ))}
      </div>
    </section>
  );
}


function ActionCard({
  title,
  description,
  note,
  onClick,
}: {
  title: string;
  description: string;
  note: string | null;
  onClick: () => Promise<void>;
}) {
  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-glow">
      <h3 className="text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-cyan-50/72">{description}</p>
      <button className="sea-button mt-5 rounded-full px-5 py-3 text-sm font-semibold" onClick={() => void onClick()} type="button">
        Save to SQLite
      </button>
      {note ? <p className="mt-4 text-sm text-cyan-50/76">{note}</p> : null}
    </section>
  );
}


function ProfileWorkspace({
  profile,
  savedChats,
  savedInsights,
  updateProfile,
}: {
  profile: Profile | null;
  savedChats?: ChatRecord[];
  savedInsights?: SavedInsight[];
  updateProfile: (partial: Partial<Profile>) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [organization, setOrganization] = useState(profile?.organization ?? "");
  const [favoriteRegion, setFavoriteRegion] = useState(profile?.favorite_region ?? "Indian Ocean");
  const [theme, setTheme] = useState(profile?.theme ?? "aurora");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setOrganization(profile?.organization ?? "");
    setFavoriteRegion(profile?.favorite_region ?? "Indian Ocean");
    setTheme(profile?.theme ?? "aurora");
  }, [profile]);

  if (!profile) {
    return <InfoListCard title="Profile" items={[]} empty="Login first to access your SQLite-backed profile and saved AI memory." />;
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6 shadow-glow">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">Profile</p>
            <h3 className="text-3xl font-semibold text-white">{profile.full_name}</h3>
            <p className="text-sm leading-7 text-cyan-50/72">
              SQLite-backed account for saved chats, saved insights, preferred region, and interface theme.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Organization" value={profile.organization || "Not set"} />
              <StatCard label="Favorite Region" value={profile.favorite_region || "Not set"} />
              <StatCard label="Theme" value={profile.theme || "aurora"} />
              <StatCard label="Saved Chats" value={String(savedChats?.length ?? 0)} />
            </div>
          </div>

          <div className="rounded-[26px] border border-cyan-100/10 bg-slate-950/25 p-5">
            <h4 className="text-xl font-semibold text-white">Edit Settings</h4>
            <div className="mt-4 space-y-4">
              <ProfileField label="Full name" value={fullName} onChange={setFullName} />
              <ProfileField label="Organization" value={organization} onChange={setOrganization} />
              <ProfileField label="Favorite region" value={favoriteRegion} onChange={setFavoriteRegion} />
              <ProfileField label="Theme" value={theme} onChange={setTheme} />
              <button
                className="sea-button rounded-full px-5 py-3 text-sm font-semibold"
                onClick={() => void updateProfile({ full_name: fullName, organization, favorite_region: favoriteRegion, theme })}
                type="button"
              >
                Save profile
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="glass-panel rounded-[30px] p-5 shadow-glow">
          <h3 className="text-2xl font-semibold text-white">Saved Insights</h3>
          <div className="mt-4 space-y-3">
            {(savedInsights ?? []).length ? (
              (savedInsights ?? []).map((item) => (
                <div key={item.id} className="rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-cyan-50/76">{item.summary}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-100/48">
                    {item.region} · {item.year}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-cyan-100/10 bg-slate-950/25 p-4 text-sm text-cyan-50/68">
                No saved insights yet.
              </div>
            )}
          </div>
        </section>

        <section className="glass-panel rounded-[30px] p-5 shadow-glow">
          <h3 className="text-2xl font-semibold text-white">Recent Chats</h3>
          <div className="mt-4 space-y-3">
            {(savedChats ?? []).length ? (
              (savedChats ?? []).map((item) => (
                <div key={item.id} className="rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4">
                  <p className="text-sm font-semibold text-white">{item.question}</p>
                  <p className="mt-2 text-sm leading-7 text-cyan-50/76">{item.answer.slice(0, 180)}...</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-100/48">
                    {Math.round(item.confidence * 100)}% confidence
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-cyan-100/10 bg-slate-950/25 p-4 text-sm text-cyan-50/68">
                No saved chats yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


function ProfileField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-cyan-50/72">{label}</span>
      <input
        className="w-full rounded-[20px] border border-cyan-100/10 bg-slate-950/35 px-4 py-3 text-white outline-none focus:border-cyan-300/35"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TradeWorkspace({
  mapData,
  onSelectRegion,
  regionData,
  selectedRegion,
}: {
  mapData?: MapResponse;
  onSelectRegion: (region: string) => void;
  regionData?: RegionResponse;
  selectedRegion: string;
}) {
  const [historyYear, setHistoryYear] = useState(2026);
  const selectedPoint = mapData?.agriculture.find((item) => item.country === selectedRegion);
  const plantations = PLANTATION_CATALOG[selectedRegion] ?? [selectedPoint?.crop ?? "Regional crops"];
  const tradeRows = mapData?.agriculture ?? [];
  const exportFocus = regionData?.trade.export_focus ?? plantations.join(", ");
  const shippingRisk = regionData?.trade.shipping_risk ?? "Select a country to load route risk.";
  const portHub = regionData?.trade.hub ?? selectedPoint?.trade_hub ?? "No hub selected";
  const routeSummary = `${selectedRegion} exports ${exportFocus} through ${portHub}. Climate stress matters because harvest timing, inland movement, port loading, and ocean-route reliability all need to line up.`;
  const historyPoint = getTradeHistoryPoint(historyYear);
  const historySummary = buildTradeHistorySummary(historyYear, selectedRegion, plantations, portHub, exportFocus, shippingRisk);

  function exportTradeCsv() {
    downloadCsv(
      `aquasphere-trade-${selectedRegion}.csv`,
      ["Country", "Ocean Region", "Trade Hub", "Export Focus", "Shipping Risk", "Plantations"],
      tradeRows.map((row) => [
        row.country,
        row.ocean_region,
        row.trade_hub,
        row.country === selectedRegion ? exportFocus : row.crop,
        row.country === selectedRegion ? shippingRisk : row.insight,
        (PLANTATION_CATALOG[row.country] ?? [row.crop]).join(", "),
      ]),
    );
  }

  function exportTradeDoc() {
    downloadDoc(`aquasphere-trade-${selectedRegion}.doc`, `AquaSphere Trade Brief - ${selectedRegion}`, "Route, port, commodity, and disruption-risk summary for the selected country.", [
      { label: "Selected Country", value: selectedRegion },
      { label: "Ocean Region", value: regionData?.ocean.region ?? selectedPoint?.ocean_region ?? "--" },
      { label: "Main Ports", value: portHub },
      { label: "Export Commodities", value: exportFocus },
      { label: "Plantations", value: plantations.join(", ") },
      { label: "Shipping Risk", value: shippingRisk },
      { label: "AI Trade Brief", value: routeSummary },
      { label: "Trade History Year", value: String(historyYear) },
      { label: "Historical AI Summary", value: historySummary },
      { label: "Scenario", value: "If climate stress increases, the first visible effect is often timing: delayed harvest, slower inland transport, port congestion, and less reliable export windows." },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <MapCanvas data={mapData} mode="trade" onSelectRegion={onSelectRegion} selectedRegion={selectedRegion} />
        <section className="glass-panel rounded-[30px] p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">Trade Command</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{selectedRegion} export route intelligence</h3>
          <p className="mt-3 text-sm leading-7 text-cyan-50/72">
            This page connects country crops, ports, ocean corridors, and disruption risk into one trade story.
          </p>

          <div className="mt-5 grid gap-3">
            <InsightCard title="Main ports" value={portHub} />
            <InsightCard title="Export focus" value={exportFocus} />
            <InsightCard title="Shipping risk" value={shippingRisk} />
            <InsightCard title="Plantations" value={plantations.join(", ")} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/78" onClick={exportTradeCsv} type="button">
              Export Trade CSV
            </button>
            <button className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/78" onClick={exportTradeDoc} type="button">
              Export Trade DOC
            </button>
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-[30px] p-5 shadow-glow">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">AI Trade Brief</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">What the route means</h3>
            <p className="mt-3 text-sm leading-7 text-cyan-50/74">{routeSummary}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard label="Route Watch" value={/cyclone|hurricane|storm|typhoon|flood|swell|rain/i.test(shippingRisk) ? "Weather" : "Operations"} />
            <StatCard label="Export Window" value="Seasonal" />
            <StatCard label="Action" value="Monitor" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <InsightCard title="If weather worsens" value="Harvest and inland transport can slow before cargo reaches the port." />
          <InsightCard title="If port congestion rises" value="Shipments can miss export windows even when crop production is strong." />
          <InsightCard title="What to track" value="Rainfall, port queues, crop yield trend, and shipping route warnings." />
        </div>
      </section>

      <section className="glass-panel rounded-[30px] p-5 shadow-glow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">Trade History Playback</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">1000 to 2026 trade evolution</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-cyan-50/72">
              This is historical interpretation, separate from the modern climate dataset. It explains how ocean routes,
              plantations, ports, and climate risk evolved into today's trade intelligence.
            </p>
          </div>
          <div className="rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/55">Selected Year</p>
            <p className="mt-2 text-3xl font-semibold text-white">{historyYear}</p>
            <p className="mt-1 text-sm text-cyan-50/68">{historyPoint.era}</p>
          </div>
        </div>

        <input
          aria-label="Select trade history year"
          className="mt-5 h-2 w-full cursor-pointer accent-cyan-300"
          max={2026}
          min={1000}
          onChange={(event) => setHistoryYear(Number(event.target.value))}
          step={1}
          type="range"
          value={historyYear}
        />
        <div className="mt-2 flex justify-between text-xs text-cyan-100/50">
          <span>1000</span>
          <span>1400</span>
          <span>1600</span>
          <span>1800</span>
          <span>2000</span>
          <span>2026</span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <InsightCard title="Historical layer" value={historyPoint.summary} />
          <InsightCard title="AI-generated summary" value={historySummary} />
        </div>
      </section>
    </div>
  );
}

function getTradeHistoryPoint(year: number) {
  return TRADE_HISTORY.reduce((current, point) => (point.year <= year ? point : current), TRADE_HISTORY[0]);
}

function buildTradeHistorySummary(
  year: number,
  region: string,
  plantations: string[],
  portHub: string,
  exportFocus: string,
  shippingRisk: string,
) {
  if (year < 1400) {
    return `${year}: For ${region}, think of trade as coastal and regional exchange. Ocean knowledge mattered because seasonal winds, currents, and safe harbors decided whether crops and goods could move.`;
  }
  if (year < 1700) {
    return `${year}: Ocean routes expanded. Plantation crops such as ${plantations.slice(0, 3).join(", ")} became more connected to ports and long-distance markets.`;
  }
  if (year < 1900) {
    return `${year}: Plantation trade intensified. Soil quality, water access, labor systems, and port access shaped which crops became commercially important.`;
  }
  if (year < 2000) {
    return `${year}: Rail, roads, bulk shipping, irrigation, and fertilizers made exports more reliable, but drought and crop disease still affected supply.`;
  }
  if (year < 2020) {
    return `${year}: Global logistics connected ${region}'s ${exportFocus} to international demand through ${portHub}. Weather and port congestion became major risks.`;
  }
  return `${year}: Modern AquaSphere intelligence links ${region}'s plantations (${plantations.join(", ")}), water stress, plant disease, ocean climate, and shipping risk. Current trade warning: ${shippingRisk}`;
}


function DataExplorer({
  data,
  selectedRegion,
}: {
  data?: MapResponse;
  selectedRegion: string;
}) {
  const [query, setQuery] = useState("");
  const [cropFilter, setCropFilter] = useState("All");

  const rows = data?.agriculture_catalog ?? data?.agriculture ?? [];
  const crops = Array.from(new Set(rows.map((row) => row.crop))).sort();
  const countryCatalogue = Object.entries(PLANTATION_CATALOG).map(([country, plantations]) => ({
    country,
    plantations,
    ...(COUNTRY_PRACTICE_CATALOG[country] ?? {
      diseases: ["Regional fungal disease", "pest pressure", "root stress"],
      practices: ["crop rotation", "water management", "field monitoring"],
      water: "Local water stress depends on rainfall, irrigation, soil drainage, and coastal conditions.",
    }),
  }));
  const filtered = rows.filter((row) => {
    const matchesQuery =
      row.country.toLowerCase().includes(query.toLowerCase()) ||
      row.ocean_region.toLowerCase().includes(query.toLowerCase());
    const matchesCrop = cropFilter === "All" || row.crop === cropFilter;
    return matchesQuery && matchesCrop;
  });

  function exportCsv() {
    downloadCsv(
      `aquasphere-country-plantation-catalog.csv`,
      ["Country", "Plantations / Crops", "Disease and Pest Risks", "Practices Taken", "Water Stress"],
      countryCatalogue.map((item) => [
        item.country,
        item.plantations.join(", "),
        item.diseases.join(", "),
        item.practices.join(", "),
        item.water,
      ]),
    );
  }

  function exportDoc() {
    downloadDoc(
      `aquasphere-country-plantation-catalog.doc`,
      "AquaSphere Country Plantation and Plant Health Catalog",
      "Country-wise plantations, crop disease risk, water stress, and practices taken.",
      countryCatalogue.map((item) => ({
        label: item.country,
        value: `Plantations/crops: ${item.plantations.join(", ")}. Disease and pest risks: ${item.diseases.join(", ")}. Practices taken: ${item.practices.join(", ")}. Water stress: ${item.water}`,
      })),
    );
  }

  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-glow">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">Data Explorer</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Structured climate-agriculture table</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-[18px] border border-cyan-100/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search country or ocean region"
            value={query}
          />
          <select
            className="rounded-[18px] border border-cyan-100/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none"
            onChange={(event) => setCropFilter(event.target.value)}
            value={cropFilter}
          >
            <option value="All">All crops</option>
            {crops.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4">
        <p className="text-sm text-cyan-50/74">Export the country plantation, disease risk, and practice catalog.</p>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/78" onClick={exportCsv} type="button">
            Export CSV
          </button>
          <button className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/78" onClick={exportDoc} type="button">
            Export DOC
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-[20px] border border-cyan-100/10 bg-slate-950/25 p-4 text-sm text-cyan-50/72">
        Selected region: <span className="text-white">{selectedRegion}</span>. This page is for raw, filterable records.
      </div>

      <div className="mb-4 rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
          <p className="text-sm font-semibold text-white">Country plantation, disease risk and farming practice catalog</p>
          <p className="mt-2 text-sm leading-7 text-cyan-50/70">
            Country-wise view of plantations, pest/disease risk, water stress, and practices taken.
          </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {countryCatalogue.map((item) => (
            <div
              className={`rounded-[18px] border p-4 ${item.country === selectedRegion ? "border-orange-300/35 bg-orange-300/10" : "border-cyan-100/8 bg-slate-950/25"}`}
              key={item.country}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{item.country}</p>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-cyan-50/68">{item.plantations.length} crops</span>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cyan-100/50">Plantations / crops</p>
              <p className="mt-1 text-sm leading-6 text-cyan-50/78">{item.plantations.join(", ")}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cyan-100/50">Disease and pest risk</p>
              <p className="mt-1 text-sm leading-6 text-cyan-50/72">{item.diseases.join(", ")}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cyan-100/50">Practices taken</p>
              <p className="mt-1 text-sm leading-6 text-cyan-50/72">{item.practices.join(", ")}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cyan-100/50">Water stress</p>
              <p className="mt-1 text-sm leading-6 text-cyan-50/66">{item.water}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-cyan-100/10">
        <div className="grid grid-cols-[1.1fr_0.95fr_0.95fr_0.75fr_0.8fr_0.95fr_0.8fr] bg-slate-950/55 px-4 py-3 text-xs uppercase tracking-[0.24em] text-cyan-100/55">
          <span>Country</span>
          <span>Ocean</span>
          <span>Crop</span>
          <span>Yield</span>
          <span>Biomass</span>
          <span>Fertility</span>
          <span>Trade Hub</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {filtered.length ? (
            filtered.map((row) => (
              <div
                key={`${row.country}-${row.crop}-${row.year}`}
                className={`grid grid-cols-[1.1fr_0.95fr_0.95fr_0.75fr_0.8fr_0.95fr_0.8fr] px-4 py-3 text-sm text-cyan-50/78 ${row.country === selectedRegion ? "bg-orange-300/10 text-white" : "border-t border-cyan-100/5 bg-slate-950/20"}`}
              >
                <span>{row.country}</span>
                <span>{row.ocean_region}</span>
                <span>{row.crop}</span>
                <span>{row.yield_tons.toFixed(1)} t</span>
                <span>{row.biomass_index.toFixed(1)}</span>
                <span>{row.soil_fertility_index.toFixed(1)} ({row.fertility_band})</span>
                <span>{row.trade_hub}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-cyan-50/70">No rows match the current filters.</div>
          )}
        </div>
      </div>
    </section>
  );
}


function TrendsWorkspace({
  analytics,
  onSelectRegion,
  regionData,
  regionOptions,
  selectedRegion,
}: {
  analytics?: AnalyticsResponse;
  onSelectRegion: (region: string) => void;
  regionData?: RegionResponse;
  regionOptions: string[];
  selectedRegion: string;
}) {
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeline = regionData?.timeline ?? [];
  const currentPoint = timeline[timelineIndex] ?? timeline[0];

  useEffect(() => {
    setTimelineIndex(0);
    setIsPlaying(false);
  }, [selectedRegion]);

  useEffect(() => {
    if (!isPlaying || timeline.length < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setTimelineIndex((current) => (current + 1) % timeline.length);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [isPlaying, timeline.length]);

  const anomalyAlerts = buildAnomalyAlerts(analytics, regionData);

  function exportTrendsCsv() {
    if (!regionData) {
      return;
    }
    downloadCsv(
      `aquasphere-trends-${selectedRegion}.csv`,
      ["Year", "Ocean Temperature", "Crop Yield", "Summary"],
      regionData.timeline.map((point) => [
        point.year,
        point.temperature.toFixed(1),
        point.yield_tons.toFixed(1),
        studentTimelineSummary(point, regionData),
      ]),
    );
  }

  function exportTrendsDoc() {
    if (!regionData) {
      return;
    }
    downloadDoc(`aquasphere-trends-${selectedRegion}.doc`, `AquaSphere Trends - ${selectedRegion}`, "Ocean temperature, crop yield, and trend interpretation for the selected country.", [
      { label: "Region", value: selectedRegion },
      { label: "Signal", value: analytics?.trend.signal ?? "Loading" },
      { label: "Correlation", value: `${analytics?.correlation.percent.toFixed(1) ?? "--"}%` },
      { label: "Temperature Delta", value: `${analytics?.trend.temperature_delta.toFixed(1) ?? "--"} C` },
      { label: "Yield Delta", value: `${analytics?.trend.yield_delta.toFixed(1) ?? "--"} t` },
      { label: "Current Summary", value: currentPoint ? studentTimelineSummary(currentPoint, regionData) : "No timeline point selected." },
      { label: "Alerts", value: anomalyAlerts.map((alert) => `${alert.type}: ${alert.message}`).join(" | ") },
    ]);
  }

  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-glow">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">Trends</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h3 className="text-2xl font-semibold text-white">Time-based analysis for {selectedRegion}</h3>
          <label className="block text-sm text-cyan-50/72">
            <span className="mb-2 block">Region</span>
            <select
              className="min-w-52 rounded-[18px] border border-cyan-100/10 bg-slate-950/35 px-4 py-3 text-sm text-white outline-none"
              onChange={(event) => onSelectRegion(event.target.value)}
              value={selectedRegion}
            >
              {(regionOptions.length ? regionOptions : [selectedRegion]).map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/78" onClick={exportTrendsCsv} type="button">
            Export Trends CSV
          </button>
          <button className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/78" onClick={exportTrendsDoc} type="button">
            Export Trends DOC
          </button>
        </div>
      </div>

      {regionData ? (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Ocean temperature vs crop yield</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={regionData.timeline}>
                  <CartesianGrid stroke="rgba(157,231,255,0.08)" vertical={false} />
                  <XAxis dataKey="year" stroke="#7bb8cf" tick={{ fill: "#a8d7e5", fontSize: 12 }} />
                  <YAxis yAxisId="temp" stroke="#7bb8cf" tick={{ fill: "#a8d7e5", fontSize: 12 }} />
                  <YAxis yAxisId="yield" orientation="right" stroke="#7bb8cf" tick={{ fill: "#a8d7e5", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#061523", border: "1px solid rgba(157,231,255,0.12)" }} />
                  <Legend />
                  <Line yAxisId="temp" dataKey="temperature" name="Ocean Temp" stroke="#7dd0ff" strokeWidth={3} />
                  <Line yAxisId="yield" dataKey="yield_tons" name="Crop Yield" stroke="#ff9b6b" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Signal" value={analytics?.trend.signal ?? "--"} />
            <StatCard label="Yield Delta" value={`${analytics?.trend.yield_delta.toFixed(1) ?? "--"} t`} />
            <StatCard label="Temp Delta" value={`${analytics?.trend.temperature_delta.toFixed(1) ?? "--"} C`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InsightCard title="Temperature anomalies" value={`${analytics?.anomalies.temperature_anomalies.length ?? 0} flagged points`} />
            <InsightCard title="Yield anomalies" value={`${analytics?.anomalies.yield_anomalies.length ?? 0} flagged points`} />
          </div>
          <div className="rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">Timeline playback with AI summaries</p>
              <button
                className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/78"
                onClick={() => setIsPlaying((current) => !current)}
                type="button"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </div>
            {currentPoint ? (
              <div className="mt-4 rounded-[18px] border border-cyan-100/8 bg-slate-950/25 p-4">
                <p className="text-xl font-semibold text-white">{currentPoint.year}</p>
                <p className="mt-2 text-sm leading-7 text-cyan-50/76">
                  {studentTimelineSummary(currentPoint, regionData)}
                </p>
                <input
                  className="mt-4 w-full accent-cyan-300"
                  max={Math.max(0, timeline.length - 1)}
                  min={0}
                  onChange={(event) => setTimelineIndex(Number(event.target.value))}
                  type="range"
                  value={timelineIndex}
                />
              </div>
            ) : null}
          </div>
          <div className="rounded-[24px] border border-cyan-100/10 bg-slate-950/25 p-4">
            <p className="text-sm font-medium text-white">Anomaly alerts</p>
            <div className="mt-4 grid gap-3">
              {anomalyAlerts.map((alert) => (
                <div className="rounded-[18px] border border-orange-200/10 bg-orange-200/10 p-4 text-sm leading-7 text-cyan-50/76" key={alert.type}>
                  <span className="font-semibold text-white">{alert.type}</span> - {alert.level}: {alert.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-cyan-100/10 bg-slate-950/25 p-6 text-sm text-cyan-50/70">
          Select a region on the map page first.
        </div>
      )}
    </section>
  );
}

function studentTimelineSummary(point: { year: number; temperature: number; yield_tons: number }, regionData: RegionResponse) {
  const tempGap = point.temperature - regionData.ocean.baseline_temperature;
  const pressure = tempGap > 0.15 ? "warmer-than-usual ocean conditions" : "near-normal ocean conditions";
  const yieldSignal = point.yield_tons >= regionData.insights.yield_baseline ? "held up well" : "came under pressure";
  return `${point.year}: ${regionData.region} had ${pressure} at ${point.temperature.toFixed(1)} C, and crop output ${yieldSignal} at ${point.yield_tons.toFixed(1)} t.`;
}

function buildAnomalyAlerts(analytics?: AnalyticsResponse, regionData?: RegionResponse) {
  if (!analytics || !regionData) {
    return [];
  }
  const tempCount = analytics.anomalies.temperature_anomalies.length;
  const yieldCount = analytics.anomalies.yield_anomalies.length;
  const fertility = regionData.insights.soil_fertility_average;
  const shipping = regionData.trade.shipping_risk;
  return [
    {
      type: "temperature spike",
      level: tempCount ? "Alert" : "Watch",
      message: `${tempCount} flagged temperature point(s) in the timeline.`,
    },
    {
      type: "fertility stress",
      level: fertility < 58 || yieldCount ? "Alert" : "Watch",
      message: `Fertility is ${fertility.toFixed(1)}/100 with ${yieldCount} yield anomaly point(s).`,
    },
    {
      type: "trade disruption risk",
      level: /cyclone|hurricane|storm|typhoon|flood|swell/i.test(shipping) ? "Alert" : "Watch",
      message: shipping,
    },
  ];
}
