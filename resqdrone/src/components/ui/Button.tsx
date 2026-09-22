import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'danger' | 'ghost' | 'ok' | 'warn' | 'ai';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  size?: 'sm' | 'md';
}

/**
 * Primary is a solid accent button; everything else is a white secondary button
 * whose label carries the semantic colour. Restraint over decoration.
 */
const variants: Record<Variant, string> = {
  primary: 'border-brand bg-brand text-white hover:bg-brand/90',
  ghost: 'border-edge2 bg-panel text-ink hover:border-muted hover:text-brand',
  ok: 'border-edge2 bg-panel text-ok hover:border-ok/50 hover:bg-ok/5',
  warn: 'border-edge2 bg-panel text-warn hover:border-warn/50 hover:bg-warn/5',
  danger: 'border-edge2 bg-panel text-crit hover:border-crit/50 hover:bg-crit/5',
  ai: 'border-edge2 bg-panel text-ai hover:border-ai/50 hover:bg-ai/5',
};

export function Button({
  variant = 'ghost',
  icon,
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-control border font-medium transition-colors ease-ui disabled:cursor-not-allowed disabled:border-edge disabled:bg-panel2 disabled:text-dim ${
        size === 'sm' ? 'px-2.5 py-1 text-2xs' : 'px-3.5 py-2 text-xs'
      } ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
