import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, MoreVertical } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { VerificationCard } from '@/components/incidents/VerificationCard';
import { DetectionQueue } from '@/components/incidents/DetectionQueue';
import { TeamRecommendation } from '@/components/rescue/TeamRecommendation';
import { useIncidentState, useMissionState, useRescueState, useSystemState } from '@/context/AppStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMissionActions } from '@/hooks/useMissionActions';
import { formatTime, priorityMeta, verificationMeta } from '@/utils/format';
import type { Detection, Dispatch, Priority, Verification } from '@/types';
import { isAwaitingReview, verificationLabel } from '@/config/status';

type SortKey = 'confidence' | 'time' | 'priority';

const PRIORITY_ORDER: Record<Priority, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

/** Secondary row actions live behind one menu so the table stays readable. */
function RowMenu({
  detectionId,
  decided,
  canDispatch,
  onVerify,
  onReject,
  onDispatch,
  onMap,
}: {
  detectionId: string;
  decided: boolean;
  canDispatch: boolean;
  onVerify: () => void;
  onReject: () => void;
  onDispatch: () => void;
  onMap: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Flip above the trigger when there is not enough room below.
    const below = window.innerHeight - rect.bottom > 190;
    setPos({
      top: below ? rect.bottom + 6 : rect.top - 6 - 150,
      right: window.innerWidth - rect.right,
    });
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    // A scrolled table would leave the menu stranded, so close on scroll.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const items = [
    { label: 'Verify survivor', run: onVerify, disabled: decided },
    { label: 'Reject detection', run: onReject, disabled: decided },
    { label: 'Dispatch team', run: onDispatch, disabled: !canDispatch },
    { label: 'Show on map', run: onMap, disabled: false },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`More actions for ${detectionId}`}
        aria-expanded={open}
        onClick={() => {
          place();
          setOpen((v) => !v);
        }}
        className="grid h-7 w-7 place-items-center rounded-control border border-edge2 text-muted transition-colors ease-ui hover:text-info"
      >
        <MoreVertical size={13} aria-hidden />
      </button>
      {open && pos && (
        <div
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-[1150] w-40 rounded-control border border-edge bg-panel p-1 shadow-raised"
        >
          {items.map((i) => (
            <button
              key={i.label}
              type="button"
              disabled={i.disabled}
              onClick={() => {
                i.run();
                setOpen(false);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-muted transition-colors ease-ui hover:bg-panel2 hover:text-ink disabled:cursor-not-allowed disabled:text-dim"
            >
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type StepState = 'done' | 'current' | 'pending' | 'skipped';

/** Where this specific detection sits in the confirm → dispatch sequence. */
function workflowSteps(
  detection: Detection,
  dispatches: Dispatch[],
): { label: string; detail: string; state: StepState }[] {
  const v = detection.verification;
  const dispatched = dispatches.find((d) => d.detectionId === detection.id);
  const confirmed = v === 'CONFIRMED';
  const rejected = v === 'FALSE_DETECTION';

  return [
    {
      label: 'AI detection raised',
      detail: `${(detection.fusedConfidence * 100).toFixed(1)}% fused · ${formatTime(detection.timestamp)}`,
      state: 'done',
    },
    {
      label: 'Operator review',
      detail:
        v === 'UNDER_REVIEW'
          ? 'In progress'
          : v === 'PENDING'
            ? 'Awaiting an operator'
            : 'Complete',
      state: v === 'PENDING' ? 'current' : v === 'UNDER_REVIEW' ? 'current' : 'done',
    },
    {
      label: rejected ? 'Marked false detection' : 'Survivor confirmed',
      detail: rejected
        ? (detection.note ?? 'Closed by the operator')
        : confirmed
          ? 'Verified by the operator'
          : 'Confirm, reject or mark uncertain',
      state: confirmed ? 'done' : rejected ? 'skipped' : isAwaitingReview(v) ? 'pending' : 'pending',
    },
    {
      label: 'Rescue team dispatched',
      detail: dispatched
        ? `Dispatched ${formatTime(dispatched.dispatchedAt)}`
        : rejected
          ? 'Not required'
          : 'Available once confirmed',
      state: dispatched ? 'done' : rejected ? 'skipped' : 'pending',
    },
    {
      label: 'Team on scene',
      detail: dispatched?.arrivedAt
        ? `Arrived ${formatTime(dispatched.arrivedAt)}`
        : dispatched
          ? 'En route'
          : rejected
            ? 'Not required'
            : 'Pending dispatch',
      state: dispatched?.arrivedAt ? 'done' : dispatched ? 'current' : rejected ? 'skipped' : 'pending',
    },
  ];
}

export default function DetectionsPage() {
  const { detections, selectedDetectionId } = useIncidentState();
  const { missions, areas } = useMissionState();
  const { teams, recommendation, dispatches } = useRescueState();
  const { health } = useSystemState();
  const actions = useMissionActions();

  const [priority, setPriority] = useState<'ALL' | Priority>('ALL');
  const [status, setStatus] = useState<'ALL' | Verification>('ALL');
  const [mission, setMission] = useState<'ALL' | string>('ALL');
  const [sort, setSort] = useState<SortKey>('priority');

  const rows = useMemo(() => {
    const filtered = detections.filter(
      (d) =>
        (priority === 'ALL' || d.priority === priority) &&
        (status === 'ALL' || d.verification === status) &&
        (mission === 'ALL' || d.missionId === mission),
    );
    const sorted = [...filtered];
    if (sort === 'confidence') sorted.sort((a, b) => b.fusedConfidence - a.fusedConfidence);
    if (sort === 'time') sorted.sort((a, b) => b.timestamp - a.timestamp);
    if (sort === 'priority')
      sorted.sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.timestamp - a.timestamp,
      );
    return sorted;
  }, [detections, mission, priority, sort, status]);

  const selected = detections.find((d) => d.id === selectedDetectionId) ?? rows[0];
  const availableTeam = teams.find((t) => t.state === 'AVAILABLE' || t.state === 'STANDBY');

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <PageHeader
        title="Detections"
        description="Every AI detection stays unverified until an operator decides. Confirmed detections become survivors and open an incident."
      />

      <section aria-label="Detections awaiting operator review" className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-ink">Review queue</h2>
          <p className="text-[12px] text-muted">
            AI output awaiting a human decision — the AI never confirms a survivor on its own.
          </p>
        </div>
        <DetectionQueue
          detections={detections}
          areas={areas}
          selectedId={selectedDetectionId}
          onSelect={actions.selectDetection}
        />
      </section>

      <div className="flex flex-wrap items-end gap-3 border-t border-edge pt-4">
        <label className="text-2xs text-dim">
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'ALL' | Priority)}
            className="mt-1 block rounded-control border border-edge bg-panel2 px-2 py-1 text-xs text-ink"
          >
            <option value="ALL">All priorities</option>
            <option value="P1">P1 — critical</option>
            <option value="P2">P2 — high</option>
            <option value="P3">P3 — medium</option>
            <option value="P4">P4 — low</option>
          </select>
        </label>
        <label className="text-2xs text-dim">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ALL' | Verification)}
            className="mt-1 block rounded-control border border-edge bg-panel2 px-2 py-1 text-xs text-ink"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">{verificationLabel.PENDING}</option>
            <option value="UNDER_REVIEW">{verificationLabel.UNDER_REVIEW}</option>
            <option value="CONFIRMED">{verificationLabel.CONFIRMED}</option>
            <option value="UNCERTAIN">{verificationLabel.UNCERTAIN}</option>
            <option value="FALSE_DETECTION">{verificationLabel.FALSE_DETECTION}</option>
          </select>
        </label>
        <label className="text-2xs text-dim">
          Mission
          <select
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            className="mt-1 block rounded-control border border-edge bg-panel2 px-2 py-1 text-xs text-ink"
          >
            <option value="ALL">All missions</option>
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
          </select>
        </label>
        <label className="text-2xs text-dim">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="mt-1 block rounded-control border border-edge bg-panel2 px-2 py-1 text-xs text-ink"
          >
            <option value="priority">Priority</option>
            <option value="confidence">Confidence</option>
            <option value="time">Most recent</option>
          </select>
        </label>
        <p className="ml-auto text-2xs text-dim">
          {rows.length} of {detections.length} detections
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Full detection log" bodyClassName="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="table-head">
              <tr>
                <th scope="col" className="px-3 py-2">ID</th>
                <th scope="col" className="px-3 py-2">Status</th>
                <th scope="col" className="px-3 py-2">RGB</th>
                <th scope="col" className="px-3 py-2">Thermal</th>
                <th scope="col" className="px-3 py-2">Overall</th>
                <th scope="col" className="px-3 py-2">Priority</th>
                <th scope="col" className="px-3 py-2">Location</th>
                <th scope="col" className="px-3 py-2">Time</th>
                <th scope="col" className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {rows.map((d) => {
                const vMeta = verificationMeta[d.verification];
                const pMeta = priorityMeta[d.priority];
                const decided =
                  d.verification === 'CONFIRMED' || d.verification === 'FALSE_DETECTION';
                return (
                  <tr
                    key={d.id}
                    className={`row-hover ${d.id === selected?.id ? 'bg-panel2' : ''}`}
                    onClick={() => actions.selectDetection(d.id)}
                  >
                    <td className="px-3 py-2 font-mono font-semibold">{d.id}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded border px-1.5 py-0.5 text-2xs ${vMeta.bg} ${vMeta.text} ${vMeta.border}`}>
                        {vMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{(d.rgbConfidence * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2 font-mono">{(d.thermalConfidence * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2 font-mono font-semibold text-ai">
                      {(d.fusedConfidence * 100).toFixed(1)}%
                    </td>
                    <td className={`px-3 py-2 font-semibold ${pMeta.text}`}>{d.priority}</td>
                    <td className="px-3 py-2 font-mono text-dim">
                      {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 font-mono text-dim">{formatTime(d.timestamp)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          icon={<Eye size={10} />}
                          onClick={() => actions.selectDetection(d.id)}
                          aria-label={`View ${d.id}`}
                        >
                          View
                        </Button>
                        <RowMenu
                          detectionId={d.id}
                          decided={decided}
                          canDispatch={d.verification === 'CONFIRMED' && Boolean(availableTeam)}
                          onVerify={() => actions.confirmDetection(d.id)}
                          onReject={() => actions.rejectDetection(d.id)}
                          onDispatch={() => availableTeam && actions.dispatchTeam(availableTeam.id, d.id)}
                          onMap={() => actions.focusOn(d.latitude, d.longitude, 17)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    {health.aiEngine === 'OFFLINE' ? (
                      <EmptyState
                        kind="UNAVAILABLE"
                        title="Detection service unavailable"
                        detail="The AI engine is offline, so no new detections are being produced. Manual monitoring of the live feed remains available."
                      />
                    ) : detections.length === 0 ? (
                      <EmptyState
                        title="No detections yet"
                        detail="Detections appear here as the drone sweeps the search area."
                      />
                    ) : (
                      <EmptyState
                        kind="FILTERED"
                        title="No detections match these filters"
                        detail="Widen the priority, status or mission filter to see more."
                      />
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-3 xl:sticky xl:top-0 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto">
          {recommendation && <TeamRecommendation />}
          {selected && <VerificationCard detection={selected} />}
          {selected && (
            <section className="rounded-panel border border-edge bg-panel">
              <p className="border-b border-edge px-3.5 py-2.5 text-[13px] font-semibold text-ink">
                Verification workflow
              </p>
              <ol className="space-y-0 p-3">
                {workflowSteps(selected, dispatches).map((step) => (
                  <li key={step.label} className="flex gap-3 py-1.5">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full border ${
                        step.state === 'done'
                          ? 'border-ok bg-ok'
                          : step.state === 'current'
                            ? 'border-warn bg-warn'
                            : step.state === 'skipped'
                              ? 'border-edge2 bg-panel2'
                              : 'border-edge2 bg-panel'
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[12px] ${
                          step.state === 'current'
                            ? 'font-medium text-ink'
                            : step.state === 'pending'
                              ? 'text-dim'
                              : 'text-muted'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="block text-[11px] text-dim">{step.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
