import { useIncidentState } from '@/context/AppStore';
import { isAwaitingReview } from '@/config/status';
import type { Detection } from '@/types';

const PRIORITY_ORDER: Record<Detection['priority'], number> = { P1: 0, P2: 1, P3: 2, P4: 3 };

/**
 * The one detection the station is currently tracking.
 *
 * This is the single source of truth for both the payload overlay and the
 * Target panel. Previously each derived its own answer, so the RGB feed could
 * draw a bounding box for DET-004 while the Target panel insisted there was no
 * target. Anything that renders a live box must read from here.
 *
 * Resolution order: the operator's selection if it still needs a decision,
 * otherwise the highest-priority detection awaiting review.
 */
export function useActiveTarget(): Detection | undefined {
  const { detections, selectedDetectionId } = useIncidentState();

  const selected = detections.find((d) => d.id === selectedDetectionId);
  if (selected && isAwaitingReview(selected.verification)) return selected;

  return [...detections]
    .filter((d) => isAwaitingReview(d.verification))
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.timestamp - a.timestamp,
    )[0];
}
