import type { ReactNode } from 'react';

interface PanelProps {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({ title, icon, actions, children, className = '', bodyClassName = '' }: PanelProps) {
  return (
    <section className={`panel flex flex-col min-h-0 ${className}`}>
      {(title || actions) && (
        <header className="panel-head shrink-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            {icon}
            <span>{title}</span>
          </div>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
