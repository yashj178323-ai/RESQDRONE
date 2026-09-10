import { memo } from 'react';

const HEIGHT = 150;
const PX_PER_M = 34;

/** Vertical ruler that scrolls against a fixed pointer as distance changes. */
function AltitudeTapeBase({
  valueM,
  label = 'Z-AXIS',
  unit = 'm',
}: {
  valueM: number;
  label?: string;
  unit?: string;
}) {
  const centre = HEIGHT / 2;
  const ticks: number[] = [];
  const base = Math.floor(valueM) - 3;
  for (let i = 0; i <= 7; i += 1) ticks.push(base + i);

  return (
    <div className="flex shrink-0 items-stretch gap-3">
      <div
        className="relative w-14 overflow-hidden rounded border border-edge bg-panel2"
        style={{ height: HEIGHT }}
        role="img"
        aria-label={`${label} ${valueM.toFixed(2)} ${unit}`}
      >
        <div
          className="absolute inset-x-0"
          style={{ transform: `translateY(${(valueM - base) * PX_PER_M - centre}px)` }}
        >
          {ticks
            .slice()
            .reverse()
            .map((t, i) => (
              <div
                key={t}
                className="absolute left-0 flex w-full items-center gap-1"
                style={{ top: i * PX_PER_M }}
              >
                <span className="h-px w-3 bg-edge2" />
                <span className="font-mono text-[10px] text-dim">{t}</span>
              </div>
            ))}
        </div>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-px bg-ok" aria-hidden />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-ok" aria-hidden />
      </div>
      <div className="flex min-w-[74px] flex-col justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">{label}</p>
        <p className="mt-1.5 whitespace-nowrap font-mono text-xl font-semibold leading-none text-ok">
          {valueM.toFixed(2)}
          <span className="ml-1 text-xs text-muted">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export const AltitudeTape = memo(AltitudeTapeBase);
