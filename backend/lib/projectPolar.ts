const R = 1737400; // lunar sphere radius, m

/** South-pole hillshade served from backend/public/: path, and half the side of its square extent in metres. */
export const POLAR_MAP = { path: 'data/map/south-pole-hillshade.png', halfWidthM: 368640 } as const;

/** South polar stereographic, same as horizon_masks.py to_xy: metres, +x toward 90E, +y toward 0 lon. */
export const projectPolar = (lat: number, lon: number): { x: number; y: number } => {
  const rho = 2 * R * Math.tan(((90 + lat) * Math.PI) / 360);
  const l = (lon * Math.PI) / 180;
  return { x: rho * Math.sin(l), y: rho * Math.cos(l) };
};

/** Map direction of a bearing `az` (deg from local north, east positive) at longitude `lon`: unit (sin(az+lon), cos(az+lon)). */
export const mapDirection = (az: number, lon: number): { dx: number; dy: number } => {
  const b = ((az + lon) * Math.PI) / 180;
  return { dx: Math.sin(b), dy: Math.cos(b) };
};

/** True when projected (x, y) lies inside the hillshade's square extent. */
export const onPolarMap = (x: number, y: number): boolean => Math.abs(x) <= POLAR_MAP.halfWidthM && Math.abs(y) <= POLAR_MAP.halfWidthM;
