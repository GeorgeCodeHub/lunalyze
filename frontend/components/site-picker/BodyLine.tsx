import { useTranslation } from 'react-i18next';
import { POLAR_MAP } from '../../../backend/lib/projectPolar';
import { testIds } from '../../test-ids';
import styles from './BodyLine.module.css';

type BodyLineProps = {
  body: 'sun' | 'earth';
  status: 'visible' | 'hidden';
  x: number;
  y: number;
  dx: number;
  dy: number;
};

const LINE_LENGTH_M = 0.25 * POLAR_MAP.halfWidthM;

const BodyLine = ({ body, status, x, y, dx, dy }: BodyLineProps) => {
  const { t } = useTranslation('compare');

  // Projected metres have +y up; SVG has +y down, so y is negated on the way out.
  const ex = x + LINE_LENGTH_M * dx;
  const ey = y + LINE_LENGTH_M * dy;

  return (
    <g data-testid={testIds.polarMap.bodyLine} data-body={body} data-status={status} className={styles.line}>
      <title>{t('map.bodyLine', { body: t(`map.${body}`), status: t(`map.${status}`) })}</title>
      <line className={styles.casing} x1={x} y1={-y} x2={ex} y2={-ey} />
      <line className={styles.stroke} data-testid={testIds.polarMap.bodyStroke} x1={x} y1={-y} x2={ex} y2={-ey} />
      <g transform={`translate(${ex} ${-ey})`}>
        {body === 'sun' ? (
          <circle className={styles.marker} data-testid={testIds.polarMap.bodyMarker} cx={0} cy={0} />
        ) : (
          <g transform="rotate(45)">
            <rect className={styles.marker} data-testid={testIds.polarMap.bodyMarker} />
          </g>
        )}
      </g>
    </g>
  );
};

export default BodyLine;
