/**
 * OpenStreetMap static preview (no API key). Used as a lightweight map snapshot
 * for luxury contact cards; falls back visually if the image fails to load.
 */
const OSM_STATIC_BASE = "https://staticmap.openstreetmap.de/staticmap.php";

export function buildStaticMapPreviewUrl(
  lat: number,
  lng: number,
  opts?: { width?: number; height?: number; zoom?: number },
): string {
  const w = Math.min(Math.max(Math.round(opts?.width ?? 720), 200), 1024);
  const h = Math.min(Math.max(Math.round(opts?.height ?? 240), 120), 260);
  const z = Math.min(Math.max(opts?.zoom ?? 16, 12), 18);
  return `${OSM_STATIC_BASE}?center=${lat},${lng}&zoom=${z}&size=${w}x${h}&maptype=mapnik`;
}
