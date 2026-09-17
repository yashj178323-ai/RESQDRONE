import { useEffect, useMemo, useRef, useState } from 'react';
import { DroneCraft } from './DroneCraft';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

interface Check {
  key: string;
  label: string;
}

const CHECKS: Check[] = [
  { key: 'telemetry', label: 'Telemetry link' },
  { key: 'gps', label: 'GPS' },
  { key: 'thermal', label: 'Thermal bus' },
  { key: 'camera', label: 'Camera payload' },
  { key: 'map', label: 'Map engine' },
];

const STEP_MS = 260;

/**
 * System boot, not a title sequence. The drone flies in while the station runs
 * its start-up checks; the whole thing is skippable and honest about being a
 * simulation.
 */
export function ResQDroneSplash({ onDone }: { onDone: () => void }) {
  const reduced = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  );
  const [step, setStep] = useState(0);
  const done = useRef(false);

  const finish = useRef(onDone);
  finish.current = onDone;

  useEffect(() => {
    const startDelay = reduced ? 0 : 900;
    const timers: number[] = [];

    CHECKS.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => setStep(i + 1), startDelay + i * (reduced ? 90 : STEP_MS)),
      );
    });

    timers.push(
      window.setTimeout(
        () => {
          if (!done.current) {
            done.current = true;
            finish.current();
          }
        },
        startDelay + CHECKS.length * (reduced ? 90 : STEP_MS) + (reduced ? 200 : 700),
      ),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [reduced]);

  useEffect(() => {
    const skip = () => {
      if (done.current) return;
      done.current = true;
      finish.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') skip();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', skip);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', skip);
    };
  }, []);

  const ready = step >= CHECKS.length;

  return (
    <div
      className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden bg-canvas"
      role="status"
      aria-live="polite"
      aria-label="ResQDrone system starting"
    >
      <div className="resq-grid absolute inset-0 opacity-70" aria-hidden />
      <div
        className="resq-scanline pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-brand/[0.06] to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-col items-center px-6">
        <DroneCraft size={260} />

        <div className="mt-14 text-center">
          <h1>
            <BrandWordmark className="text-3xl" />
          </h1>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand">
            Search · rescue · save lives
          </p>
        </div>

        <ul className="mt-9 w-[300px] space-y-1.5">
          {CHECKS.map((c, i) => {
            const passed = step > i;
            const active = step === i;
            return (
              <li
                key={c.key}
                className={`flex items-center justify-between font-mono text-[11px] transition-opacity duration-300 ${
                  passed || active ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      passed ? 'bg-ok' : active ? 'bg-warn' : 'bg-edge2'
                    }`}
                    aria-hidden
                  />
                  <span className="uppercase tracking-[0.12em] text-muted">{c.label}</span>
                </span>
                <span className={passed ? 'text-ok' : 'text-dim'}>
                  {passed ? 'OK' : active ? '···' : '—'}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 h-px w-[300px] overflow-hidden bg-edge">
          <div
            className="h-full bg-brand transition-[width] duration-300 ease-out"
            style={{ width: `${(step / CHECKS.length) * 100}%` }}
          />
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-dim">
          {ready ? 'System ready' : 'Initialising mission system'}
        </p>
      </div>

      <p className="absolute bottom-7 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
        Simulation build · click or press enter to skip
      </p>
    </div>
  );
}
