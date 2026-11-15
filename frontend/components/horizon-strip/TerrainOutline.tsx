import { toXY } from '../../../backend/lib/toXY';
import { testIds } from '../../test-ids';
import { type Pair, STRIP, type StripCentre, turnTerrain } from './skyScale';
import styles from './TerrainOutline.module.css';

type TerrainOutlineProps = { terrain: Pair[]; stretch: number; centre: StripCentre };

// The ground and hills along the horizon: everything below the outline is filled.
const TerrainOutline = ({ terrain, stretch, centre }: TerrainOutlineProps) => {
  const ridge = turnTerrain(terrain, centre)
    .map(([az, el]) => {
      const { x, y } = toXY(az, el, STRIP.width, STRIP.height, stretch);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' L');

  return (
    <g data-testid={testIds.horizonStrip.terrain} data-points={terrain.length}>
      <path className={styles.ground} d={`M0,${STRIP.height} L${ridge} L${STRIP.width},${STRIP.height} Z`} />
      <path className={styles.ridge} d={`M${ridge}`} />
    </g>
  );
};

export default TerrainOutline;
