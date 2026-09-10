import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Battery, Bell, LogOut, Moon, ShieldAlert, Sun } from 'lucide-react';
import { useAppDispatch, useDroneState, useMissionState, useSystemState } from '@/context/AppStore';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useClock } from '@/hooks/useClock';
import { BATTERY_CRITICAL_PCT, BATTERY_WARN_PCT } from '@/config/constants';
import { formatTime, humanise } from '@/utils/format';
import type { TelemetryLinkState } from '@/types';

function batteryTone(pct: number): { text: string; bar: string; label: string } {
  if (pct <= BATTERY_CRITICAL_PCT) return { text: 'text-crit', bar: 'bg-crit', label: 'Critical' };
  if (pct <= BATTERY_WARN_PCT) return { text: 'text-warn', bar: 'bg-warn', label: 'Low' };
  return { text: 'text-ink', bar: 'bg-ok', label: 'Nominal' };
}

const LINK: Record<TelemetryLinkState, { label: string; sub: string; dot: string }> = {
  LOCAL_SIMULATOR: { label: 'Local mode', sub: 'Simulated', dot: 'bg-warn' },
  CONNECTING: { label: 'Connecting', sub: 'Simulated', dot: 'bg-warn' },
  CONNECTED: { label: 'Backend link', sub: 'Live', dot: 'bg-ok' },
  DEGRADED: { label: 'Degraded', sub: 'Simulated', dot: 'bg-warn' },
  OFFLINE: { label: 'Backend down', sub: 'Simulated', dot: 'bg-crit' },
};

/** Vertical divider between header groups. */
function Rule() {
  return <span className="hidden h-9 w-px shrink-0 bg-edge md:block" aria-hidden />;
}

/**
 * Context only: who we are, what mission is running, is the drone up, is the
 * data real, how much power is left, who is flying. Zone coverage, target
 * counts and satellites belong to the workspace, not here.
 */
