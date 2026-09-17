import { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

/** Metric scale bar, bottom right, out of the legend's way. */
export function MapScale() {
  const map = useMap();
  useEffect(() => {
    const control = L.control.scale({ imperial: false, position: 'bottomright', maxWidth: 120 });
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);
  return null;
}
