"use client";

interface TimeSliderProps {
  year: number;
  onChange: (year: number) => void;
}


export function TimeSlider({ year, onChange }: TimeSliderProps) {
  return (
    <div className="glass-panel rounded-[28px] p-5 shadow-glow">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/60">Climate Timeline</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{year}</h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-cyan-50/70">
          Slide from 2000 to 2026 to update the regional pointer data, map insights, analytics trend, and AI context.
        </p>
      </div>

      <input
        aria-label="Select year"
        className="h-2 w-full cursor-pointer accent-cyan-300"
        max={2026}
        min={2000}
        onChange={(event) => onChange(Number(event.target.value))}
        step={1}
        type="range"
        value={year}
      />

      <div className="mt-2 flex justify-between text-xs text-cyan-100/50">
        <span>2000</span>
        <span>2005</span>
        <span>2010</span>
        <span>2015</span>
        <span>2020</span>
        <span>2026</span>
      </div>
    </div>
  );
}
