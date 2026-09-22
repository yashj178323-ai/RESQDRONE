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
  // Clean emergency-response UI defaults to light; operators can switch to night mode.
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
            surface: '#121D22',
            surfaceSoft: '#18262C',
            border: '#40575F',
            grid: '#2B3E45',
            axis: '#6F878F',
            ink: '#E8F1F3',
            ok: '#3EBE87',
            info: '#47B7C2',
            warn: '#E7AA43',
            action: '#4E9DBF',
            crit: '#EB6565',
            ai: '#9D8FDB',
            drone: '#60A5FA',
            dim: '#6F878F',
          }
        : {
            surface: '#FAFCFC',
            surfaceSoft: '#F2F7F8',
            border: '#CFDBDF',
            grid: '#DCE7EA',
            axis: '#5B6D75',
            ink: '#18252B',
            ok: '#16845B',
            info: '#0F6B78',
            warn: '#CA8419',
            action: '#2B718F',
            crit: '#C23737',
            ai: '#695BA4',
            drone: '#2563EB',
            dim: '#7D8E95',
          },
    [isDark],
  );
}
