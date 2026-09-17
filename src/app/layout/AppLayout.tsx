import { NavLink, Outlet } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { SimulationProvider } from '@/app/providers/SimulationProvider';
import { CriticalDetectionPopup } from '@/components/incidents/CriticalDetectionPopup';
import { useFocusMode } from '@/hooks/useFocusMode';
import { OperationalStatusBar } from '@/components/system/OperationalStatusBar';

const MOBILE_NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/live-mission', label: 'Live' },
  { to: '/detections', label: 'Detections' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/rescue-teams', label: 'Teams' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/audit', label: 'Audit' },
  { to: '/missions', label: 'Missions' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

export function AppLayout() {
  const { focus } = useFocusMode();

  return (
    <SimulationProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-canvas">
        {!focus && <TopHeader />}
        {!focus && <OperationalStatusBar />}
        <nav
          aria-hidden={focus}
          hidden={focus}
          aria-label="Primary, compact"
          className="flex gap-1 overflow-x-auto border-b border-edge bg-panel px-2 py-2 lg:hidden"
        >
          {MOBILE_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `shrink-0 rounded-control px-3 py-1.5 text-xs ${
                  isActive ? 'seg-active' : 'text-muted'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex min-h-0 min-w-0 flex-1">
          {!focus && <Sidebar />}
          {/*
            The shell never scrolls. Each page decides: the mission workspace
            fills the viewport and scrolls internally, secondary pages scroll
            their own root. This is what stops panels escaping their cell.
          */}
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
        <CriticalDetectionPopup />
      </div>
    </SimulationProvider>
  );
}
