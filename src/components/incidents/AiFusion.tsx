import type { Detection } from '@/types';

interface Props {
  detection: Detection;
  thermalAvailable: boolean;
}

function Signal({
  label,
  value,
  tone,
  unavailable,
}: {
  label: string;
  value: number;
  tone: string;
  unavailable?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-muted">{label}</span>
        <span className={`font-mono text-sm font-semibold ${unavailable ? 'text-dim' : 'text-ink'}`}>
          {unavailable ? 'n/a' : `${(value * 100).toFixed(0)}%`}
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-panel3">
        <div
          className={`h-full ${unavailable ? 'bg-edge2' : tone}`}
          style={{ width: `${unavailable ? 0 : value * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Two sensors feeding one fused score. The layout makes the relationship
 * readable in a glance without claiming anything the model does not produce.
 */
export function AiFusion({ detection, thermalAvailable }: Props) {
  return (
    <div className="rounded-panel border border-edge bg-panel2 p-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-semibold leading-none text-crit">
            {(detection.fusedConfidence * 100).toFixed(1)}%
          </span>
          <span className="pb-0.5 text-[10px] leading-tight text-muted">
            fused
            <br />
            confidence
          </span>
        </div>
        <span className="eyebrow">AI fusion</span>
      </div>

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-panel3">
        <div
          className="h-full bg-crit"
          style={{ width: `${detection.fusedConfidence * 100}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 border-t border-edge pt-2.5">
        <Signal label="RGB model" value={detection.rgbConfidence} tone="bg-info" />
        <Signal
          label="Thermal model"
          value={detection.thermalConfidence}
          tone="bg-ai"
          unavailable={!thermalAvailable}
        />
      </div>

      {!thermalAvailable && (
        <p className="mt-2.5 text-[11px] text-warn">
          Thermal sensor offline — this score rests on RGB alone.
        </p>
      )}
    </div>
  );
}
