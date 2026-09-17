/**
 * The drone, assembled from layered SVG planes inside a CSS 3D scene. Each rotor
 * arm sits on its own transformed plane, so the body genuinely banks and yaws in
 * perspective rather than sliding around as a flat sprite.
 */
export function DroneCraft({ size = 240 }: { size?: number }) {
  return (
    <div className="resq-drone-scene" style={{ width: size, height: size * 0.62 }}>
      <div className="resq-drone-body">
        <svg viewBox="0 0 240 150" className="h-full w-full overflow-visible">
          {/* Arms */}
          <g stroke="rgb(var(--edge2))" strokeWidth="7" strokeLinecap="round">
            <line x1="120" y1="78" x2="46" y2="46" />
            <line x1="120" y1="78" x2="194" y2="46" />
            <line x1="120" y1="78" x2="52" y2="104" />
            <line x1="120" y1="78" x2="188" y2="104" />
          </g>

          {/* Motor housings */}
          {[
            [46, 46],
            [194, 46],
            [52, 104],
            [188, 104],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`}>
              <ellipse cx={cx} cy={cy} rx="9" ry="5" fill="rgb(var(--panel3))" stroke="rgb(var(--edge2))" strokeWidth="1.5" />
              <ellipse
                cx={cx}
                cy={cy - 6}
                rx="30"
                ry="7"
                fill="none"
                stroke="rgb(var(--info))"
                strokeWidth="1.2"
                opacity="0.35"
              />
            </g>
          ))}

          {/* Fuselage */}
          <ellipse cx="120" cy="80" rx="40" ry="19" fill="rgb(var(--panel2))" stroke="rgb(var(--edge2))" strokeWidth="2" />
          <ellipse cx="120" cy="75" rx="30" ry="13" fill="rgb(var(--panel3))" />

          {/* Gimbal payload */}
          <circle cx="120" cy="98" r="11" fill="rgb(var(--panel3))" stroke="rgb(var(--edge2))" strokeWidth="2" />
          <circle cx="120" cy="98" r="5" fill="rgb(var(--info))" opacity="0.75" />

          {/* Navigation lights */}
          <circle cx="46" cy="46" r="3.5" className="resq-nav-light-green" />
          <circle cx="194" cy="46" r="3.5" className="resq-nav-light-green" />
          <circle cx="52" cy="104" r="3.5" className="resq-nav-light-red" />
          <circle cx="188" cy="104" r="3.5" className="resq-nav-light-red" />
        </svg>

        {/* Rotor discs, each on its own 3D plane. */}
        {[
          { x: '19%', y: '30%', delay: '0s' },
          { x: '81%', y: '30%', delay: '-0.11s' },
          { x: '22%', y: '69%', delay: '-0.06s' },
          { x: '78%', y: '69%', delay: '-0.16s' },
        ].map((r) => (
          <span
            key={r.x + r.y}
            className="resq-rotor"
            style={{ left: r.x, top: r.y, animationDelay: r.delay }}
            aria-hidden
          />
        ))}
      </div>

      <span className="resq-drone-shadow" aria-hidden />
    </div>
  );
}
