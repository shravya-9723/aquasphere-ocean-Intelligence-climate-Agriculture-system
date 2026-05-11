"use client";

import { useMemo, useState } from "react";

import type { MapDatum, MapResponse } from "@/lib/types";


interface MapCanvasProps {
  data?: MapResponse;
  selectedRegion: string | null;
  onSelectRegion: (region: string) => void;
  mode?: "map" | "trade";
}

const TRADE_CONNECTIONS: [string, string, number][] = [
  ["India", "United States", 84],
  ["Brazil", "Japan", 76],
  ["Australia", "Indonesia", 58],
  ["South Africa", "India", 42],
];

const WORLD_MAP_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg";

const CONTINENT_SHAPES = [
  "M9 24 C14 14, 23 10, 31 15 C34 18, 34 25, 29 31 C24 35, 16 35, 11 30 C8 27, 8 26, 9 24 Z",
  "M30 34 C34 31, 39 31, 42 36 C43 42, 40 50, 35 57 C31 62, 28 58, 28 49 C28 43, 29 37, 30 34 Z",
  "M46 16 C53 11, 63 11, 72 15 C79 18, 86 25, 88 32 C88 39, 84 44, 77 45 C69 46, 64 43, 58 42 C55 47, 49 50, 45 47 C41 43, 41 35, 44 29 C44 24, 44 20, 46 16 Z",
  "M73 47 C78 45, 83 47, 86 52 C87 56, 83 60, 78 61 C73 60, 70 56, 71 52 C71 50, 72 48, 73 47 Z",
  "M83 55 C88 54, 93 58, 94 64 C93 69, 88 71, 83 69 C79 66, 79 60, 83 55 Z",
];


function getMarkerColor(point: MapDatum, selectedRegion: string | null) {
  if (point.country === selectedRegion) {
    return "#ff9b6b";
  }
  if (point.yield_tons >= 150) {
    return "#ff6d6d";
  }
  if (point.yield_tons >= 80) {
    return "#5ed4ff";
  }
  return "#6df0d7";
}

function projectPoint(latitude: number, longitude: number) {
  const x = ((longitude + 180) / 360) * 100;
  const y = ((90 - latitude) / 180) * 100;
  return { x, y };
}

function buildTradeRoute(source: MapDatum, target: MapDatum) {
  const start = projectPoint(source.latitude, source.longitude);
  const end = projectPoint(target.latitude, target.longitude);
  const cx = (start.x + end.x) / 2;
  const cy = Math.min(start.y, end.y) - 10;
  return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
}


