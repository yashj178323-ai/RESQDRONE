import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldAlert, TriangleAlert } from 'lucide-react';
import { DroneCraft } from '@/components/splash/DroneCraft';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import { useAuth } from '@/context/AuthContext';
import { DEMO_CREDENTIALS } from '@/services/auth/localAuth';

const field =
  'w-full rounded-control border border-edge bg-panel2 px-3 py-2.5 font-mono text-[13px] text-ink placeholder:text-dim focus:border-info focus:outline-none';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authenticated } = useAuth();

  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const idRef = useRef<HTMLInputElement | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/live-mission';

  useEffect(() => {
    if (authenticated) navigate(from, { replace: true });
  }, [authenticated, from, navigate]);

  useEffect(() => {
    idRef.current?.focus();
  }, []);

  const submit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await login({ operatorId, password }, remember);
      navigate(from, { replace: true });
    } catch {
      setError('Invalid operator credentials.');
      setPending(false);
    }
  };

  const fillDemo = () => {
    setOperatorId(DEMO_CREDENTIALS.operatorId);
    setPassword(DEMO_CREDENTIALS.password);
    setError(null);
  };

  return (
    <main className="relative grid min-h-screen grid-cols-1 overflow-hidden bg-canvas lg:grid-cols-[1.1fr_minmax(0,460px)]">
      <div className="resq-grid absolute inset-0 opacity-60" aria-hidden />

      <section className="relative hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-control bg-brand text-white">
            <ShieldAlert size={19} aria-hidden />
          </span>
          <div>
            <BrandWordmark className="text-[18px]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-dim">
              Search · rescue · save lives
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <DroneCraft size={300} />
        </div>

        <div className="max-w-md">
          <p className="text-xl font-semibold leading-snug text-ink">
            AI-assisted aerial search and rescue.
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
            RGB and thermal payloads propose. A human operator verifies, confirms and dispatches.
            The station keeps working when the network does not.
          </p>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
            Simulation build · Smart India Hackathon demonstration
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center border-l border-edge bg-panel p-8">
        <div className="w-full max-w-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
            Operator access
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Sign in to the station
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            Operator credentials unlock the command centre for this session.
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="operatorId"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
              >
                Operator ID
              </label>
              <input
                id="operatorId"
                ref={idRef}
                value={operatorId}
                autoComplete="username"
                onChange={(e) => setOperatorId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="DEMO-OP-01"
                className={field}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="••••••••••••"
                  className={`${field} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-dim hover:text-ink"
                >
                  {reveal ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 accent-info"
              />
              Remember this operator on this device
            </label>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-control border border-crit/40 bg-crit/10 px-3 py-2.5 text-[12px] text-crit"
              >
                <TriangleAlert size={14} className="mt-px shrink-0" aria-hidden />
                <span>
                  <span className="font-semibold uppercase tracking-[0.08em]">Access denied</span>
                  <br />
                  {error}
                </span>
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={pending || !operatorId || !password}
              className="h-11 w-full rounded-control bg-brand text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors ease-ui hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-panel3 disabled:text-dim"
            >
              {pending ? 'Authenticating…' : 'Access command centre'}
            </button>
          </div>

          <div className="mt-7 rounded-panel border border-edge bg-panel2 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
              Demo operator
            </p>
            <dl className="mt-2 space-y-1 font-mono text-[12px]">
              <div className="flex justify-between gap-4">
                <dt className="text-dim">ID</dt>
                <dd className="text-ink">{DEMO_CREDENTIALS.operatorId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-dim">Password</dt>
                <dd className="text-ink">{DEMO_CREDENTIALS.password}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={fillDemo}
              className="mt-3 w-full rounded-control border border-edge2 py-2 text-[12px] font-medium text-info transition-colors ease-ui hover:bg-panel3"
            >
              Use demo credentials
            </button>
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-dim">
            This is a frontend demonstration session stored in your browser. It is not secure
            authentication and performs no server-side verification.
          </p>
        </div>
      </section>
    </main>
  );
}
