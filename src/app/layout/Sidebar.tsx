import { Fragment, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ClipboardCheck,
  Plane,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Radar,
  Settings,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react';
import { useIncidentState } from '@/context/AppStore';

const NAV = [
  { to: '/live-mission', label: 'Live mission', icon: Radar, group: 'Operations' },
  { to: '/dashboard', label: 'Command centre', icon: LayoutDashboard, group: 'Operations' },
  { to: '/detections', label: 'Detections', icon: TriangleAlert, group: 'Operations', badge: true },
  { to: '/incidents', label: 'Incidents', icon: ClipboardCheck, group: 'Operations' },
  { to: '/rescue-teams', label: 'Rescue teams', icon: Users, group: 'Operations' },
  { to: '/missions', label: 'Missions', icon: ClipboardList, group: 'Records' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, group: 'Records' },
  { to: '/fleet', label: 'Fleet', icon: Plane, group: 'Operations' },
  { to: '/reports', label: 'Reports', icon: FileText, group: 'Records' },
  { to: '/audit', label: 'Audit log', icon: ClipboardCheck, group: 'Records' },
  { to: '/settings', label: 'Settings', icon: Settings, group: 'Records' },
];

/** The rail carries every destination; the drawer adds grouping and labels. */
const RAIL = NAV;
const GROUPS = ['Operations', 'Records'];

/**
 * A 64px operations rail, not a navigation panel. Full navigation lives in an
 * overlay drawer so the map keeps its width, and system status moved to the
 * System tab where it belongs.
 */
export function Sidebar() {
  const { detections } = useIncidentState();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  const pending = detections.filter(
    (d) => d.verification === 'PENDING' || d.verification === 'UNDER_REVIEW',
  ).length;

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    drawerRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav
        aria-label="Operations rail"
        className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r border-edge bg-panel py-3 lg:flex"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          aria-expanded={open}
          className="mb-2 grid h-10 w-10 place-items-center rounded-control text-muted transition-colors ease-ui hover:bg-panel2 hover:text-ink"
        >
          <Menu size={19} strokeWidth={1.8} aria-hidden />
        </button>

        <span className="mb-1 h-px w-8 bg-edge" aria-hidden />

        {RAIL.map(({ to, label, icon: Icon, badge, group }, i) => (
          <Fragment key={to}>
          {i > 0 && NAV[i - 1].group !== group && (
            <span key={`sep-${group}`} className="my-1 h-px w-8 bg-edge" aria-hidden />
          )}
          <NavLink
            to={to}
            title={label}
            aria-label={label}
            className={({ isActive }) =>
              `group relative grid h-10 w-10 place-items-center rounded-control transition-colors ease-ui ${
                isActive
                  ? 'bg-brand/12 text-brand'
                  : 'text-muted hover:bg-panel2 hover:text-ink'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden />
            {/* Destination name on hover and on keyboard focus. */}
            <span className="pointer-events-none absolute left-12 z-[1000] hidden whitespace-nowrap rounded-control border border-edge bg-panel px-2 py-1 text-[12px] text-ink shadow-raised group-hover:block group-focus-visible:block">
              {label}
            </span>
            {badge && pending > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-crit px-1 text-[10px] font-bold text-white">
                {pending}
              </span>
            )}
          </NavLink>
          </Fragment>
        ))}
      </nav>

      {open && (
        <div className="fixed inset-0 z-[1100] flex">
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            className="w-72 overflow-y-auto border-r border-edge bg-panel p-3 shadow-raised"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">
                Navigation
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded p-1 text-muted hover:bg-panel2 hover:text-ink"
              >
                <X size={16} strokeWidth={1.8} aria-hidden />
              </button>
            </div>

            {GROUPS.map((group) => (
              <div key={group} className="mb-4">
                <p className="eyebrow mb-1.5 px-1">{group}</p>
                <ul className="space-y-0.5">
                  {NAV.filter((n) => n.group === group).map(({ to, label, icon: Icon, badge }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-control px-3 py-2.5 text-[14px] transition-colors ease-ui ${
                            isActive
                              ? 'bg-panel2 font-medium text-ink [&>svg]:text-brand'
                              : 'text-muted hover:bg-panel2 hover:text-ink'
                          }`
                        }
                      >
                        <Icon size={17} strokeWidth={1.8} aria-hidden />
                        <span className="flex-1">{label}</span>
                        {badge && pending > 0 && (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-crit px-1.5 text-[11px] font-semibold text-white">
                            {pending}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex-1 bg-black/50" onMouseDown={() => setOpen(false)} aria-hidden />
        </div>
      )}
    </>
  );
}
