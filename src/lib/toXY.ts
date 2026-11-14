/**
 * Horizon-strip projection: sky angles (degrees) to SVG pixels.
 * x runs 0..width over azimuth 0..360. y is height/2 at elevation 0, up is smaller y.
 * At stretch 1 the strip shows elevation -10..+10.
 */
export function toXY(az: number, el: number, width: number, height: number, stretch: number): { x: number; y: number } {
  return { x: (az / 360) * width, y: height / 2 - el * stretch * (height / 20) };
}
