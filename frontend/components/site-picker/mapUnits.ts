import { POLAR_MAP } from '../../../backend/lib/projectPolar';

// The map is drawn in kilometres, not the metres projectPolar returns. With metres the drawing's
// coordinates run to hundreds of thousands, and at some sizes the browser then paints a marker's
// colour across the whole map. Kilometres keep every coordinate small; the picture is the same.
export const MAP_UNIT_M = 1000;

/** Half the side of the map's square, in map units. */
export const MAP_HALF = POLAR_MAP.halfWidthM / MAP_UNIT_M;

/** A projected position in metres as map units. */
export const toMapUnits = ({ x, y }: { x: number; y: number }): { x: number; y: number } => ({ x: x / MAP_UNIT_M, y: y / MAP_UNIT_M });
