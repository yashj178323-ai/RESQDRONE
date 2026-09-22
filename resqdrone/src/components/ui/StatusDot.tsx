interface StatusDotProps {
  tone: 'ok' | 'info' | 'warn' | 'action' | 'crit' | 'neutral';
  label: string;
  value?: string;
  className?: string;
}

const dot: Record<StatusDotProps['tone'], string> = {
  ok: 'bg-ok',
  info: 'bg-info',
  warn: 'bg-warn',
  action: 'bg-action',
  crit: 'bg-crit',
  neutral: 'bg-dim',
};

/** Status is always dot + word, never colour alone. */
export function StatusDot({ tone, label, value, className = '' }: StatusDotProps) {
  return (
    <div className={`flex items-center justify-between gap-2 text-xs ${className}`}>
      <span className="flex items-center gap-2 text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${dot[tone]}`} aria-hidden />
        {label}
      </span>
      {value && <span className="font-mono text-2xs text-ink">{value}</span>}
    </div>
  );
}
