import { memo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { baseIcon } from '../mapIcons';
import type { MarkerPalette } from '../mapIcons';
import { BASE_STATION } from '@/data/mockData';

function BaseStationLayerBase({ palette }: { palette: MarkerPalette }) {
  return (
    <Marker position={[BASE_STATION.lat, BASE_STATION.lng]} icon={baseIcon(palette)}>
      <Tooltip className="resq-tooltip" direction="right" offset={[10, 0]} permanent>
        Base station
      </Tooltip>
    </Marker>
  );
}

export const BaseStationLayer = memo(BaseStationLayerBase);
