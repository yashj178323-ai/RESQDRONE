import {
  BatteryLow,
  Flame,
  Snowflake,
  CloudOff,
  FlaskConical,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Satellite,
  ScanEye,
  ShieldCheck,
  Siren,
  Users,
  WifiOff,
} from 'lucide-react';
import { useIncidentState, useRescueState, useSystemState } from '@/context/AppStore';
import { Drawer } from '@/components/ui/Drawer';
import { useMissionActions } from '@/hooks/useMissionActions';
import { Button } from '@/components/ui/Button';

/**
 * Scripted operator scenarios. Everything here changes real application state —
 * nothing is faked at the pixel level.
 */
export function DemoControls({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connection, queue } = useSystemState();
  const { detections } = useIncidentState();
  const { recommendation } = useRescueState();
  const a = useMissionActions();

  const nextPending = detections.find(
    (d) => d.verification === 'PENDING' || d.verification === 'UNDER_REVIEW',
  );

  const actions = [
    { label: 'Start mission', icon: PlayCircle, run: a.startMission },
    { label: 'Force thermal alarm', icon: Flame, run: a.triggerThermalAlarm },
    { label: 'Clear thermal field', icon: Snowflake, run: a.clearThermalAlarm },
    { label: 'Trigger AI detection', icon: ScanEye, run: a.triggerDetection },
    {
      label: 'Confirm survivor',
      icon: ShieldCheck,
      run: () => nextPending && a.confirmDetection(nextPending.id),
      disabled: !nextPending,
    },
    {
      label: 'Dispatch team',
      icon: Users,
      run: a.acceptRecommendation,
      disabled: !recommendation,
    },
    { label: 'GPS accuracy loss', icon: Satellite, run: a.triggerGpsLoss },
    {
      label: connection.internet === 'ONLINE' ? 'Network loss' : 'Restore network',
      icon: connection.internet === 'ONLINE' ? WifiOff : RefreshCw,
      run: connection.internet === 'ONLINE' ? a.triggerNetworkLoss : a.restoreNetwork,
    },
    { label: 'Low battery', icon: BatteryLow, run: a.triggerLowBattery },
    {
      label: connection.droneLink === 'CONNECTED' ? 'Drone link loss' : 'Restore drone link',
      icon: CloudOff,
      run: connection.droneLink === 'CONNECTED' ? a.triggerDroneLinkLoss : a.restoreDroneLink,
    },
    { label: 'Complete mission', icon: Siren, run: a.completeMission },
    { label: 'Replay mission', icon: RotateCcw, run: a.replayMission },
  ];

  return (
    <Drawer open={open} title="Simulation controls" onClose={onClose} width="w-[340px]">
      <p className="mb-3 flex items-center gap-2 rounded-control border border-edge bg-panel2 px-2.5 py-2 text-[11px] text-muted">
        <FlaskConical size={14} strokeWidth={1.8} aria-hidden />
        Demonstration scenarios. Each one changes real application state.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ label, icon: Icon, run, disabled }) => (
          <Button
            key={label}
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={run}
            icon={<Icon size={12} />}
            className="justify-start"
          >
            {label}
          </Button>
        ))}
      </div>
      <p className="mt-4 border-t border-edge pt-3 text-[11px] text-dim">
        {queue.length} event{queue.length === 1 ? '' : 's'} queued locally.
      </p>
    </Drawer>
  );
}
