"use client";

import { startTransition, useMemo, useState } from "react";

import useSWR from "swr";

import { ChatPanel } from "@/components/chat-panel";
import { DataPanel } from "@/components/data-panel";
import { MapCanvas } from "@/components/map-canvas";
import { TimeSlider } from "@/components/time-slider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getJson, postJson } from "@/lib/api";
import type { AnalyticsResponse, AskResponse, MapResponse, RegionResponse } from "@/lib/types";


const NAV_ITEMS = ["Map", "AI", "Data", "Trends", "Trade", "Links"];


export function AquaSphereApp() {
  const [year, setYear] = useState(2020);
  const [selectedRegion, setSelectedRegion] = useState<string>("India");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const debouncedYear = useDebouncedValue(year, 180);

  const { data: mapData } = useSWR<MapResponse>(
    `/map-data?year=${debouncedYear}`,
    getJson,
    { revalidateOnFocus: false },
  );

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

  const selectedMapPoint = useMemo(
    () => mapData?.agriculture.find((item) => item.country === selectedRegion) ?? null,
    [mapData, selectedRegion],
  );

  async function handleChatSubmit(question: string) {
    setChatBusy(true);
    setChatError(null);
    try {
      const result = await postJson<AskResponse>("/ask", {
        question,
        region: selectedRegion,
        year: debouncedYear,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI request failed.";
      setChatError(message);
      throw error;
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1580px] flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
      <header className="glass-panel rounded-[28px] px-5 py-4 shadow-glow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-200/10 text-lg font-semibold">
              AS
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-100/55">AquaSphere</p>
              <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">
                Where Oceans Meet Agriculture Intelligence
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="aurora-pill flex items-center gap-3 rounded-full px-4 py-2 text-sm text-cyan-50/80">
              <span className="status-dot bg-emerald-300 text-emerald-300" />
              Live generative AI + map insights
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-cyan-100/10 bg-white/5 px-4 py-2 text-sm text-cyan-50/75">
                Search oceans, crops, regions
              </div>
              <div className="rounded-full border border-cyan-100/10 bg-white/5 px-3 py-2 text-sm">Theme</div>
              <div className="rounded-full border border-cyan-100/10 bg-white/5 px-3 py-2 text-sm">Profile</div>
            </div>
          </div>
        </div>
      </header>

      <section className="hero-grid glass-panel relative overflow-hidden rounded-[34px] px-6 py-8 shadow-glow md:px-8 md:py-10">
        <div className="ocean-ring left-[-6%] top-[-22%] h-64 w-64" />
        <div className="ocean-ring right-[-4%] top-[18%] h-80 w-80" />
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.9fr]">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-100/55">Immersive Ocean Experience</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">
              A cinematic ocean dashboard for climate, trade, and AI exploration.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-cyan-50/72 md:text-lg">
              Explore 3D-inspired waters, click live ocean pointers, inspect regional crop resilience, and ask
              AquaSphere AI for grounded insights powered by your backend.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button className="sea-button rounded-full px-5 py-3 text-sm font-semibold">Explore Map</button>
              <button className="sea-button-secondary rounded-full px-5 py-3 text-sm font-semibold">Ask AI</button>
              <button className="sea-button-secondary rounded-full px-5 py-3 text-sm font-semibold">Analytics</button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HeroStat
              label="Ocean Temp"
              value={regionData ? `${regionData.ocean.temperature.toFixed(1)} C` : "--"}
              hint={selectedMapPoint?.ocean_region ?? "Awaiting region"}
            />
            <HeroStat
              label="Crop Yield"
              value={selectedMapPoint ? `${selectedMapPoint.yield_tons.toFixed(1)} t` : "--"}
              hint={selectedMapPoint?.crop ?? "No crop selected"}
            />
            <HeroStat
              label="Marine Health"
              value={analyticsData ? analyticsData.trend.signal : "Good"}
              hint="Derived from trend signal"
            />
            <HeroStat
              label="Trade Hub"
              value={regionData?.trade.hub ?? "--"}
              hint="Linked coastal corridor"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
        <aside className="glass-panel rounded-[30px] p-4 shadow-glow">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-cyan-100/55">Navigation</p>
          <div className="space-y-3">
            {NAV_ITEMS.map((item) => (
              <div key={item} className="nav-pill rounded-2xl px-4 py-3 text-sm text-cyan-50/78">
                {item}
              </div>
            ))}
          </div>
        </aside>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <TimeSlider year={year} onChange={setYear} />
            <MapCanvas
              data={mapData}
              onSelectRegion={(region) => startTransition(() => setSelectedRegion(region))}
              selectedRegion={selectedRegion}
            />
          </div>

          <div className="space-y-6">
            <DataPanel analytics={analyticsData} regionData={regionData} regionName={selectedRegion} />
            <ChatPanel
              busy={chatBusy}
              error={chatError}
              onSubmit={handleChatSubmit}
              regionName={selectedRegion}
            />
          </div>
        </section>
      </div>
    </div>
  );
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
