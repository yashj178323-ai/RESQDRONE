import { memo, useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { useThemeColors } from '@/context/ThemeContext';
import type { LidarSample } from '@/types';

/**
 * Ten seconds of TF-Luna ranging. This is live sensor feedback, not analytics,
 * so it carries no axes, legend or tooltip — only the shape of the signal.
 */
function LidarGraphBase({ samples }: { samples: LidarSample[] }) {
  const c = useThemeColors();
  const data = useMemo(() => samples.map((s, i) => ({ i, d: s.distanceM })), [samples]);
  const latest = samples[samples.length - 1]?.distanceM;

  const [min, max] = useMemo(() => {
    if (samples.length === 0) return [0, 2];
    const values = samples.map((s) => s.distanceM);
    return [Math.min(...values) - 0.15, Math.max(...values) + 0.15];
  }, [samples]);

  return (
    <div className="min-w-0 rounded-control border border-edge bg-panel2 p-3">
      <div className="flex items-baseline justify-between">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
          Z-axis · 10 s
        </p>
        <p className="font-mono text-[13px] font-medium text-ok">
          {latest === undefined ? '—' : `${latest.toFixed(2)} m`}
        </p>
      </div>
      <div className="mt-2 h-16">
        {data.length < 2 ? (
          <p className="flex h-full items-center justify-center text-[11px] text-dim">
            Waiting for ranging data…
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <YAxis domain={[min, max]} hide />
              <Area
                type="monotone"
                dataKey="d"
                stroke={c.ok}
                strokeWidth={1.5}
                fill={c.ok}
                fillOpacity={0.14}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export const LidarGraph = memo(LidarGraphBase);
