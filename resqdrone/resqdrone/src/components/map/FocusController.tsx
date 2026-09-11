import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapState } from '@/context/AppStore';

/** Flies the map when another panel asks for a location. */
export function FocusController() {
  const map = useMap();
  const { focus } = useMapState();

  useEffect(() => {
    if (!focus) return;
    map.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 0.6 });
    // `nonce` makes repeat requests for the same coordinates fire again.
  }, [focus, map]);

  return null;
}