export function MapCanvas({ data, selectedRegion, onSelectRegion, mode = "map" }: MapCanvasProps) {
  const [hovered, setHovered] = useState<MapDatum | null>(null);
  const points = data?.agriculture ?? [];

  const pointByCountry = useMemo(() => new Map(points.map((point) => [point.country, point])), [points]);
  const activePoint = selectedRegion ? pointByCountry.get(selectedRegion) ?? null : null;

  const tradeRoutes = useMemo(
    () =>
      TRADE_CONNECTIONS.map(([from, to, volume]) => {
        const source = pointByCountry.get(from);
        const target = pointByCountry.get(to);
        if (!source || !target) {
          return null;
        }
        return {
          id: `${from}-${to}`,
          path: buildTradeRoute(source, target),
          volume,
        };
      }).filter(Boolean) as Array<{ id: string; path: string; volume: number }>,
    [pointByCountry],
  );

  return (
    <section className="glass-panel relative overflow-hidden rounded-[32px] shadow-glow">
      <div className="absolute left-5 top-5 z-10 max-w-sm rounded-[24px] border border-cyan-100/10 bg-slate-950/70 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/60">
          {mode === "trade" ? "Trade Map" : "World Map"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {mode === "trade" ? "2D trade routes on the world map" : "Normal 2D world map with live markers"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-cyan-50/65">
          {mode === "trade"
            ? "Trade corridors are drawn directly over the flat world map so the page stays simple and stable."
            : "Click any country marker to load ocean information, crop signal, trade context, and AI insights."}
        </p>
      </div>

      <div className="absolute bottom-5 left-5 z-10 max-w-sm rounded-[24px] border border-cyan-100/10 bg-slate-950/70 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/55">Active Region</p>
        <p className="mt-2 text-lg font-semibold text-white">{selectedRegion ?? "No region selected"}</p>
        {activePoint ? (
          <p className="mt-2 text-sm leading-7 text-cyan-50/72">
            {activePoint.ocean_region}, {activePoint.crop}, {activePoint.yield_tons.toFixed(1)} t, hub {activePoint.trade_hub}.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-7 text-cyan-50/72">
            Pick a marker to sync the dashboard, trends, AI, and profile insights.
          </p>
        )}
      </div>

      <div className="absolute bottom-5 right-5 z-10 rounded-[24px] border border-cyan-100/10 bg-slate-950/70 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/55">Legend</p>
        <div className="mt-3 space-y-2 text-sm text-cyan-50/72">
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-[#6df0d7]" />
            Lower intensity
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-[#5ed4ff]" />
            Medium intensity
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-[#ff9b6b]" />
            Selected region
          </div>
        </div>
      </div>

      <div className="relative h-[580px] overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_50%_10%,rgba(32,112,151,0.22),rgba(4,19,33,0.92))]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
          style={{ backgroundImage: `url('${WORLD_MAP_IMAGE}')` }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.16),transparent_22%),linear-gradient(180deg,rgba(124,186,255,0.18),rgba(5,24,40,0.14)_38%,rgba(4,19,33,0.34)_100%)]" />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="routeStroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#6df0d7" />
              <stop offset="100%" stopColor="#ff9b6b" />
            </linearGradient>
          </defs>

          <rect fill="rgba(255,255,255,0.05)" height="100" width="100" x="0" y="0" />

          {Array.from({ length: 6 }).map((_, index) => (
            <line
              key={`lat-${index}`}
              stroke="rgba(86,120,165,0.22)"
              strokeDasharray="0.5 1"
              strokeWidth="0.18"
              x1="0"
              x2="100"
              y1={14 + index * 12}
              y2={14 + index * 12}
            />
          ))}

          {Array.from({ length: 8 }).map((_, index) => (
            <line
              key={`lon-${index}`}
              stroke="rgba(86,120,165,0.18)"
              strokeDasharray="0.5 1"
              strokeWidth="0.18"
              x1={8 + index * 12}
              x2={8 + index * 12}
              y1="0"
              y2="100"
            />
          ))}

          {CONTINENT_SHAPES.map((path, index) => (
            <path key={`continent-shadow-${index}`} d={path} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.24" />
          ))}

          {mode === "trade"
            ? tradeRoutes.map((route) => (
                <g key={route.id}>
                  <path
                    d={route.path}
                    fill="none"
                    opacity="0.92"
                    stroke="url(#routeStroke)"
                    strokeWidth={Math.max(0.45, route.volume / 120)}
                  />
                  <circle fill="#fff7d6" r="0.75">
                    <animateMotion dur={`${Math.max(5, 12 - route.volume / 10)}s`} repeatCount="indefinite" path={route.path} />
                  </circle>
                </g>
              ))
            : null}
        </svg>

        {points.map((point) => {
          const projected = projectPoint(point.latitude, point.longitude);
          const isSelected = point.country === selectedRegion;
          return (
            <button
              key={`${point.country}-${point.crop}-${point.year}`}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 transition hover:scale-110"
              onClick={() => onSelectRegion(point.country)}
              onMouseEnter={() => setHovered(point)}
              onMouseLeave={() => setHovered(null)}
              style={{
                left: `${projected.x}%`,
                top: `${projected.y}%`,
                width: isSelected ? "18px" : "13px",
                height: isSelected ? "18px" : "13px",
                backgroundColor: getMarkerColor(point, selectedRegion),
                boxShadow: `0 0 0 6px ${isSelected ? "rgba(255,155,107,0.26)" : "rgba(94,212,255,0.2)"}`,
              }}
              type="button"
            />
          );
        })}

        {hovered ? (
          <div className="absolute right-5 top-28 z-20 max-w-xs rounded-[20px] border border-cyan-100/10 bg-slate-950/88 px-4 py-3 text-sm text-cyan-50/85 backdrop-blur">
            <p className="font-semibold text-white">{hovered.country}</p>
            <p>{hovered.ocean_region}</p>
            <p>{hovered.crop}</p>
            <p>Yield: {hovered.yield_tons.toFixed(1)} t</p>
            <p>Hub: {hovered.trade_hub}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
