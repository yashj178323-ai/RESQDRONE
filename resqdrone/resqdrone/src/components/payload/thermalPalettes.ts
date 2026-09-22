import type { ThermalPalette } from '@/types';

type Stop = [number, [number, number, number]];

/** Colour ramps expressed as stops, interpolated per pixel at draw time. */
const RAMPS: Record<ThermalPalette, Stop[]> = {
  IRONBOW: [
    [0, [0, 0, 12]],
    [0.25, [60, 12, 96]],
    [0.5, [168, 34, 78]],
    [0.72, [232, 96, 20]],
    [0.88, [252, 188, 44]],
    [1, [255, 255, 232]],
  ],
  RAINBOW: [
    [0, [10, 12, 68]],
    [0.25, [16, 120, 200]],
    [0.5, [24, 178, 108]],
    [0.75, [232, 200, 40]],
    [1, [226, 42, 28]],
  ],
  WHITE_HOT: [
    [0, [8, 8, 10]],
    [1, [255, 255, 255]],
  ],
  BLACK_HOT: [
    [0, [255, 255, 255]],
    [1, [8, 8, 10]],
  ],
};

export const PALETTE_LABELS: Record<ThermalPalette, string> = {
  IRONBOW: 'Ironbow',
  RAINBOW: 'Rainbow',
  WHITE_HOT: 'White hot',
  BLACK_HOT: 'Black hot',
};

/** Four-character codes for the compact in-viewport selector. */
export const PALETTE_CODES: Record<ThermalPalette, string> = {
  IRONBOW: 'IRON',
  RAINBOW: 'RBOW',
  WHITE_HOT: 'WHOT',
  BLACK_HOT: 'BHOT',
};

export function samplePalette(palette: ThermalPalette, t: number): [number, number, number] {
  const ramp = RAMPS[palette];
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 1; i < ramp.length; i += 1) {
    const [p0, c0] = ramp[i - 1];
    const [p1, c1] = ramp[i];
    if (clamped <= p1) {
      const k = p1 === p0 ? 0 : (clamped - p0) / (p1 - p0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * k),
        Math.round(c0[1] + (c1[1] - c0[1]) * k),
        Math.round(c0[2] + (c1[2] - c0[2]) * k),
      ];
    }
  }
  return ramp[ramp.length - 1][1];
}

export function paletteCss(palette: ThermalPalette): string {
  const stops = RAMPS[palette]
    .map(([p, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${(p * 100).toFixed(0)}%`)
    .join(', ');
  return `linear-gradient(to top, ${stops})`;
}
