import { memo } from 'react';
import { headingLabel } from '@/utils/format';

const WIDTH = 190;
const PX_PER_DEG = 2;

/** Horizontal compass ribbon with a fixed centre pointer. */
function HeadingTapeBase({ heading }: { heading: number }) {
  const marks: { deg: number; major: boolean }[] = [];
  for (let d = -60; d <= 60; d += 10) {
    const deg = (Math.round(heading / 10) * 10 + d + 360) % 360;
    marks.push({ deg, major: deg % 30 === 0 });
  }
  const offset = (heading % 10) * PX_PER_DEG;

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">Heading</span>
        <span className="font-mono text-sm font-semibold text-ink">
          {heading.toString().padStart(3, '0')}° {headingLabel(heading)}
        </span>
      </div>
      <div
        className="relative h-9 w-full overflow-hidden rounded-control border border-edge bg-panel2"
        role="img"
        aria-label={`Heading ${heading} degrees, ${headingLabel(heading)}`}
      >
        <div
          className="absolute inset-y-0 left-1/2 flex items-end"
          style={{ transform: `translateX(${-offset}px)` }}
        >
          {marks.map((m, i) => (
            <div
              key={`${m.deg}-${i}`}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: (i - 6) * 10 * PX_PER_DEG }}
            >
              {m.major && (
                <span className="mb-0.5 font-mono text-[9px] text-dim">
                  {m.deg.toString().padStart(3, '0')}
                </span>
              )}
              <span className={`w-px ${m.major ? 'h-3 bg-edge2' : 'h-1.5 bg-edge'}`} />
            </div>
          ))}
        </div>
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px bg-ok" aria-hidden />
      </div>
    </div>
  );
}

export const HeadingTape = memo(HeadingTapeBase);
