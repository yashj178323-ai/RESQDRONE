import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 overflow-y-auto p-8 text-center">
      <Compass size={28} className="text-info" aria-hidden />
      <h1 className="text-lg font-semibold">That screen is not part of the command centre</h1>
      <p className="max-w-md text-xs text-muted">
        The route you followed does not exist. Return to the command centre to see the live map,
        telemetry and detection queue.
      </p>
      <Link
        to="/dashboard"
        className="rounded-control border border-info/40 bg-info/15 px-3 py-1.5 text-xs font-semibold text-info hover:bg-info/25"
      >
        Go to the command centre
      </Link>
    </div>
  );
}
