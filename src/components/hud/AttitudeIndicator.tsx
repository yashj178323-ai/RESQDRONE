import { memo } from 'react';
import type { Attitude } from '@/types';

const SIZE = 150;
const R = 66;
const PX_PER_DEG = 3.2;

/**
 * Artificial horizon. The horizon group rotates by roll and translates by
 * pitch; the aircraft symbol and roll pointer stay fixed, as on a real ADI.
 */
function AttitudeIndicatorBase({ attitude }: { attitude: Attitude }) {
  const { pitch, roll } = attitude;
  const shift = pitch * PX_PER_DEG;
  const c = SIZE / 2;

  const ladder = [-20, -10, 10, 20];

  return (
    <figure className="flex w-full max-w-[210px] flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label={`Attitude: pitch ${pitch.toFixed(1)} degrees, roll ${roll.toFixed(1)} degrees`}
      >
        <defs>
          <clipPath id="adi-clip">
            <circle cx={c} cy={c} r={R} />
          </clipPath>
        </defs>

        <g clipPath="url(#adi-clip)">
          <g transform={`rotate(${-roll} ${c} ${c}) translate(0 ${shift})`}>
            <rect x={-SIZE} y={-SIZE} width={SIZE * 3} height={SIZE + c} fill="rgb(var(--info))" opacity="0.16" />
            <rect x={-SIZE} y={c} width={SIZE * 3} height={SIZE * 2} fill="rgb(var(--warn))" opacity="0.16" />
            <line
              x1={-SIZE}
              y1={c}
              x2={SIZE * 2}
              y2={c}
              stroke="rgb(var(--ink))"
              strokeWidth="1.5"
              opacity="0.85"
            />
            {ladder.map((deg) => (
              <g key={deg}>
                <line
                  x1={c - (Math.abs(deg) === 10 ? 22 : 14)}
                  y1={c - deg * PX_PER_DEG}
                  x2={c + (Math.abs(deg) === 10 ? 22 : 14)}
                  y2={c - deg * PX_PER_DEG}
                  stroke="rgb(var(--ink))"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <text
                  x={c + 28}
                  y={c - deg * PX_PER_DEG + 3}
                  fill="rgb(var(--muted))"
                  fontSize="8"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {Math.abs(deg)}
                </text>
              </g>
            ))}
          </g>
        </g>

        <circle cx={c} cy={c} r={R} fill="none" stroke="rgb(var(--edge2))" strokeWidth="1.5" />

        {/* Fixed aircraft reference. */}
        <g stroke="rgb(var(--ok))" strokeWidth="2" fill="none">
          <line x1={c - 30} y1={c} x2={c - 12} y2={c} />
          <line x1={c + 12} y1={c} x2={c + 30} y2={c} />
          <circle cx={c} cy={c} r="2" fill="rgb(var(--ok))" />
        </g>

        {/* Roll pointer. */}
        <g transform={`rotate(${-roll} ${c} ${c})`}>
          <polygon
            points={`${c},${c - R + 4} ${c - 5},${c - R + 13} ${c + 5},${c - R + 13}`}
            fill="rgb(var(--ok))"
          />
        </g>
      </svg>
      <figcaption className="mt-3 grid w-full grid-cols-2 gap-3 font-mono text-[11px]">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.1em] text-dim">Pitch</span>
          <span className="text-ink">{pitch.toFixed(1)}°</span>
        </span>
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.1em] text-dim">Roll</span>
          <span className="text-ink">{roll.toFixed(1)}°</span>
        </span>
      </figcaption>
    </figure>
  );
}

export const AttitudeIndicator = memo(AttitudeIndicatorBase);
