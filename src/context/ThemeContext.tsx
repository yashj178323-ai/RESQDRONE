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
  // The light field-operations theme is the approved default; dark is one click away.
  return 'light';
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
            surface: '#22221C',
            surfaceSoft: '#2A2A23',
            border: '#524F43',
            grid: '#3D3B32',
            axis: '#7A7466',
            ink: '#E7E3D9',
            ok: '#5A9B63',
            info: '#7C8F58',
            warn: '#D19A45',
            action: '#B79A76',
            crit: '#C8564C',
            ai: '#9B8968',
            drone: '#5B9BD5',
            dim: '#7A7466',
          }
        : {
            surface: '#F4F1EB',
            surfaceSoft: '#ECE7DE',
            border: '#B3A89E',
            grid: '#C9C0B3',
            axis: '#6F6B62',
            ink: '#2E2B26',
            ok: '#3E7A4B',
            info: '#54643A',
            warn: '#B5762A',
            action: '#947A5C',
            crit: '#A33A32',
            ai: '#7A6A4F',
            drone: '#2F6FB5',
            dim: '#8C867B',
          },
    [isDark],
  );
}
