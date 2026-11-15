import { toXY } from '../../../backend/lib/toXY';
import { testIds } from '../../test-ids';
import { type Pair, splitPath, STRIP, type StripCentre, turnPath } from './skyScale';
import styles from './BodyPath.module.css';

type BodyPathProps = { body: 'sun' | 'earth'; path: Pair[]; stretch: number; centre: StripCentre };

// Where the Sun or Earth travels across the sky over the time span shown: a thin line.
const BodyPath = ({ body, path, stretch, centre }: BodyPathProps) => {
  const lines = splitPath(turnPath(path, centre));
  const d = lines
    .map(
      (line) =>
        'M' +
        line
          .map(([az, el]) => {
            const { x, y } = toXY(az, el, STRIP.width, STRIP.height, stretch);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' L'),
    )
    .join(' ');

  return <path className={styles.path} data-testid={testIds.horizonStrip.path} data-body={body} data-lines={lines.length} d={d} />;
};

export default BodyPath;
