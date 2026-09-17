import L from 'leaflet';
import type { Priority, TeamState, Verification } from '@/types';

/** Palette supplied by the active theme so markers read on either background. */
export interface MarkerPalette {
  surface: string;
  border: string;
  ok: string;
  info: string;
  warn: string;
  action: string;
  crit: string;
  ai: string;
  drone: string;
  dim: string;
}

function icon(html: string, size: [number, number], anchor: [number, number]) {
  return L.divIcon({ html, className: 'resq-marker', iconSize: size, iconAnchor: anchor });
}

/** Quad-rotor silhouette; the nose cone shows the current heading. */
export function droneIcon(heading: number, degraded: boolean, p: MarkerPalette) {
  const stroke = degraded ? p.warn : p.drone;
  return icon(
    `<div style="width:46px;height:46px;display:grid;place-items:center;">
      <div style="position:absolute;width:46px;height:46px;border-radius:50%;background:${stroke}22;border:1px solid ${stroke}66;"></div>
      <svg width="30" height="30" viewBox="0 0 32 32" style="transform:rotate(${heading}deg);position:relative;">
        <g stroke="${stroke}" stroke-width="2" fill="none" stroke-linecap="round">
          <path d="M16 3 L19 8 L13 8 Z" fill="${stroke}" stroke="none"/>
          <line x1="9" y1="9" x2="23" y2="23"/>
          <line x1="23" y1="9" x2="9" y2="23"/>
          <circle cx="8" cy="8" r="3.4"/>
          <circle cx="24" cy="8" r="3.4"/>
          <circle cx="8" cy="24" r="3.4"/>
          <circle cx="24" cy="24" r="3.4"/>
          <rect x="12.5" y="12.5" width="7" height="7" rx="1.5" fill="${stroke}" stroke="none"/>
        </g>
      </svg>
    </div>`,
    [46, 46],
    [23, 23],
  );
}

function verificationColor(v: Verification, p: MarkerPalette): string {
  switch (v) {
    case 'PENDING':
      return p.warn;
    case 'UNDER_REVIEW':
      return p.ai;
    case 'CONFIRMED':
      return p.ok;
    case 'UNCERTAIN':
      return p.info;
    default:
      return p.dim;
  }
}

function priorityColor(pr: Priority, p: MarkerPalette): string {
  switch (pr) {
    case 'P1':
      return p.crit;
    case 'P2':
      return p.action;
    case 'P3':
      return p.warn;
    default:
      return p.info;
  }
}

/**
 * Detection pin: fill carries the verification state, the ring carries incident
 * priority, and the glyph repeats the state so colour is never the only signal.
 */
export function detectionIcon(
  verification: Verification,
  priority: Priority,
  selected: boolean,
  p: MarkerPalette,
) {
  const fill = verificationColor(verification, p);
  const ring = priorityColor(priority, p);
  const glyph =
    verification === 'CONFIRMED'
      ? '<path d="M5.5 9.2 L8 11.6 L12.5 6.4" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      : verification === 'FALSE_DETECTION'
        ? '<path d="M6 6 L12 12 M12 6 L6 12" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>'
        : '<path d="M9 4.6 V10 M9 12.2 V13.4" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>';
  return icon(
    `<div style="position:relative;width:34px;height:42px;">
      ${
        selected
          ? `<div style="position:absolute;left:1px;top:5px;width:32px;height:32px;border-radius:50%;background:${ring}33;border:2px solid ${ring};"></div>`
          : ''
      }
      <svg width="34" height="42" viewBox="0 0 34 42">
        <path d="M17 41 L10 24 A9 9 0 1 1 24 24 Z" fill="${fill}" stroke="${ring}" stroke-width="2"/>
        <g transform="translate(8,7)">${glyph}</g>
      </svg>
    </div>`,
    [34, 42],
    [17, 41],
  );
}

function teamColor(state: TeamState, p: MarkerPalette): string {
  switch (state) {
    case 'AVAILABLE':
    case 'ARRIVED':
      return p.ok;
    case 'STANDBY':
      return p.info;
    case 'DISPATCHED':
    case 'ON_WAY':
      return p.action;
    default:
      return p.dim;
  }
}

export function teamIcon(state: TeamState, p: MarkerPalette) {
  const c = teamColor(state, p);
  return icon(
    `<div style="width:28px;height:28px;border-radius:7px;background:${p.surface};border:2px solid ${c};display:grid;place-items:center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round">
        <circle cx="9" cy="7" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 11a3 3 0 1 0 0-6"/><path d="M18 20a6 6 0 0 0-3-5"/>
      </svg>
    </div>`,
    [28, 28],
    [14, 14],
  );
}

export function baseIcon(p: MarkerPalette) {
  const c = p.action;
  return icon(
    `<div style="width:30px;height:30px;border-radius:7px;background:${p.surface};border:2px solid ${c};display:grid;place-items:center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round">
        <path d="M3 10 12 3l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>
      </svg>
    </div>`,
    [30, 30],
    [15, 15],
  );
}
