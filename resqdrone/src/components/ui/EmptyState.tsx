import type { ReactNode } from 'react';
import { CircleOff, Inbox, TriangleAlert, WifiOff } from 'lucide-react';

export type EmptyKind = 'EMPTY' | 'FILTERED' | 'OFFLINE' | 'UNAVAILABLE' | 'ERROR';

const META: Record<EmptyKind, { icon: typeof Inbox; tone: string }> = {
  EMPTY: { icon: Inbox, tone: 'text-dim' },
  FILTERED: { icon: Inbox, tone: 'text-dim' },
  OFFLINE: { icon: WifiOff, tone: 'text-info' },
  UNAVAILABLE: { icon: CircleOff, tone: 'text-warn' },
  ERROR: { icon: TriangleAlert, tone: 'text-crit' },
};

/**
 * "Nothing here yet" and "this service is down" mean very different things to an
 * operator, so they never share a message.
 */
export function EmptyState({
  kind = 'EMPTY',
  title,
  detail,
  action,
  className = '',
}: {
  kind?: EmptyKind;
  title: string;
  detail?: string;
  action?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, tone } = META[kind];
  return (
    <div className={`flex flex-col items-center gap-1.5 px-4 py-8 text-center ${className}`}>
      <Icon size={18} className={tone} aria-hidden />
      <p className="text-xs font-semibold text-ink">{title}</p>
      {detail && <p className="max-w-sm text-2xs text-muted">{detail}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}
