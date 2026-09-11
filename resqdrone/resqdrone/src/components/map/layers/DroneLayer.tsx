import { memo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { droneIcon } from '../mapIcons';
import type { MarkerPalette } from '../mapIcons';
import type { Telemetry } from '@/types';

interface Props {
  telemetry: Telemetry;
  degraded: boolean;
  linkLost: boolean;
  palette: MarkerPalette;
}

/** The only layer that changes on every telemetry tick. */
function DroneLayerBase({ telemetry, degraded, linkLost, palette }: Props) {
  return (
    <Marker
      position={[telemetry.latitude, telemetry.longitude]}
      icon={droneIcon(telemetry.heading, degraded, palette)}
      zIndexOffset={600}
    >
      <Tooltip className="resq-tooltip" direction="top" offset={[0, -18]} permanent>
        <span className="font-mono">
          {telemetry.droneId} · {telemetry.altitude.toFixed(0)} m · {telemetry.speed.toFixed(1)} m/s ·{' '}
          {telemetry.battery.toFixed(0)}%{linkLost ? ' · LAST KNOWN' : ''}
        </span>
      </Tooltip>
    </Marker>
  );
}

export const DroneLayer = memo(DroneLayerBase);
