interface ProgressBarProps {
  value: number; // 0..100
  tone?: 'ok' | 'info' | 'warn' | 'crit' | 'action' | 'ai';
  label?: string;
  className?: string;
}

const tones: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  ok: 'bg-ok',
  info: 'bg-info',
  warn: 'bg-warn',
  crit: 'bg-crit',
  action: 'bg-action',
  ai: 'bg-ai',
};

export function ProgressBar({ value, tone = 'ok', label, className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-panel3 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`h-full ${tones[tone]}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
