import { useEffect, useRef } from 'react';

export type CameraMode = 'RGB' | 'THERMAL';

interface SimulatedCameraProps {
  mode: CameraMode;
  /** Pauses the animation, e.g. when the drone link is lost. */
  frozen?: boolean;
  className?: string;
}

const W = 480;
const H = 270;

/**
 * A procedurally drawn stand-in for the downlink video. It is deliberately
 * synthetic: no photograph is passed off as a live camera connection, and the
 * surrounding UI always labels the frame as simulated.
 */
export function SimulatedCamera({ mode, frozen = false, className = '' }: SimulatedCameraProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let last = 0;
    const draw = (now: number) => {
      raf.current = requestAnimationFrame(draw);
      if (now - last < 1000 / 12) return; // 12 fps downlink
      last = now;
      if (!frozen) tRef.current += 0.08;
      const t = tRef.current;

      if (mode === 'RGB') drawFlood(ctx, t);
      else drawThermal(ctx, t);
    };

    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [mode, frozen]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className={`h-full w-full object-cover ${className}`}
      role="img"
      aria-label={
        mode === 'RGB'
          ? 'Simulated RGB camera view of a flooded area'
          : 'Simulated thermal camera view showing a warm human-shaped signature'
      }
    />
  );
}

function drawFlood(ctx: CanvasRenderingContext2D, t: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.4);
  sky.addColorStop(0, '#4b5567');
  sky.addColorStop(1, '#6b7484');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.4);

  // Distant tree line and submerged structures.
  ctx.fillStyle = '#2f3a33';
  for (let i = 0; i < 14; i += 1) {
    const x = i * 38 - 10;
    const h = 22 + Math.sin(i * 2.1) * 8;
    ctx.fillRect(x, H * 0.4 - h, 34, h);
  }
  ctx.fillStyle = '#575f52';
  ctx.fillRect(W * 0.06, H * 0.28, 46, 40);
  ctx.fillRect(W * 0.78, H * 0.31, 58, 36);

  const water = ctx.createLinearGradient(0, H * 0.4, 0, H);
  water.addColorStop(0, '#6d5a3f');
  water.addColorStop(1, '#4a3d2c');
  ctx.fillStyle = water;
  ctx.fillRect(0, H * 0.4, W, H * 0.6);

  ctx.strokeStyle = 'rgba(226, 212, 180, 0.22)';
  ctx.lineWidth = 1.4;
  for (let r = 0; r < 16; r += 1) {
    const y = H * 0.42 + r * 10;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const wave = Math.sin(x * 0.03 + t * (0.6 + r * 0.05) + r) * (1.6 + r * 0.25);
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  // Floating debris drifting with the current.
  ctx.fillStyle = 'rgba(40, 32, 22, 0.8)';
  for (let i = 0; i < 5; i += 1) {
    const x = (t * 9 + i * 120) % (W + 60) - 30;
    const y = H * 0.55 + ((i * 37) % 80);
    ctx.fillRect(x, y, 26, 5);
  }

  // Person, chest-deep, small bobbing motion.
  const px = W * 0.5;
  const py = H * 0.62 + Math.sin(t * 0.9) * 2.2;
  ctx.fillStyle = '#2b2f38';
  ctx.beginPath();
  ctx.ellipse(px, py + 16, 15, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d3227';
  ctx.beginPath();
  ctx.arc(px, py, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2f38';
  ctx.fillRect(px - 20, py + 8, 8, 14);
  ctx.fillRect(px + 12, py + 6, 8, 14);

  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.ellipse(px, py + 26, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawThermal(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, 0, W, H);

  // Cool background texture: water is uniformly cold, banks slightly warmer.
  for (let y = 0; y < H; y += 6) {
    const warmth = 12 + Math.sin(y * 0.05 + t * 0.2) * 6 + (y > H * 0.42 ? 0 : 16);
    ctx.fillStyle = `rgb(${warmth},${warmth + 4},${warmth + 14})`;
    ctx.fillRect(0, y, W, 6);
  }
  ctx.fillStyle = 'rgba(90,96,120,0.35)';
  for (let i = 0; i < 14; i += 1) {
    ctx.fillRect(i * 38 - 10, H * 0.4 - 24, 34, 24);
  }

  const px = W * 0.5;
  const py = H * 0.6 + Math.sin(t * 0.9) * 2;

  const glow = ctx.createRadialGradient(px, py + 6, 2, px, py + 6, 46);
  glow.addColorStop(0, 'rgba(255,255,255,0.95)');
  glow.addColorStop(0.35, 'rgba(255,196,90,0.75)');
  glow.addColorStop(0.7, 'rgba(190,60,40,0.35)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(px - 60, py - 50, 120, 110);

  ctx.fillStyle = '#fff6e0';
  ctx.beginPath();
  ctx.arc(px, py - 4, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 12, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sensor noise.
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 60; i += 1) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }
}
