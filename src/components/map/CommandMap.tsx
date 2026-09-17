import { useCallback, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useTheme } from '@/context/ThemeContext';
import {
  useAppDispatch,
  useDroneState,
  useIncidentState,
  useMapState,
  useMissionState,
  useRescueState,
  useSystemState,
} from '@/context/AppStore';
import { FLIGHT_PATH, PUNE_CENTER } from '@/data/mockData';
import { mapTileUrl } from '@/services/telemetry/telemetryLink';
import {
  MAP_DEFAULT_ZOOM,
  MAP_DETAIL_ZOOM,
  MAP_MAX_ZOOM,
  PATH_PROGRESS_EPSILON,
} from '@/config/constants';
import { pointAlongPath } from '@/utils/geo';
import { useMapPalette } from './useMapPalette';
import { MapControls } from './MapControls';
import { FocusController } from './FocusController';
import { MapScale } from './MapScale';
import { SearchAreaLayer } from './layers/SearchAreaLayer';
import { CoverageLayer } from './layers/CoverageLayer';
import { FlightPathLayer } from './layers/FlightPathLayer';
import { DroneLayer } from './layers/DroneLayer';
import { DetectionLayer } from './layers/DetectionLayer';
import { TeamLayer } from './layers/TeamLayer';
import { BaseStationLayer } from './layers/BaseStationLayer';
import type { LatLng, SearchArea } from '@/types';

const TILES = {
  MAP: { url: mapTileUrl, attribution: '&copy; OpenStreetMap contributors', themed: true },
  SATELLITE: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri',
    themed: false,
  },
  TERRAIN: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; OpenStreetMap contributors, SRTM · style OpenTopoMap',
    themed: true,
  },
};

function samplePath(from: number, to: number, steps: number): LatLng[] {
  const points: LatLng[] = [];
  for (let i = 0; i <= steps; i += 1) {
    points.push(pointAlongPath(FLIGHT_PATH, from + ((to - from) * i) / steps).point);
  }
  return points;
}

/**
 * Composition root for the tactical map. It owns data selection and geometry
 * derivation; every visual layer below is a memoised, props-driven component, so
 * a telemetry tick only re-renders the drone marker.
 */
