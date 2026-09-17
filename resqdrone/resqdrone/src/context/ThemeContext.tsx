import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'resqdrone.theme';

interface ThemeValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  /** True while the dark palette is active — for canvas and Leaflet colours. */
  isDark: boolean;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable */
  }
  // Dark is the primary operations-room presentation; light stays one click away.
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggle, isDark: theme === 'dark' }),
    [setTheme, theme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Colours for things drawn outside the DOM: Leaflet icons and Recharts axes. */
export function useThemeColors() {
  const { isDark } = useTheme();
  return useMemo(
    () =>
      isDark
        ? {
            surface: '#0D1722',
            surfaceSoft: '#111F2D',
            border: '#2F4458',
            grid: '#223242',
            axis: '#6A7C8E',
            ink: '#E8EEF4',
            ok: '#22C55E',
            info: '#38BDF8',
            warn: '#F59E0B',
            action: '#F97316',
            crit: '#EF4444',
            ai: '#8B5CF6',
            dim: '#6A7C8E',
          }
        : {
            surface: '#FFFFFF',
            surfaceSoft: '#F7F8FA',
            border: '#DCDCDC',
            grid: '#EEEEEE',
            axis: '#8A8A8A',
            ink: '#161616',
            ok: '#0F7A47',
            info: '#2F35E8',
            warn: '#B0760C',
            action: '#C6520F',
            crit: '#C8242A',
            ai: '#5B33C8',
            dim: '#8A8A8A',
          },
    [isDark],
  );
}
