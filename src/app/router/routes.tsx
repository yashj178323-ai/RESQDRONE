import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/Login';
import CommandCenterPage from '@/pages/CommandCenter';
import LiveMissionPage from '@/pages/LiveMission';
import DetectionsPage from '@/pages/Detections';
import RescueTeamsPage from '@/pages/RescueTeams';
import MissionsPage from '@/pages/Missions';
import AnalyticsPage from '@/pages/Analytics';
import ReportsPage from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import NotFoundPage from '@/pages/NotFound';
import FleetPage from '@/pages/Fleet';
import AuditPage from '@/pages/Audit';
import IncidentsPage from '@/pages/Incidents';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/live-mission" replace /> },
          { path: 'live-mission', element: <LiveMissionPage /> },
          { path: 'dashboard', element: <CommandCenterPage /> },
          { path: 'detections', element: <DetectionsPage /> },
          { path: 'incidents', element: <IncidentsPage /> },
          { path: 'survivors', element: <Navigate to="/detections" replace /> },
          { path: 'rescue-teams', element: <RescueTeamsPage /> },
          { path: 'fleet', element: <FleetPage /> },
          { path: 'audit', element: <AuditPage /> },
          { path: 'missions', element: <MissionsPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
