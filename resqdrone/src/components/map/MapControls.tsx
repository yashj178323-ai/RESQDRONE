import { useState } from 'react';
import { useMap } from 'react-leaflet';
import { Crosshair, Layers, Maximize2, Minus, Plus, Search } from 'lucide-react';
import { MapLegendControl } from './MapLegendControl';
import type { BaseLayerKey, MapLayerToggles } from '@/types';
import { useAppDispatch, useMapState } from '@/context/AppStore';
import { PUNE_CENTER } from '@/data/mockData';
import { MAP_DEFAULT_ZOOM } from '@/config/constants';

const BASES: { key: BaseLayerKey; label: string }[] = [
  { key: 'MAP', label: 'Map' },
  { key: 'SATELLITE', label: 'Satellite' },
  { key: 'TERRAIN', label: 'Terrain' },
];

const LAYER_LABELS: { key: keyof MapLayerToggles; label: string }[] = [
  { key: 'drones', label: 'Drones' },
  { key: 'detections', label: 'AI detections' },
  { key: 'survivors', label: 'Confirmed survivors' },
  { key: 'teams', label: 'Teams' },
  { key: 'searchArea', label: 'Search area' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'flightPath', label: 'Flight path' },
];

/** Search, base-layer switch and zoom cluster, drawn over the Leaflet canvas. */
export function MapControls({ onSearch }: { onSearch: (query: string) => void }) {
  const map = useMap();
  const dispatch = useAppDispatch();
  const { base, layers } = useMapState();
  const [query, setQuery] = useState('');
  const [layersOpen, setLayersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const stop = { onMouseDown: (e: React.MouseEvent) => e.stopPropagation() };

  const goFullscreen = () => {
    const el = map.getContainer().parentElement ?? map.getContainer();
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  return (
    <>
      <div
        className="pointer-events-auto absolute left-3 top-3 z-[500] flex flex-wrap items-center gap-2"
        {...stop}
      >
        <div className="flex items-center gap-2 rounded-control border border-edge bg-panel px-3 py-2">
          <Search size={13} strokeWidth={1.8} className="text-dim" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch(query);
            }}
            placeholder="Search location or detection ID"
            aria-label="Search the map"
            className="w-56 bg-transparent text-xs text-ink placeholder:text-dim focus:outline-none"
          />
        </div>
        <div className="flex rounded-control border border-edge bg-panel p-1">
          {BASES.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => dispatch({ type: 'map/setBase', base: b.key })}
              aria-pressed={base === b.key}
              className={`rounded-md px-3 py-1.5 text-2xs font-semibold transition-colors ${
                base === b.key ? 'seg-active' : 'text-muted hover:text-ink'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-auto absolute right-3 top-3 z-[500] flex flex-col items-end gap-2" {...stop}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayersOpen((v) => !v)}
            aria-expanded={layersOpen}
            aria-label="Map layers"
            className="flex h-9 w-9 items-center justify-center rounded-control border border-edge bg-panel text-muted transition-colors ease-ui hover:text-info"
          >
            <Layers size={16} strokeWidth={1.8} aria-hidden />
          </button>
          {layersOpen && (
            <div className="absolute right-0 top-11 w-44 rounded-control border border-edge bg-panel p-2 shadow-raised">
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">Layers</p>
              {LAYER_LABELS.map((l) => (
                <label
                  key={l.key}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-muted transition-colors ease-ui hover:text-ink"
                >
                  <input
                    type="checkbox"
                    checked={layers[l.key]}
                    onChange={() => dispatch({ type: 'map/toggleLayer', key: l.key })}
                    className="h-3 w-3 accent-info"
                  />
                  {l.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <MapLegendControl />
      </div>

      <div
        className="pointer-events-auto absolute right-3 top-1/2 z-[500] flex -translate-y-1/2 flex-col items-end gap-2"
        {...stop}
      >
        <div className="flex flex-col overflow-hidden rounded-control border border-edge bg-panel">
          <button
            type="button"
            onClick={() => map.zoomIn()}
            aria-label="Zoom in"
            className="flex h-9 w-9 items-center justify-center text-muted transition-colors ease-ui hover:text-info"
          >
            <Plus size={16} strokeWidth={1.8} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => map.zoomOut()}
            aria-label="Zoom out"
            className="flex h-9 w-9 items-center justify-center border-t border-edge text-muted transition-colors ease-ui hover:text-info"
          >
            <Minus size={16} strokeWidth={1.8} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={() => map.flyTo([PUNE_CENTER.lat, PUNE_CENTER.lng], MAP_DEFAULT_ZOOM)}
          aria-label="Centre on mission area"
          className="flex h-9 w-9 items-center justify-center rounded-control border border-edge bg-panel text-muted transition-colors ease-ui hover:text-info"
        >
          <Crosshair size={16} strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      <div className="pointer-events-auto absolute bottom-10 right-3 z-[500]" {...stop}>
        <button
          type="button"
          onClick={goFullscreen}
          aria-label="Toggle fullscreen map"
          className="flex h-9 w-9 items-center justify-center rounded-control border border-edge bg-panel text-muted transition-colors ease-ui hover:text-info"
        >
          <Maximize2 size={16} strokeWidth={1.8} aria-hidden />
        </button>
      </div>
    </>
  );
}
