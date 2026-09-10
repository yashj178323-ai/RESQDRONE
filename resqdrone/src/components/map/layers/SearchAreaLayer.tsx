import { memo } from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { MarkerPalette } from '../mapIcons';
import type { SearchArea } from '@/types';

interface Props {
  areas: SearchArea[];
  selectedAreaId: string;
  palette: MarkerPalette;
  onSelect: (areaId: string) => void;
}

/** Planned search polygons. Geometry is static, so this rarely re-renders. */
function SearchAreaLayerBase({ areas, selectedAreaId, palette, onSelect }: Props) {
  return (
    <>
      {areas.map((area) => {
        const active = area.id === selectedAreaId;
        const positions = area.polygon.map((p) => [p.lat, p.lng] as LatLngExpression);
        return (
          <Polygon
            key={area.id}
            positions={positions}
            eventHandlers={{ click: () => onSelect(area.id) }}
            pathOptions={{
              color: active ? palette.crit : palette.info,
              weight: active ? 2 : 1,
              dashArray: '6 5',
              fillColor: active ? palette.crit : palette.info,
              fillOpacity: active ? 0.1 : 0.04,
            }}
          >
            <Tooltip className="resq-tooltip" direction="top">
              {area.name} · {area.totalAreaKm2.toFixed(1)} km²
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}

export const SearchAreaLayer = memo(SearchAreaLayerBase);
