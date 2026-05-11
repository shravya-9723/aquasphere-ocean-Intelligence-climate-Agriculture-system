"use client";

import { useMemo, useState } from "react";

import { CircleMarker, MapContainer, Popup, Polyline, TileLayer } from "react-leaflet";

import type { MapDatum, MapResponse } from "@/lib/types";


interface MapCanvasLeafletProps {
  data?: MapResponse;
  selectedRegion: string | null;
  onSelectRegion: (region: string) => void;
  mode?: "map" | "trade";
}

const TRADE_CONNECTIONS: [string, string][] = [
  ["India", "United States"],
  ["Brazil", "Japan"],
  ["Australia", "Indonesia"],
  ["South Africa", "India"],
];

type MapPosition = [number, number];


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


export default function MapCanvasLeaflet({
  data,
  selectedRegion,
  onSelectRegion,
  mode = "map",
}: MapCanvasLeafletProps) {
  const [hovered, setHovered] = useState<MapDatum | null>(null);
  const points = data?.agriculture ?? [];

  const pointByCountry = useMemo(() => new Map(points.map((point) => [point.country, point])), [points]);
  const tradeRoutes = useMemo(
    () =>
      TRADE_CONNECTIONS.map(([from, to]) => {
        const source = pointByCountry.get(from);
        const target = pointByCountry.get(to);
        if (!source || !target) {
          return null;
        }
        return [
          [source.latitude, source.longitude],
          [target.latitude, target.longitude],
        ] as [MapPosition, MapPosition];
      }).filter(Boolean) as [MapPosition, MapPosition][],
    [pointByCountry],
  );

  const activePoint = selectedRegion ? pointByCountry.get(selectedRegion) ?? null : null;

  return (
    <section className="glass-panel relative overflow-hidden rounded-[32px] shadow-glow">
      <div className="absolute left-5 top-5 z-[500] max-w-sm rounded-[24px] border border-cyan-100/10 bg-slate-950/70 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/60">
          {mode === "trade" ? "Trade Map" : "World Map"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {mode === "trade" ? "Global trade routes with ocean context" : "Interactive ocean-climate world map"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-cyan-50/65">
          {mode === "trade"
            ? "Follow route lines between countries and inspect how each corridor connects to ocean conditions."
            : "Click any highlighted country to load ocean temperature, crop yield, and AI-backed insight."}
        </p>
      </div>

      <div className="absolute bottom-5 left-5 z-[500] max-w-sm rounded-[24px] border border-cyan-100/10 bg-slate-950/70 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/55">Active Region</p>
        <p className="mt-2 text-lg font-semibold text-white">{selectedRegion ?? "No region selected"}</p>
        {activePoint ? (
          <p className="mt-2 text-sm leading-7 text-cyan-50/72">
            {activePoint.ocean_region}, {activePoint.crop}, {activePoint.yield_tons.toFixed(1)} t.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-7 text-cyan-50/72">
            Select a country marker to sync the rest of the dashboard.
          </p>
        )}
      </div>

      <div className="absolute bottom-5 right-5 z-[500] rounded-[24px] border border-cyan-100/10 bg-slate-950/70 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/55">Legend</p>
        <div className="mt-3 space-y-2 text-sm text-cyan-50/72">
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-[#6df0d7]" />
            Cooler ocean region
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-[#5ed4ff]" />
            Moderate temperature
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full bg-[#ff6d6d]" />
            Higher ocean temperature
          </div>
          {mode === "trade" ? (
            <div className="flex items-center gap-2">
              <span className="block h-1 w-8 rounded-full bg-cyan-300" />
              Trade route
            </div>
          ) : null}
        </div>
      </div>

      <div className="h-[580px] overflow-hidden rounded-[32px]">
        <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mode === "trade"
            ? tradeRoutes.map((positions, index) => (
                <Polyline
                  key={`${positions[0].toString()}-${index}`}
                  color="#5ed4ff"
                  opacity={0.75}
                  positions={positions}
                  weight={3}
                />
              ))
            : null}

          {points.map((point) => (
            <CircleMarker
              key={`${point.country}-${point.crop}-${point.year}`}
              center={[point.latitude, point.longitude]}
              eventHandlers={{
                click: () => onSelectRegion(point.country),
                mouseover: () => setHovered(point),
                mouseout: () => setHovered(null),
              }}
              fillColor={getMarkerColor(point, selectedRegion)}
              fillOpacity={0.75}
              pathOptions={{ color: "#d8f9ff" }}
              radius={point.country === selectedRegion ? 10 : 7}
              weight={2}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>{point.country}</strong>
                  </div>
                  <div>{point.ocean_region}</div>
                  <div>{point.crop}</div>
                  <div>Yield: {point.yield_tons.toFixed(1)} t</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {hovered ? (
        <div className="pointer-events-none absolute right-5 top-28 z-[500] max-w-xs rounded-[20px] border border-cyan-100/10 bg-slate-950/88 px-4 py-3 text-sm text-cyan-50/85 backdrop-blur">
          <p className="font-semibold text-white">{hovered.country}</p>
          <p>{hovered.ocean_region}</p>
          <p>{hovered.crop}</p>
          <p>Yield: {hovered.yield_tons.toFixed(1)} t</p>
        </div>
      ) : null}
    </section>
  );
}
