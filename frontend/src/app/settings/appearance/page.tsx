"use client";

import Sidebar from "@/components/Sidebar";
import { useTheme, PALETTES } from "@/lib/theme";

export default function AppearancePage() {
  const { palette, setPalette } = useTheme();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
      <Sidebar />
      <div className="flex-1">
        <div className="mb-6">
          <p className="section-title">Appearance</p>
        </div>

        <div className="card p-4">
          <p className="data-label mb-4">Dark Mode Palette</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {PALETTES.map((p) => {
              const [bgR, bgG, bgB] = p.vars.bg.split(" ");
              const [surfR, surfG, surfB] = p.vars.surface.split(" ");
              const [borderR, borderG, borderB] = p.vars.border.split(" ");
              const isActive = palette === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={`rounded-lg p-3 border transition-all text-left ${
                    isActive
                      ? "ring-2 ring-accent border-transparent"
                      : "border-surface-border hover:border-slate-500"
                  }`}
                  style={{
                    backgroundColor: `rgb(${p.vars.surface})`,
                  }}
                >
                  <div className="flex gap-1.5 mb-2">
                    <span
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: `rgb(${bgR} ${bgG} ${bgB})` }}
                    />
                    <span
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: `rgb(${surfR} ${surfG} ${surfB})` }}
                    />
                    <span
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: `rgb(${borderR} ${borderG} ${borderB})` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-300">{p.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mono">Palette applies in dark mode only.</p>
        </div>
      </div>
    </div>
  );
}
