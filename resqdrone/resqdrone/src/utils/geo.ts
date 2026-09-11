import type { LatLng } from '@/types';

const R = 6371; // km

export function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Initial bearing a -> b, degrees 0..360. */
export function bearing(a: LatLng, b: LatLng): number {
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function lerpPoint(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/** Total length of a polyline in km. */
export function pathLengthKm(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) total += distanceKm(path[i - 1], path[i]);
  return total;
}

/**
 * Position along a polyline at a normalised progress 0..1, plus the heading
 * at that point. Used by the telemetry simulator to fly the search pattern.
 */
export function pointAlongPath(path: LatLng[], progress: number): { point: LatLng; heading: number } {
  if (path.length < 2) return { point: path[0], heading: 0 };
  const clamped = Math.min(0.999999, Math.max(0, progress));
  const total = pathLengthKm(path);
  let target = total * clamped;

  for (let i = 1; i < path.length; i += 1) {
    const seg = distanceKm(path[i - 1], path[i]);
    if (target <= seg || i === path.length - 1) {
      const t = seg === 0 ? 0 : target / seg;
      return { point: lerpPoint(path[i - 1], path[i], t), heading: bearing(path[i - 1], path[i]) };
    }
    target -= seg;
  }
  return { point: path[path.length - 1], heading: 0 };
}

/** Shoelace area of a lat/lng polygon in km² (adequate at city scale). */
export function polygonAreaKm2(poly: LatLng[]): number {
  if (poly.length < 3) return 0;
  const latRef = toRad(poly.reduce((s, p) => s + p.lat, 0) / poly.length);
  const kx = 111.32 * Math.cos(latRef);
  const ky = 110.57;
  let sum = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.lng * kx * (b.lat * ky) - b.lng * kx * (a.lat * ky);
  }
  return Math.abs(sum / 2);
}

/** Rectangle polygon centred on a point, sized in km. */
export function rectAround(center: LatLng, widthKm: number, heightKm: number): LatLng[] {
  const dLat = heightKm / 110.57 / 2;
  const dLng = widthKm / (111.32 * Math.cos(toRad(center.lat))) / 2;
  return [
    { lat: center.lat + dLat, lng: center.lng - dLng },
    { lat: center.lat + dLat, lng: center.lng + dLng },
    { lat: center.lat - dLat, lng: center.lng + dLng },
    { lat: center.lat - dLat, lng: center.lng - dLng },
  ];
}

/** Boustrophedon ("lawnmower") sweep across a bounding rectangle. */
export function lawnmowerPath(poly: LatLng[], legs = 8): LatLng[] {
  const lats = poly.map((p) => p.lat);
  const lngs = poly.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const inset = (maxLat - minLat) * 0.08;
  const step = (maxLat - minLat - inset * 2) / (legs - 1);
  const path: LatLng[] = [];
  for (let i = 0; i < legs; i += 1) {
    const lat = maxLat - inset - step * i;
    const leftToRight = i % 2 === 0;
    const a = { lat, lng: leftToRight ? minLng + inset : maxLng - inset };
    const b = { lat, lng: leftToRight ? maxLng - inset : minLng + inset };
    path.push(a, b);
  }
  return path;
}