export function CommandMap({ className = '' }: { className?: string }) {
  const dispatch = useAppDispatch();
  const { isDark } = useTheme();
  const palette = useMapPalette();

  const { telemetry, pathProgress } = useDroneState();
  const { areas, selectedAreaId } = useMissionState();
  const { detections, incidents, selectedDetectionId } = useIncidentState();
  const { teams } = useRescueState();
  const { connection } = useSystemState();
  const { base, layers } = useMapState();

  const tiles = TILES[base];
  const selectedArea: SearchArea | undefined =
    areas.find((a) => a.id === selectedAreaId) ?? areas[0];
  const linkLost = connection.droneLink === 'LOST';
  const gpsDegraded = connection.gps !== 'LOCKED';

  /** Quantised so the polylines are rebuilt on visible movement, not every tick. */
  const progressStep =
    Math.round(pathProgress / PATH_PROGRESS_EPSILON) * PATH_PROGRESS_EPSILON;

  const flown = useMemo(() => samplePath(0, progressStep, 60), [progressStep]);
  const remaining = useMemo(() => samplePath(progressStep, 1, 40), [progressStep]);

  const coveragePolygon = useMemo(() => {
    if (!selectedArea) return [];
    const lats = selectedArea.polygon.map((p) => p.lat);
    const lngs = selectedArea.polygon.map((p) => p.lng);
    const maxLat = Math.max(...lats);
    const minLat = Math.min(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const cut = maxLat - (maxLat - minLat) * (selectedArea.progress / 100);
    return [
      { lat: maxLat, lng: minLng },
      { lat: maxLat, lng: maxLng },
      { lat: cut, lng: maxLng },
      { lat: cut, lng: minLng },
    ];
  }, [selectedArea]);

  /** Layer toggles are independent: unverified output and confirmed survivors
   *  are different classes of information and hide separately. */
  const visibleDetections = useMemo(
    () =>
      detections.filter((d) =>
        d.verification === 'CONFIRMED' ? layers.survivors : layers.detections,
      ),
    [detections, layers.detections, layers.survivors],
  );

  const openIncidents = useMemo(
    () => incidents.filter((i) => i.state === 'OPEN' || i.state === 'DISPATCHED'),
    [incidents],
  );

  const selectArea = useCallback(
    (areaId: string) => dispatch({ type: 'mission/selectArea', areaId }),
    [dispatch],
  );

  const selectDetection = useCallback(
    (detectionId: string) => dispatch({ type: 'incident/select', detectionId }),
    [dispatch],
  );

  const handleSearch = useCallback(
    (query: string) => {
      const q = query.trim().toUpperCase();
      if (!q) return;
      const hit = detections.find((d) => d.id.toUpperCase() === q);
      if (hit) {
        dispatch({ type: 'incident/select', detectionId: hit.id });
        dispatch({ type: 'map/focus', lat: hit.latitude, lng: hit.longitude, zoom: MAP_DETAIL_ZOOM });
        return;
      }
      const area = areas.find((a) => a.name.toUpperCase().includes(q));
      if (area && area.polygon.length >= 3) {
        const lat = area.polygon.reduce((t, pt) => t + pt.lat, 0) / area.polygon.length;
        const lng = area.polygon.reduce((t, pt) => t + pt.lng, 0) / area.polygon.length;
        dispatch({ type: 'mission/selectArea', areaId: area.id });
        dispatch({ type: 'map/focus', lat, lng, zoom: 15 });
      }
    },
    [areas, detections, dispatch],
  );

  return (
    <div className={`relative min-h-0 min-w-0 overflow-hidden rounded-panel border border-edge shadow-card ${className}`}>
      <MapContainer
        center={[PUNE_CENTER.lat, PUNE_CENTER.lng]}
        /*
         * The map sits inside a scrolling page. With wheel-zoom on, Leaflet
         * swallows every wheel gesture over it and the operator can never reach
         * the payload below. Zoom stays available via the on-map buttons and
         * double-click.
         */
        scrollWheelZoom={false}
        zoom={MAP_DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl
        className={`h-full w-full ${tiles.themed && isDark ? 'resq-map' : ''}`}
      >
        <TileLayer url={tiles.url} attribution={tiles.attribution} maxZoom={MAP_MAX_ZOOM} />

        {layers.searchArea && (
          <SearchAreaLayer
            areas={areas}
            selectedAreaId={selectedArea?.id ?? ''}
            palette={palette}
            onSelect={selectArea}
          />
        )}

        {layers.coverage && <CoverageLayer polygon={coveragePolygon} palette={palette} />}

        {layers.flightPath && (
          <FlightPathLayer flown={flown} remaining={remaining} palette={palette} />
        )}

        {layers.teams && <TeamLayer teams={teams} palette={palette} showRoutes />}

        <BaseStationLayer palette={palette} />

        {(layers.detections || layers.survivors || layers.incidents) && (
          <DetectionLayer
            detections={visibleDetections}
            openIncidents={openIncidents}
            showIncidentRings={layers.incidents}
            selectedId={selectedDetectionId}
            palette={palette}
            onSelect={selectDetection}
          />
        )}

        {layers.drones && (
          <DroneLayer
            telemetry={telemetry}
            degraded={linkLost || gpsDegraded}
            linkLost={linkLost}
            palette={palette}
          />
        )}

        <FocusController />
        <MapScale />
        <MapControls onSearch={handleSearch} />
      </MapContainer>


      {linkLost && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-[500] flex justify-center px-4">
          <p className="rounded-control border border-crit/50 bg-crit/15 px-3 py-1.5 text-center text-xs font-semibold text-crit backdrop-blur">
            Drone link lost — the map shows the last known position
          </p>
        </div>
      )}
    </div>
  );
}
