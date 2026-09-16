import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { verificationLabel } from '@/config/status';

const ITEMS = [
  { swatch: 'h-2.5 w-2.5 rounded-full bg-ok', label: 'Drone RQ-01' },
  { swatch: 'h-0 w-4 border-t-2 border-dashed border-ok', label: 'Flight path' },
  { swatch: 'h-0 w-4 border-t-2 border-dashed border-action', label: 'Team route' },
  { swatch: 'h-2.5 w-4 border border-info/60 bg-info/25', label: 'Search area' },
  { swatch: 'h-2.5 w-4 border border-ok/60 bg-ok/25', label: 'Searched' },
  { swatch: 'h-2.5 w-2.5 rounded-full bg-crit', label: 'P1 incident' },
  { swatch: 'h-2.5 w-2.5 rounded-full bg-warn', label: verificationLabel.PENDING },
  { swatch: 'h-2.5 w-2.5 rounded-full bg-ai', label: verificationLabel.UNDER_REVIEW },
  { swatch: 'h-2.5 w-2.5 rounded-full bg-ok', label: `${verificationLabel.CONFIRMED} survivor` },
  { swatch: 'h-2.5 w-2.5 rounded-full bg-action', label: 'Base station' },
  { swatch: 'h-2.5 w-2.5 rounded-full bg-action', label: 'Rescue team' },
];

/**
 * The legend on demand. It used to sit permanently over the map, consuming a
 * corner an operator needs; now it is one control in the map stack.
 */
export function MapLegendControl() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Map legend"
        title="Map legend (L)"
        className="flex h-9 w-9 items-center justify-center rounded-control border border-edge bg-panel text-muted transition-colors ease-ui hover:text-info"
      >
        <Info size={15} strokeWidth={1.8} aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 rounded-control border border-edge bg-panel p-3 shadow-raised">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
            Legend
          </p>
          <ul className="space-y-1.5">
            {ITEMS.map((i) => (
              <li key={i.label} className="flex items-center gap-2.5 text-[11px] text-muted">
                <span className={`shrink-0 ${i.swatch}`} aria-hidden />
                {i.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
