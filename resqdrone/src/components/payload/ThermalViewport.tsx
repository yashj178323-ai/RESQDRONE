import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useSensorState } from '@/context/AppStore';
import { PALETTE_LABELS, paletteCss, samplePalette } from './thermalPalettes';
import type { ThermalPalette } from '@/types';

const PALETTES: ThermalPalette[] = ['IRONBOW', 'RAINBOW', 'WHITE_HOT', 'BLACK_HOT'];
const SHORT: Record<ThermalPalette, string> = {
  IRONBOW: 'IRON',
  RAINBOW: 'RAINBOW',
  WHITE_HOT: 'WHITE',
  BLACK_HOT: 'BLACK',
};

/** Backing-store resolution is capped so a 4K display does not burn CPU. */
const MAX_DPR = 2;

/**
 * AMG8833 thermal instrument.
 *
 * The canvas renders at the container's real pixel dimensions, measured with a
 * ResizeObserver, so the sensor field fills the viewport edge to edge. That is
 * what removes the black letterbox bars: there is no fixed 320x240 backing
 * store being letterboxed by `object-contain` any more.
 *
 * The palette is scientific data and is never recoloured by the app theme.
 */
export function ThermalViewport({ className = '' }: { className?: string }) {
  const dispatch = useAppDispatch();
  const { thermal, palette, thresholdC, selectedCell } = useSensorState();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const { grid, size, minC, maxC, hotIndex } = thermal;
  const detected = maxC >= thresholdC;
  const hotX = hotIndex % size;
  const hotY = Math.floor(hotIndex / size);

  /** Track the real display size of the image area. */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setBox({ w: Math.max(1, Math.round(rect.width)), h: Math.max(1, Math.round(rect.height)) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || box.w === 0 || box.h === 0) return;

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const w = Math.round(box.w * dpr);
    const h = Math.round(box.h * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.imageSmoothingEnabled = true;

    const image = ctx.createImageData(w, h);
    const span = Math.max(0.001, maxC - minC);
    const sx = (size - 1) / Math.max(1, w - 1);
    const sy = (size - 1) / Math.max(1, h - 1);

    for (let py = 0; py < h; py += 1) {
      const gy = py * sy;
      const y0 = Math.floor(gy);
      const y1 = Math.min(size - 1, y0 + 1);
      const fy = gy - y0;

      for (let px = 0; px < w; px += 1) {
        const gx = px * sx;
        const x0 = Math.floor(gx);
        const x1 = Math.min(size - 1, x0 + 1);
        const fx = gx - x0;

        // Bilinear blend of the four surrounding sensor cells.
        const v =
          grid[y0 * size + x0] * (1 - fx) * (1 - fy) +
          grid[y0 * size + x1] * fx * (1 - fy) +
          grid[y1 * size + x0] * (1 - fx) * fy +
          grid[y1 * size + x1] * fx * fy;

        const [r, g, b] = samplePalette(palette, (v - minC) / span);
        const i = (py * w + px) * 4;
        image.data[i] = r;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [box.h, box.w, grid, maxC, minC, palette, size]);

  useEffect(() => {
    draw();
  }, [draw]);

  const onPick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(size - 1, Math.floor(((e.clientX - rect.left) / rect.width) * size));
    const y = Math.min(size - 1, Math.floor(((e.clientY - rect.top) / rect.height) * size));
    dispatch({ type: 'sensors/selectCell', index: y * size + x });
  };

  const cellTemp = selectedCell === null ? null : grid[selectedCell];

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-panel border border-edge bg-panel ${className}`}
      aria-label="Thermal payload"
    >
      {/* Two-line heading so neither the title nor the palette can clip. */}
      <header className="shrink-0 border-b border-edge px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-crit" aria-hidden />
              Thermal
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-dim">
              AMG8833 · 8×8 · 10 Hz · simulated
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ok">
            Live
          </span>
        </div>

        <div
          className="mt-2 flex overflow-hidden rounded-control border border-edge"
          role="group"
          aria-label="Thermal palette"
        >
          {PALETTES.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={palette === p}
              title={PALETTE_LABELS[p]}
              onClick={() => dispatch({ type: 'sensors/setPalette', palette: p })}
              className={`min-w-0 flex-1 border-r border-edge px-1 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors ease-ui last:border-r-0 ${
                palette === p ? 'bg-panel3 text-ink' : 'text-dim hover:text-ink'
              }`}
            >
              <span className="sr-only">{PALETTE_LABELS[p]}</span>
              <span aria-hidden className="block truncate">
                {SHORT[p]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Image area: the canvas fills this box exactly, so there are no bars. */}
      <div ref={frameRef} className="relative min-h-0 flex-1 bg-black">
        <canvas
          ref={canvasRef}
          onClick={onPick}
          style={{ width: '100%', height: '100%' }}
          className="block cursor-crosshair"
          role="img"
          aria-label={`Thermal field, peak ${maxC.toFixed(1)} degrees Celsius`}
        />

        {detected && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${((hotX + 0.5) / size) * 100}%`,
              top: `${((hotY + 0.5) / size) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative h-14 w-14">
              <span className="absolute left-0 top-0 h-3 w-3 border-l border-t border-crit" />
              <span className="absolute right-0 top-0 h-3 w-3 border-r border-t border-crit" />
              <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-crit" />
              <span className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-crit" />
              <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-crit" />
              <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-crit" />
            </div>
            <p className="mt-1 whitespace-nowrap text-center font-mono text-[10px] font-semibold text-crit">
              TARGET {maxC.toFixed(1)}°C
            </p>
          </div>
        )}

        {/* Temperature scale, integrated into the image rather than beside it. */}
        <div className="pointer-events-none absolute bottom-3 right-2 top-3 flex items-stretch gap-1.5">
          <div className="flex flex-col justify-between text-right font-mono text-[9px] leading-none text-white/85">
            <span>{maxC.toFixed(1)}°</span>
            <span>{minC.toFixed(1)}°</span>
          </div>
          <div
            className="w-1.5 border border-white/25"
            style={{ background: paletteCss(palette) }}
            aria-hidden
          />
        </div>

        {selectedCell !== null && cellTemp !== null && (
          <div className="absolute bottom-2 left-2 border border-edge2 bg-canvas/90 px-2.5 py-2 font-mono">
            <div className="flex items-start gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.1em] text-dim">Cell</p>
                <p className="mt-0.5 text-[12px] text-ink">
                  X{selectedCell % size} Y{Math.floor(selectedCell / size)}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.1em] text-dim">Temp</p>
                <p className="mt-0.5 text-[12px] text-ink">{cellTemp.toFixed(1)}°C</p>
              </div>
              <button
                type="button"
                aria-label="Close cell inspector"
                onClick={() => dispatch({ type: 'sensors/selectCell', index: null })}
                className="text-dim transition-colors ease-ui hover:text-ink"
              >
                <X size={13} strokeWidth={1.8} aria-hidden />
              </button>
            </div>
            <p
              className={`mt-1 text-[9px] uppercase tracking-[0.1em] ${
                cellTemp >= thresholdC ? 'text-crit' : 'text-muted'
              }`}
            >
              {cellTemp >= thresholdC ? 'Above threshold' : 'Below threshold'}
            </p>
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center gap-3 overflow-hidden border-t border-edge px-3 py-1.5 font-mono text-[10px] text-dim">
        <span className="hidden sm:inline">8×8</span>
        <span className="hidden md:inline">10 Hz</span>
        <span>THR {thresholdC}°C</span>
        <span className="text-ink">PEAK {maxC.toFixed(1)}°C</span>
        <span className={`ml-auto shrink-0 ${detected ? 'text-crit' : 'text-muted'}`}>
          {detected ? 'SIGNATURE DETECTED' : 'NOMINAL'}
        </span>
      </footer>
    </section>
  );
}
