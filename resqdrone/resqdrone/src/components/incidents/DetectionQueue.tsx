import { Check, Eye, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMissionActions } from '@/hooks/useMissionActions';
import { formatTime, priorityMeta } from '@/utils/format';
import type { Detection, SearchArea } from '@/types';

const PRIORITY_ORDER: Record<Detection['priority'], number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

function age(timestamp: number): string {
  const mins = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  return mins < 1 ? 'just now' : `${mins} min ago`;
}

/**
 * The review queue: what needs an operator decision right now, ordered by
 * priority. The full table below is the audit trail, not the working surface.
 */
export function DetectionQueue({
  detections,
  areas,
  selectedId,
  onSelect,
}: {
  detections: Detection[];
  areas: SearchArea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { confirmDetection, focusOn, detailZoom } = useMissionActions();

  const queue = detections
    .filter((d) => d.verification === 'PENDING' || d.verification === 'UNDER_REVIEW')
    .sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.timestamp - a.timestamp,
    );

  if (queue.length === 0) {
    return (
      <div className="surface">
        <EmptyState
          title="No detection awaiting review"
          detail="Every AI detection in this mission has been resolved by an operator."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {queue.map((d) => {
        const meta = priorityMeta[d.priority];
        const critical = d.priority === 'P1';
        const zone = areas.find((a) => a.id === d.areaId);
        return (
          <article
            key={d.id}
            className={`rounded-panel border p-4 transition-colors ease-ui ${
              critical ? 'border-crit/45 bg-crit/[0.06]' : 'border-edge bg-panel'
            } ${d.id === selectedId ? 'ring-1 ring-info/50' : ''}`}
          >
            <header className="flex items-start justify-between gap-2">
              <div>
                <p className={`eyebrow ${meta.text}`}>{d.priority}</p>
                <h3 className="mt-1 font-mono text-lg font-semibold leading-none text-ink">
                  {d.id}
                </h3>
              </div>
              <span className="font-mono text-[11px] text-dim">{formatTime(d.timestamp)}</span>
            </header>

            <p className="mt-2.5 text-[13px] text-muted">
              Possible survivor · {zone?.name ?? 'Unassigned'} · {age(d.timestamp)}
            </p>

            <div className="mt-3 flex items-end gap-2">
              <span className={`font-mono text-2xl font-semibold leading-none ${meta.text}`}>
                {(d.fusedConfidence * 100).toFixed(1)}%
              </span>
              <span className="pb-0.5 text-[11px] text-dim">
                fused · RGB {(d.rgbConfidence * 100).toFixed(0)}% · thermal{' '}
                {(d.thermalConfidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" icon={<Check size={11} />} onClick={() => confirmDetection(d.id)}>
                Confirm
              </Button>
              <Button size="sm" icon={<Eye size={11} />} onClick={() => onSelect(d.id)}>
                Review
              </Button>
              <Button
                size="sm"
                icon={<MapPin size={11} />}
                onClick={() => focusOn(d.latitude, d.longitude, detailZoom)}
              >
                Map
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
