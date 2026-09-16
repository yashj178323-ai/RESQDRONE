/**
 * The ResQDrone wordmark. Mixed case with an olive Q — one definition, used by
 * the header, login and splash so the brand can never drift between them.
 */
export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight text-ink ${className}`}>
      Res<span className="text-brand">Q</span>Drone
    </span>
  );
}
