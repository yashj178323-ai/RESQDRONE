/** @type {import('tailwindcss').Config} */

/** Every colour resolves through a CSS variable so both themes share one class set. */
const token = (name) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `rgb(var(--${name}))`
    : `rgb(var(--${name}) / ${opacityValue})`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        panel: token('panel'),
        panel2: token('panel2'),
        panel3: token('panel3'),
        edge: token('edge'),
        edge2: token('edge2'),
        ink: token('ink'),
        muted: token('muted'),
        dim: token('dim'),
        ok: token('ok'),
        info: token('info'),
        warn: token('warn'),
        action: token('action'),
        crit: token('crit'),
        ai: token('ai'),
        brand: token('brand'),
        accent: token('accent'),
        drone: token('drone'),
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
      },
      borderRadius: {
        panel: '7px',
        control: '5px',
      },
      transitionTimingFunction: {
        ui: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
