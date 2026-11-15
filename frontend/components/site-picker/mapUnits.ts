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
 * a big map shows more ground, not bigger pins. line: a Sun or Earth line.
 */
export const MARK_PX = { line: 60, pin: 6, label: 14, labelGap: 10, marker: 5 } as const;

/** The map's box before it is measured (and in tests): 480 × 300 CSS pixels. */
export const MAP_BOX_FALLBACK = { w: 480, h: 300 } as const;

/** Where a window `size` long starts on the map so it is centred on the values and stays on the picture. */
const windowStart = (values: number[], size: number, half: number) => {
  const centre = values.length > 0 ? (Math.min(...values) + Math.max(...values)) / 2 : 0;
  return Math.min(half - size, Math.max(-half, centre - size / 2));
};

/**
 * What the map shows in a box of w × h CSS pixels. The map's picture always covers the box, the way a photo
 * set to fill does: no dark bands. It shows as much of the map as that allows (the full width in a wide box,
 * the full height in a tall one), centred on the pins and kept on the picture. Pins further apart than the
 * box holds stay centred between, so the outermost lose an equal part of their lines and labels at the edges.
 * pins: in SVG map units (y down). k: map units per pixel, for sizing marks. The view keeps the box's shape,
 * so nothing is stretched.
 */
export const mapView = (pins: { x: number; y: number }[], w: number, h: number, half: number = MAP_HALF) => {
  const k = (2 * half) / Math.max(w, h);
  const width = w * k;
  const height = h * k;
  return {
    x: windowStart(pins.map((pin) => pin.x), width, half),
    y: windowStart(pins.map((pin) => pin.y), height, half),
    width,
    height,
    k,
  };
};
