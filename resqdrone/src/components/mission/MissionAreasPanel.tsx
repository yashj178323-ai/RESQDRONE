import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { useAppDispatch, useMissionState } from '@/context/AppStore';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDuration } from '@/utils/format';
import type { SearchArea } from '@/types';

const STATUS_LABEL = {
  IN_PROGRESS: 'In progress',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
} as const;

/** The selected zone, in full. */
function ZoneDetail({ area }: { area: SearchArea }) {
  return (
    <div className="rounded-control border border-ok/45 bg-ok/[0.06] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-none text-ink">{area.name}</p>
          <p
            className={`mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
              area.status === 'IN_PROGRESS' ? 'text-ok' : 'text-dim'
            }`}
          >
            {STATUS_LABEL[area.status]}
          </p>
        </div>
        <p className="shrink-0 font-mono text-2xl font-semibold leading-none text-ink">
          {area.progress}
          <span className="text-sm">%</span>
        </p>
      </div>

      <ProgressBar
        className="mt-3"
        value={area.progress}
        tone={area.status === 'COMPLETED' ? 'info' : 'ok'}
        label={`${area.name} coverage`}
      />
      <p className="mt-1.5 font-mono text-[11px] text-muted">
        {area.areaSearchedKm2.toFixed(1)} / {area.totalAreaKm2.toFixed(1)} km²
      </p>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-edge pt-2.5">
        <div>
          <dt className="label">Det</dt>
          <dd className="mt-1 font-mono text-[14px] text-ink">{area.detections}</dd>
        </div>
        <div>
          <dt className="label">Verified</dt>
          <dd className="mt-1 font-mono text-[14px] text-ok">{area.verified}</dd>
        </div>
        <div>
          <dt className="label">Flight</dt>
          <dd className="mt-1 font-mono text-[14px] text-ink">
            {formatDuration(area.flightTimeSec)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Every other zone: one readable row. */
function ZoneRow({ area, onSelect }: { area: SearchArea; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-control border border-edge bg-panel2 px-3 py-2.5 text-left transition-colors ease-ui hover:border-edge2"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-ink">{area.name}</span>
        <span className="block text-[10px] uppercase tracking-[0.08em] text-dim">
          {STATUS_LABEL[area.status]}
        </span>
      </span>
      {area.status !== 'PENDING' && (
        <span className="shrink-0 font-mono text-[13px] text-muted">{area.progress}%</span>
      )}
      <ChevronRight size={14} className="shrink-0 text-dim" aria-hidden />
    </button>
  );
}

/**
 * Zone selector, not a scrolling stack of identical cards: the selected zone is
 * expanded, everything else collapses to a row. Header and tabs stay fixed;
 * only the row list scrolls, and only when there are enough zones to need it.
 */
export function MissionAreasPanel({
  onCreate,
  className = '',
}: {
  onCreate?: () => void;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const { areas, selectedAreaId } = useMissionState();
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const active = areas.filter((a) => a.status !== 'COMPLETED');
  const completed = areas.filter((a) => a.status === 'COMPLETED');
  const shown = tab === 'active' ? active : completed;

  const selected = shown.find((a) => a.id === selectedAreaId) ?? shown[0];
  const others = shown.filter((a) => a.id !== selected?.id);

  const select = (area: SearchArea) => {
    dispatch({ type: 'mission/selectArea', areaId: area.id });
    if (area.polygon.length < 3) return;
    const lat = area.polygon.reduce((t, p) => t + p.lat, 0) / area.polygon.length;
    const lng = area.polygon.reduce((t, p) => t + p.lng, 0) / area.polygon.length;
    dispatch({ type: 'map/focus', lat, lng, zoom: 15 });
  };

  return (
    <section
      className={`flex min-h-0 flex-col rounded-panel border border-edge bg-panel ${className}`}
      aria-label="Search zones"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-edge px-3.5 py-2.5">
        <h2 className="text-[13px] font-semibold text-ink">Search zones</h2>
        <button
          type="button"
          onClick={onCreate}
          aria-label="Add a search zone"
          className="rounded border border-edge2 p-1 text-muted transition-colors ease-ui hover:text-info"
        >
          <Plus size={13} aria-hidden />
        </button>
      </header>

      <div className="shrink-0 p-2.5 pb-0">
        <Tabs
          size="sm"
          tabs={[
            { key: 'active' as const, label: `Active ${active.length}` },
            { key: 'completed' as const, label: `Completed ${completed.length}` },
          ]}
          active={tab}
          onChange={setTab}
          ariaLabel="Search zone status"
        />
      </div>

      {/*
        Natural height: the list only becomes a scroll container once there are
        more zones than fit comfortably, so no scrollbar appears when it fits.
      */}
      <div
        className={`min-h-0 flex-1 space-y-2 p-2.5 ${
          shown.length > 4 ? 'overflow-y-auto' : ''
        }`}
      >
        {selected ? (
          <>
            <ZoneDetail area={selected} />
            {others.map((a) => (
              <ZoneRow key={a.id} area={a} onSelect={() => select(a)} />
            ))}
          </>
        ) : (
          <EmptyState
            title={tab === 'active' ? 'No active zones' : 'No completed zones'}
            detail={
              tab === 'active'
                ? 'Add a search zone to plan coverage for this mission.'
                : 'Zones appear here once their sweep reaches full coverage.'
            }
          />
        )}
      </div>
    </section>
  );
}
