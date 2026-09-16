import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'ok' | 'info' | 'warn' | 'action' | 'crit' | 'ai' | 'neutral';
  icon?: ReactNode;
  className?: string;
}

/** Light tint, coloured label, no loud fills. */
const tones: Record<NonNullable<BadgeProps['tone']>, string> = {
  ok: 'text-ok bg-ok/8 border-ok/25',
  info: 'text-info bg-info/8 border-info/25',
  warn: 'text-warn bg-warn/8 border-warn/25',
  action: 'text-action bg-action/8 border-action/25',
  crit: 'text-crit bg-crit/8 border-crit/25',
  ai: 'text-ai bg-ai/8 border-ai/25',
  neutral: 'text-muted bg-panel2 border-edge',
};

export function Badge({ children, tone = 'neutral', icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-medium ${tones[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
