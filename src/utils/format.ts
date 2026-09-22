import type { AlertLevel, Priority, TeamState, Verification } from '@/types';
import { priorityLabel, teamStateLabel, verificationLabel } from '@/config/status';

export const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

/** 754 -> "12m 34s" */
export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return `${m}m ${pad(r)}s`;
}

/** 252 -> "04:12" */
export function formatClockDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${pad(s / 60)}:${pad(s % 60)}`;
}

export function formatTime(ts: number | null | undefined): string {
  if (!ts) return '--:--';
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTimeSeconds(ts: number | null | undefined): string {
  if (!ts) return '--:--:--';
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCoord(lat: number, lng: number, digits = 5): string {
  return `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`;
}

export function pct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

/** Compass heading -> cardinal label, so heading is not colour/number only. */
export function headingLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

/* ------------------------------ Semantic colour maps ------------------------------ */

export const priorityMeta: Record<Priority, { label: string; text: string; bg: string; border: string }> = {
  P1: { label: priorityLabel.P1, text: 'text-crit', bg: 'bg-crit/8', border: 'border-crit/25' },
  P2: { label: priorityLabel.P2, text: 'text-action', bg: 'bg-action/8', border: 'border-action/25' },
  P3: { label: priorityLabel.P3, text: 'text-warn', bg: 'bg-warn/8', border: 'border-warn/25' },
  P4: { label: priorityLabel.P4, text: 'text-info', bg: 'bg-info/8', border: 'border-info/25' },
};

/** Labels come from config/status.ts; this map only carries presentation. */
export const verificationMeta: Record<
  Verification,
  { label: string; text: string; bg: string; border: string }
> = {
  PENDING: { label: verificationLabel.PENDING, text: 'text-warn', bg: 'bg-warn/8', border: 'border-warn/25' },
  UNDER_REVIEW: { label: verificationLabel.UNDER_REVIEW, text: 'text-ai', bg: 'bg-ai/8', border: 'border-ai/25' },
  CONFIRMED: { label: verificationLabel.CONFIRMED, text: 'text-ok', bg: 'bg-ok/8', border: 'border-ok/25' },
  FALSE_DETECTION: {
    label: verificationLabel.FALSE_DETECTION,
    text: 'text-dim',
    bg: 'bg-panel2',
    border: 'border-edge',
  },
  UNCERTAIN: { label: verificationLabel.UNCERTAIN, text: 'text-info', bg: 'bg-info/8', border: 'border-info/25' },
};

export const teamStateMeta: Record<TeamState, { label: string; text: string; bg: string }> = {
  AVAILABLE: { label: teamStateLabel.AVAILABLE, text: 'text-ok', bg: 'bg-ok/8' },
  STANDBY: { label: teamStateLabel.STANDBY, text: 'text-info', bg: 'bg-info/8' },
  DISPATCHED: { label: teamStateLabel.DISPATCHED, text: 'text-action', bg: 'bg-action/8' },
  ON_WAY: { label: teamStateLabel.ON_WAY, text: 'text-action', bg: 'bg-action/8' },
  ARRIVED: { label: teamStateLabel.ARRIVED, text: 'text-ok', bg: 'bg-ok/8' },
  UNAVAILABLE: { label: teamStateLabel.UNAVAILABLE, text: 'text-dim', bg: 'bg-panel2' },
};

export const alertMeta: Record<AlertLevel, { text: string; bg: string; border: string }> = {
  CRITICAL: { text: 'text-crit', bg: 'bg-crit/8', border: 'border-crit/25' },
  WARNING: { text: 'text-warn', bg: 'bg-warn/8', border: 'border-warn/25' },
  INFO: { text: 'text-info', bg: 'bg-info/8', border: 'border-info/25' },
  SUCCESS: { text: 'text-ok', bg: 'bg-ok/8', border: 'border-ok/25' },
};

export function humanise(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
