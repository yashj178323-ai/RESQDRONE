import { useState } from 'react';
import { Thermometer, Video } from 'lucide-react';
import { PayloadViewport } from './PayloadViewport';
import { ThermalViewport } from './ThermalViewport';

type View = 'SPLIT' | 'RGB' | 'THERMAL';

const VIEWS: { key: View; label: string }[] = [
  { key: 'SPLIT', label: 'Both' },
  { key: 'RGB', label: 'RGB' },
  { key: 'THERMAL', label: 'Thermal' },
];

/**
 * The payload section: RGB and thermal side by side directly under the map,
 * both at equal weight. The view switch lets an operator take one full width
 * when they want a closer look; neither is ever hidden behind an unrelated tab.
 */
export function PayloadPanel({ className = '' }: { className?: string }) {
  const [view, setView] = useState<View>('SPLIT');

  return (
    <section className={`min-w-0 ${className}`} aria-label="Payload">
      <header className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
            Payload
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px] text-dim">
            <span className="flex items-center gap-1.5">
              <Video size={12} strokeWidth={1.8} aria-hidden />
              RGB · ESP32-CAM
            </span>
            <span className="flex items-center gap-1.5">
              <Thermometer size={12} strokeWidth={1.8} aria-hidden />
              Thermal · AMG8833
            </span>
          </p>
        </div>

        <div
          className="flex shrink-0 overflow-hidden rounded-control border border-edge"
          role="group"
          aria-label="Payload view"
        >
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-pressed={view === v.key}
              onClick={() => setView(v.key)}
              className={`border-r border-edge px-3 py-1.5 text-[11px] font-medium transition-colors ease-ui last:border-r-0 ${
                view === v.key ? 'bg-panel3 text-ink' : 'text-dim hover:text-ink'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      {/*
        Equal columns on desktop, stacked below lg. Real minimum heights: if the
        viewport is short the page scrolls rather than crushing either feed.
      */}
      {view === 'SPLIT' && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <PayloadViewport className="h-[clamp(340px,36vh,420px)] min-w-0" />
          <ThermalViewport className="h-[clamp(340px,36vh,420px)] min-w-0" />
        </div>
      )}

      {view === 'RGB' && <PayloadViewport className="h-[clamp(360px,44vh,520px)] min-w-0" />}

      {view === 'THERMAL' && <ThermalViewport className="h-[clamp(360px,44vh,520px)] min-w-0" />}
    </section>
  );
}
