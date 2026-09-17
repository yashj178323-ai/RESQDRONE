import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

/**
 * Right-side drawer for secondary controls. Secondary features live here so the
 * mission screen itself stays uncrowded during flight.
 */
export function Drawer({ open, title, onClose, children, width = 'w-[360px]' }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex justify-end">
      <div
        className="flex-1 bg-black/50"
        onMouseDown={onClose}
        role="presentation"
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${width} max-w-full overflow-y-auto border-l border-edge bg-panel shadow-raised`}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-edge bg-panel px-4 py-3">
          <h2 id={titleId} className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded p-1 text-muted hover:bg-panel2 hover:text-ink"
          >
            <X size={15} aria-hidden />
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
