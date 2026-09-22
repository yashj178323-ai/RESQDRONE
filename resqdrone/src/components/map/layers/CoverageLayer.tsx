import { memo } from 'react';
import { Polygon } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { LatLng } from '@/types';
import type { MarkerPalette } from '../mapIcons';

interface Props {
  polygon: LatLng[];
  palette: MarkerPalette;
}

/** The swept band, sized by the same progress value the mission card reports. */
function CoverageLayerBase({ polygon, palette }: Props) {
  if (polygon.length < 3) return null;
  return (
    <Polygon
      positions={polygon.map((p) => [p.lat, p.lng] as LatLngExpression)}
      pathOptions={{ color: palette.ok, weight: 1, fillColor: palette.ok, fillOpacity: 0.14 }}
    />
  );
}

export const CoverageLayer = memo(CoverageLayerBase);
