import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-edge pb-4">
      <div>
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
