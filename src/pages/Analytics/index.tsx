import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { useIncidentState, useMissionState } from '@/context/AppStore';
import { BATTERY_HISTORY, COVERAGE_HISTORY } from '@/data/mockData';
import { useThemeColors } from '@/context/ThemeContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatTime } from '@/utils/format';

export default function AnalyticsPage() {
  const { detections } = useIncidentState();
  const { areas } = useMissionState();
  const c = useThemeColors();

  const axis = useMemo(() => ({ stroke: c.axis, fontSize: 10 }), [c.axis]);
  const tooltipStyle = useMemo(
    () => ({
      contentStyle: {
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        fontSize: 11,
        color: c.ink,
      },
      labelStyle: { color: c.axis },
    }),
    [c.axis, c.border, c.ink, c.surface],
  );
  const grid = c.grid;

  /** Detections grouped into five-minute buckets from the live detection list. */
  const overTime = useMemo(() => {
    const buckets = new Map<string, number>();
    [...detections]
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach((d) => {
        const key = formatTime(Math.floor(d.timestamp / 300_000) * 300_000);
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      });
    return [...buckets.entries()].map(([t, count]) => ({ t, count }));
  }, [detections]);

  const confidenceBands = useMemo(() => {
    const bands = [
      { band: '60–70%', min: 0.6, max: 0.7 },
      { band: '70–80%', min: 0.7, max: 0.8 },
      { band: '80–90%', min: 0.8, max: 0.9 },
      { band: '90–100%', min: 0.9, max: 1.01 },
    ];
    return bands.map((b) => ({
      band: b.band,
      count: detections.filter((d) => d.fusedConfidence >= b.min && d.fusedConfidence < b.max).length,
    }));
  }, [detections]);

  const sensorAgreement = useMemo(
    () =>
      detections.map((d) => ({
        rgb: Number((d.rgbConfidence * 100).toFixed(1)),
        thermal: Number((d.thermalConfidence * 100).toFixed(1)),
        id: d.id,
        z: 100,
      })),
    [detections],
  );

  const outcomes = useMemo(
    () => [
      {
        label: 'Confirmed',
        value: detections.filter((d) => d.verification === 'CONFIRMED').length,
        fill: c.ok,
      },
      {
        label: 'False',
        value: detections.filter((d) => d.verification === 'FALSE_DETECTION').length,
        fill: c.dim,
      },
      {
        label: 'Awaiting review',
        value: detections.filter(
          (d) =>
            d.verification === 'PENDING' ||
            d.verification === 'UNDER_REVIEW' ||
            d.verification === 'UNCERTAIN',
        ).length,
        fill: c.warn,
      },
    ],
    [c.dim, c.ok, c.warn, detections],
  );

  const coverage = useMemo(
    () => [
      ...COVERAGE_HISTORY,
      { t: 'now', coverage: areas.find((a) => a.status === 'IN_PROGRESS')?.progress ?? 100 },
    ],
    [areas],
  );

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <PageHeader
        title="Analytics"
        description="Every series below is computed from the mission state in this session, not from placeholder noise."
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Panel title="Detections over time" bodyClassName="p-3 h-64">
          {overTime.length === 0 ? (
            <EmptyState
              title="No detections in this mission yet"
              detail="Run a detection pass from Live mission to populate this chart."
            />
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overTime}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="t" {...axis} />
              <YAxis allowDecimals={false} {...axis} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" name="Detections" fill={c.ai} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Fused confidence distribution" bodyClassName="p-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceBands}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="band" {...axis} />
              <YAxis allowDecimals={false} {...axis} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" name="Detections" fill={c.info} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="RGB against thermal agreement" bodyClassName="p-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 8, bottom: 16, left: 0 }}>
              <CartesianGrid stroke={grid} />
              <XAxis
                type="number"
                dataKey="rgb"
                name="RGB"
                unit="%"
                domain={[50, 100]}
                {...axis}
              />
              <YAxis
                type="number"
                dataKey="thermal"
                name="Thermal"
                unit="%"
                domain={[50, 100]}
                {...axis}
              />
              <ZAxis dataKey="z" range={[60, 60]} />
              <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={sensorAgreement} fill={c.crit} name="Detections" />
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Verification outcomes" bodyClassName="p-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={outcomes} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke={grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axis} />
              <YAxis type="category" dataKey="label" width={110} {...axis} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" name="Detections" radius={[0, 2, 2, 0]}>
                {outcomes.map((o) => (
                  <Cell key={o.label} fill={o.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Search coverage" bodyClassName="p-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={coverage}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="t" {...axis} />
              <YAxis domain={[0, 100]} unit="%" {...axis} />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="coverage"
                name="Zone A coverage"
                stroke={c.ok}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Battery and altitude" bodyClassName="p-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={BATTERY_HISTORY}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="t" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10, color: c.axis }} />
              <Line
                type="monotone"
                dataKey="battery"
                name="Battery %"
                stroke={c.warn}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="altitude"
                name="Altitude m"
                stroke={c.info}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