export function TopHeader() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { telemetry } = useDroneState();
  const { missions, activeMissionId } = useMissionState();
  const { connection, alerts } = useSystemState();
  const { isDark, toggle } = useTheme();
  const { session, logout } = useAuth();
  const now = useClock();

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!alertsOpen && !operatorOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node)) {
        setAlertsOpen(false);
        setOperatorOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAlertsOpen(false);
        setOperatorOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [alertsOpen, operatorOpen]);

  const mission = missions.find((m) => m.id === activeMissionId);
  const unread = alerts.filter((a) => !a.read).length;
  const critical = alerts.filter((a) => !a.read && a.level === 'CRITICAL').length;
  const battery = batteryTone(telemetry.battery);
  const minutesLeft = Math.round((telemetry.battery / 100) * 34);
  const droneUp = connection.droneLink === 'CONNECTED';
  const link = LINK[connection.telemetryLink];

  return (
    <header className="z-[900] flex h-[72px] shrink-0 items-center gap-3 border-b border-edge bg-panel px-3 md:gap-4 md:px-4">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-control bg-info text-white">
          <ShieldAlert size={17} strokeWidth={1.8} aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-bold tracking-[0.1em] text-ink">RESQDRONE</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">
            Command
          </p>
        </div>
      </div>

      <Rule />

      <div className="hidden min-w-0 leading-tight md:block">
        <p className="flex items-center gap-2 truncate text-[14px] font-medium text-ink">
          {mission?.name ?? 'No mission'}
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              mission?.status === 'ACTIVE' ? 'bg-ok' : 'bg-dim'
            }`}
            aria-hidden
          />
        </p>
        <p className="truncate text-[11px] text-dim">
          {mission ? `${humanise(mission.disaster)} · Mula riverside` : 'Select a mission'}
        </p>
      </div>

      <Rule />

      <div className="hidden shrink-0 leading-tight lg:block">
        <p className="flex items-center gap-2 font-mono text-[13px] text-ink">
          <span
            className={`h-1.5 w-1.5 rounded-full ${droneUp ? 'bg-ok' : 'bg-crit'}`}
            aria-hidden
          />
          {telemetry.droneId}
        </p>
        <p className="text-[11px] uppercase tracking-[0.08em] text-dim">
          {droneUp ? humanise(telemetry.missionStatus) : 'Link lost'}
        </p>
      </div>

      <Rule />

      <div className="hidden shrink-0 leading-tight lg:block">
        <p className="flex items-center gap-2 text-[13px] text-ink">
          <span className={`h-1.5 w-1.5 rounded-full ${link.dot}`} aria-hidden />
          {link.label}
        </p>
        <p className="text-[11px] uppercase tracking-[0.08em] text-warn">{link.sub}</p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <Battery size={15} strokeWidth={1.8} className={battery.text} aria-hidden />
          <div className="leading-tight">
            <p className={`font-mono text-[14px] font-semibold ${battery.text}`}>
              {telemetry.battery.toFixed(0)}%
              <span className="sr-only"> battery, {battery.label}</span>
            </p>
            <div className="mt-0.5 h-0.5 w-12 overflow-hidden rounded-full bg-panel3">
              <div className={`h-full ${battery.bar}`} style={{ width: `${telemetry.battery}%` }} />
            </div>
          </div>
          <span className="hidden text-[11px] text-dim xl:block">~{minutesLeft} min</span>
        </div>

        <div className="hidden leading-tight sm:block">
          <p className="font-mono text-[14px] font-semibold text-ink">{formatTime(now.getTime())}</p>
          <p className="text-[10px] text-dim">
            {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div ref={popRef} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Switch to the light theme' : 'Switch to the dark theme'}
            className="grid h-8 w-8 place-items-center rounded-control text-muted transition-colors ease-ui hover:bg-panel2 hover:text-info"
          >
            {isDark ? <Sun size={15} strokeWidth={1.8} aria-hidden /> : <Moon size={15} strokeWidth={1.8} aria-hidden />}
          </button>

          <div className="relative">
            <button
              type="button"
              aria-label={`Alerts, ${unread} unread, ${critical} critical`}
              aria-expanded={alertsOpen}
              onClick={() => {
                setOperatorOpen(false);
                setAlertsOpen((v) => !v);
                if (!alertsOpen) dispatch({ type: 'system/readAlerts' });
              }}
              className="relative grid h-8 w-8 place-items-center rounded-control text-muted transition-colors ease-ui hover:bg-panel2 hover:text-info"
            >
              <Bell size={15} strokeWidth={1.8} aria-hidden />
              {unread > 0 && (
                <span
                  className={`absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white ${
                    critical > 0 ? 'bg-crit' : 'bg-warn'
                  }`}
                >
                  {unread}
                </span>
              )}
            </button>
            {alertsOpen && (
              <div className="absolute right-0 top-11 z-[950] w-80 rounded-panel border border-edge bg-panel p-2 shadow-raised">
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
                  Alerts
                </p>
                {alerts.length === 0 ? (
                  <p className="px-2 py-4 text-center text-[12px] text-dim">No alerts.</p>
                ) : (
                  <ul className="max-h-72 space-y-0.5 overflow-y-auto">
                    {alerts.slice(0, 7).map((a) => (
                      <li
                        key={a.id}
                        className={`rounded px-2 py-1.5 ${a.level === 'CRITICAL' ? 'bg-crit/10' : ''}`}
                      >
                        <p className="text-[12px] text-ink">{a.title}</p>
                        <p className="text-[10px] text-dim">
                          {formatTime(a.at)} · {a.detail ?? humanise(a.level)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              aria-expanded={operatorOpen}
              onClick={() => {
                setAlertsOpen(false);
                setOperatorOpen((v) => !v);
              }}
              className="flex items-center gap-2 rounded-control p-1 transition-colors ease-ui hover:bg-panel2"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-panel3 text-[11px] font-bold text-ink">
                {session?.initials ?? 'OP'}
              </span>
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-[12px] font-medium text-ink">
                  {session?.operatorName ?? 'Operator'}
                </span>
                <span className="block text-[10px] text-dim">{session?.role ?? '—'}</span>
              </span>
            </button>
            {operatorOpen && (
              <div className="absolute right-0 top-11 z-[950] w-56 rounded-panel border border-edge bg-panel p-2 shadow-raised">
                <p className="px-2 pt-1 font-mono text-[11px] text-ink">{session?.operatorId}</p>
                <p className="px-2 pb-2 text-[10px] text-dim">Mission session active</p>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="flex w-full items-center gap-2 rounded-control border-t border-edge px-2 py-2 text-[12px] text-crit transition-colors ease-ui hover:bg-crit/10"
                >
                  <LogOut size={13} strokeWidth={1.8} aria-hidden />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
