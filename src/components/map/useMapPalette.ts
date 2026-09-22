import { useThemeColors } from '@/context/ThemeContext';
import type { MarkerPalette } from './mapIcons';

/** Marker and overlay colours for the active theme. */
export function useMapPalette(): MarkerPalette {
  const c = useThemeColors();
  return {
    surface: c.surface,
    border: c.border,
    ok: c.ok,
    info: c.info,
    warn: c.warn,
    action: c.action,
    crit: c.crit,
    ai: c.ai,
    drone: c.drone,
    dim: c.dim,
  };
}
