import { ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSystemState } from '@/context/AppStore';
import { useAuth } from '@/context/AuthContext';
import { formatTime } from '@/utils/format';

export default function AuditPage() {
  const { audit } = useSystemState();
  const { session } = useAuth();
  return (
    <div className="h-full overflow-y-auto p-4">
      <PageHeader title="Audit log" description="Operator-attributed operational actions for after-action review. This prototype keeps the log in runtime state; a production deployment should persist it server-side." />
      <Panel title={`Events · ${audit.length}`}>
        {audit.length === 0 ? <EmptyState title="No operational events yet" detail="Verification, dispatch, mission and system actions will appear here." icon={<ClipboardCheck size={18} />} /> : (
          <div className="divide-y divide-edge">
            {audit.map((event) => (
              <div key={event.id} className="grid gap-2 p-3 sm:grid-cols-[90px_120px_1fr]">
                <p className="font-mono text-[11px] text-dim">{formatTime(event.at)}</p>
                <p className="text-[11px] font-semibold uppercase text-muted">{event.action}</p>
                <div><p className="text-[12px] text-ink">{event.detail}</p><p className="mt-0.5 font-mono text-[10px] text-dim">{event.operatorId} · {event.role}</p></div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <p className="mt-3 text-[11px] text-dim">Current operator: {session?.operatorId ?? '—'} · Production audit storage must be immutable and server-controlled.</p>
    </div>
  );
}
