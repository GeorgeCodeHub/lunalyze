import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import { MARK_PX } from './mapUnits';
import styles from './BodyLine.module.css';

type BodyLineProps = {
  body: 'sun' | 'earth';
  status: 'visible' | 'hidden';
  x: number;
  y: number;
  dx: number;
  dy: number;
  k: number; // map units per CSS pixel: the line and its mark keep their size on screen
};

const BodyLine = ({ body, status, x, y, dx, dy, k }: BodyLineProps) => {
  const { t } = useTranslation('compare');

  // The projection has +y up; SVG has +y down, so y is negated on the way out.
  const length = MARK_PX.line * k;
  const ex = x + length * dx;
  const ey = y + length * dy;
  const r = MARK_PX.marker * k;

  return (
    <g data-testid={testIds.polarMap.bodyLine} data-body={body} data-status={status} className={styles.line}>
      <title>{t('map.bodyLine', { body: t(`map.${body}`), status: t(`map.${status}`) })}</title>
      <line className={styles.casing} x1={x} y1={-y} x2={ex} y2={-ey} />
      <line className={styles.stroke} data-testid={testIds.polarMap.bodyStroke} x1={x} y1={-y} x2={ex} y2={-ey} />
      <g transform={`translate(${ex} ${-ey})`}>
        {body === 'sun' ? (
          <circle className={styles.marker} data-testid={testIds.polarMap.bodyMarker} cx={0} cy={0} r={r} />
        ) : (
          <g transform="rotate(45)">
            <rect className={styles.marker} data-testid={testIds.polarMap.bodyMarker} x={-r * 0.85} y={-r * 0.85} width={r * 1.7} height={r * 1.7} />
          </g>
        )}
      </g>
    </g>
  );
};

export default BodyLine;
