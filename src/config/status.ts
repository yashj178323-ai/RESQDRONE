import type { DroneMissionStatus, MissionStatus, Priority, TeamState, Verification } from '@/types';

/**
 * Canonical status vocabulary.
 *
 * Every screen renders states through these maps. Ad-hoc strings like "Pending"
 * or "Verified" drifted from the detection log's own wording, so all display
 * labels now come from here and nowhere else.
 */

export const verificationLabel: Record<Verification, string> = {
  PENDING: 'AI detected',
  UNDER_REVIEW: 'Under review',
  CONFIRMED: 'Confirmed',
  UNCERTAIN: 'Uncertain',
  FALSE_DETECTION: 'False detection',
};

/** Short form for dense rails and badges. */
export const verificationShort: Record<Verification, string> = {
  PENDING: 'AI detected',
  UNDER_REVIEW: 'In review',
  CONFIRMED: 'Confirmed',
  UNCERTAIN: 'Uncertain',
  FALSE_DETECTION: 'False',
};

/** A detection still needing an operator decision. */
export const OPEN_VERIFICATIONS: Verification[] = ['PENDING', 'UNDER_REVIEW', 'UNCERTAIN'];

export function isAwaitingReview(v: Verification): boolean {
  return OPEN_VERIFICATIONS.includes(v);
}

/** Aircraft state — what RQ-01 is doing right now. */
export const droneStatusLabel: Record<DroneMissionStatus, string> = {
  IDLE: 'Idle',
  PREFLIGHT: 'Pre-flight',
  AIRBORNE: 'Airborne',
  SEARCHING: 'Searching',
  RETURNING: 'Returning',
  LANDED: 'Landed',
};

/** Mission state — what the operation as a whole is doing. Not the same thing. */
export const missionStatusLabel: Record<MissionStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  ABORTED: 'Aborted',
};

export const teamStateLabel: Record<TeamState, string> = {
  AVAILABLE: 'Available',
  STANDBY: 'Standby',
  DISPATCHED: 'Dispatched',
  ON_WAY: 'En route',
  ARRIVED: 'On scene',
  UNAVAILABLE: 'Unavailable',
};

export const priorityLabel: Record<Priority, string> = {
  P1: 'P1 — Critical',
  P2: 'P2 — High',
  P3: 'P3 — Medium',
  P4: 'P4 — Low',
};
