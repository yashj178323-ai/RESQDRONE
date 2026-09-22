import { memo } from 'react';
import { Polyline } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { LatLng } from '@/types';
import type { MarkerPalette } from '../mapIcons';

interface Props {
  flown: LatLng[];
  remaining: LatLng[];
  palette: MarkerPalette;
}

/** Solid for the path already flown, dashed for what is still planned. */
function FlightPathLayerBase({ flown, remaining, palette }: Props) {
  const toLatLngs = (points: LatLng[]) => points.map((p) => [p.lat, p.lng] as LatLngExpression);
  return (
    <>
      <Polyline
        positions={toLatLngs(flown)}
        pathOptions={{ color: palette.ok, weight: 2.5, opacity: 0.9 }}
      />
      <Polyline
        positions={toLatLngs(remaining)}
        pathOptions={{ color: palette.ok, weight: 1.5, opacity: 0.45, dashArray: '5 7' }}
      />
    </>
  );
}

export const FlightPathLayer = memo(FlightPathLayerBase);
