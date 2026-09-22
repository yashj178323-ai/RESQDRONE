import { useRef } from 'react';

interface TabsProps<T extends string> {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

/**
 * Roving-focus tablist: arrow keys move between tabs, Home and End jump to the
 * ends, and only the selected tab is in the tab order.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  size = 'md',
  className = '',
  ariaLabel,
}: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      move(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      move(tabs.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-1 rounded-control border border-edge bg-panel2 p-1 ${className}`}
    >
      {tabs.map((t, i) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(t.key)}
            className={`flex-1 rounded px-2 ${
              size === 'sm' ? 'py-1 text-2xs' : 'py-1.5 text-xs'
            } font-medium transition-colors ease-ui ${
              isActive
                ? 'border border-edge bg-panel text-ink'
                : 'border border-transparent text-muted hover:text-info'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
