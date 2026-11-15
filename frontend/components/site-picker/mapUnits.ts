import { POLAR_MAP } from '../../../backend/lib/projectPolar';

// The map is drawn in kilometres, not the metres projectPolar returns. With metres the drawing's
// coordinates run to hundreds of thousands, and at some sizes the browser then paints a marker's
// colour across the whole map. Kilometres keep every coordinate small; the picture is the same.
export const MAP_UNIT_M = 1000;

/** Half the side of the map's square, in map units. */
export const MAP_HALF = POLAR_MAP.halfWidthM / MAP_UNIT_M;

/** A projected position in metres as map units. */
export const toMapUnits = ({ x, y }: { x: number; y: number }): { x: number; y: number } => ({ x: x / MAP_UNIT_M, y: y / MAP_UNIT_M });

/**
 * The sizes of the map's marks on screen, in CSS pixels. They stay this size whatever the map's size, so
 * a big map shows more ground, not bigger pins. line: a Sun or Earth line. room: the space kept around the
 * outermost pins for their lines and labels.
 */
export const MARK_PX = { line: 60, pin: 6, label: 14, labelGap: 10, marker: 5, room: 76 } as const;

/** The map's box before it is measured (and in tests): 480 × 300 CSS pixels. */
export const MAP_BOX_FALLBACK = { w: 480, h: 300 } as const;

/**
 * What the map shows in a box of w × h CSS pixels, centred on the pins. pinYs: the pins' SVG y (map units,
 * y down). k: map units per pixel, for sizing marks. The map's full width fills the box when the pins,
 * with `room` above and below, fit its height at that scale. Otherwise it zooms out just enough to hold
 * them all, and the map has dark sides. The view keeps the box's own shape, so nothing is stretched or
 * cropped beyond it, and it stays on the map's picture top to bottom when it can.
 */
export const mapView = (pinYs: number[], w: number, h: number, half: number = MAP_HALF, roomPx: number = MARK_PX.room) => {
  const fullK = (2 * half) / w;
  const centre = pinYs.length > 0 ? (Math.min(...pinYs) + Math.max(...pinYs)) / 2 : 0;
  const spread = pinYs.length > 0 ? Math.max(...pinYs) - Math.min(...pinYs) : 0;
  const fullWidth = h * fullK >= spread + 2 * roomPx * fullK || h <= 2 * roomPx;
  const k = fullWidth ? fullK : spread / (h - 2 * roomPx);
  const width = w * k;
  const height = h * k;
  const top = height >= 2 * half ? -height / 2 : Math.min(half - height, Math.max(-half, centre - height / 2));
  return { x: -width / 2, y: top, width, height, k, fullWidth };
};
