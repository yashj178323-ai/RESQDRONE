import { memo } from 'react';
import { Marker, Polyline, Tooltip } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { teamIcon } from '../mapIcons';
import type { MarkerPalette } from '../mapIcons';
import type { RescueTeam } from '@/types';
import { formatClockDuration, teamStateMeta } from '@/utils/format';

interface Props {
  teams: RescueTeam[];
  palette: MarkerPalette;
  showRoutes: boolean;
}

function TeamLayerBase({ teams, palette, showRoutes }: Props) {
  return (
    <>
      {showRoutes &&
        teams
          .filter((t) => t.route && (t.state === 'DISPATCHED' || t.state === 'ON_WAY'))
          .map((t) => (
            <Polyline
              key={`route-${t.id}`}
              positions={(t.route ?? []).map((p) => [p.lat, p.lng] as LatLngExpression)}
              pathOptions={{ color: palette.action, weight: 2.5, dashArray: '8 6' }}
            />
          ))}

      {teams.map((t) => {
        const enRoute = t.state === 'DISPATCHED' || t.state === 'ON_WAY';
        return (
          <Marker key={t.id} position={[t.latitude, t.longitude]} icon={teamIcon(t.state, palette)}>
            <Tooltip className="resq-tooltip" direction="top" offset={[0, -12]}>
              <span className="font-mono">
                {t.name} ·{' '}
                {enRoute ? `ETA ${formatClockDuration(t.etaSec)}` : teamStateMeta[t.state].label}
              </span>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

export const TeamLayer = memo(TeamLayerBase);
