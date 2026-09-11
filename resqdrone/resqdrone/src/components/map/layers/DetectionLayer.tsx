import { memo } from 'react';
import { Circle, Marker, Tooltip } from 'react-leaflet';
import { detectionIcon } from '../mapIcons';
import type { MarkerPalette } from '../mapIcons';
import type { Detection, Incident } from '@/types';

interface Props {
  /** Already filtered by the caller according to the active layer toggles. */
  detections: Detection[];
  openIncidents: Incident[];
  showIncidentRings: boolean;
  selectedId: string | null;
  palette: MarkerPalette;
  onSelect: (id: string) => void;
}

/**
 * Unverified detections and confirmed survivors share one pin vocabulary — fill
 * for verification state, ring for priority — but the caller decides which of
 * them are visible, so the layer toggles stay independent.
 */
function DetectionLayerBase({
  detections,
  openIncidents,
  showIncidentRings,
  selectedId,
  palette,
  onSelect,
}: Props) {
  const incidentIds = new Set(openIncidents.map((i) => i.detectionId));

  return (
    <>
      {showIncidentRings &&
        detections
          .filter((d) => incidentIds.has(d.id))
          .map((d) => (
            <Circle
              key={`incident-${d.id}`}
              center={[d.latitude, d.longitude]}
              radius={90}
              pathOptions={{
                color: d.priority === 'P1' ? palette.crit : palette.action,
                weight: 1.5,
                fillColor: d.priority === 'P1' ? palette.crit : palette.action,
                fillOpacity: 0.12,
              }}
            />
          ))}

      {detections.map((d) => (
        <Marker
          key={d.id}
          position={[d.latitude, d.longitude]}
          icon={detectionIcon(d.verification, d.priority, d.id === selectedId, palette)}
          eventHandlers={{ click: () => onSelect(d.id) }}
        >
          <Tooltip className="resq-tooltip" direction="top" offset={[0, -36]}>
            <span className="font-mono">
              {d.id} · {(d.fusedConfidence * 100).toFixed(0)}% · {d.priority}
            </span>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

export const DetectionLayer = memo(DetectionLayerBase);
