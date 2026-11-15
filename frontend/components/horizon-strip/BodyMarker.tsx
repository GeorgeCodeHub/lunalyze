import { useTranslation } from 'react-i18next';
import { toXY } from '../../../backend/lib/toXY';
import { testIds } from '../../test-ids';
import { type SkyStatus, STRIP, stripAz, type StripCentre } from './skyScale';
import styles from './BodyMarker.module.css';

type BodyMarkerProps = { body: 'sun' | 'earth'; az: number; el: number; status: SkyStatus; stretch: number; centre: StripCentre };

const R = 13; // the Sun's radius in strip units; Earth's diamond is drawn to the same reach
const SIDE = R * 1.35;

// The Sun (a circle) or Earth (a diamond) at its place in the sky. Visible is a solid shape, hidden
// is a dashed outline, and a partly hidden Sun keeps only its upper half filled: the hills cover the rest.
const BodyMarker = ({ body, az, el, status, stretch, centre }: BodyMarkerProps) => {
  const { t } = useTranslation('compare');

  const { x, y } = toXY(stripAz(az, centre), el, STRIP.width, STRIP.height, stretch);

  return (
    <g
      className={styles.marker}
      data-testid={testIds.horizonStrip.body}
      data-body={body}
      data-status={status}
      transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
    >
      <title>{t('horizon.status', { body: t(`horizon.${body}`), status: t(`horizon.${status}`) })}</title>
      {body === 'sun' ? (
        <circle className={styles.shape} r={R} />
      ) : (
        <rect className={styles.shape} x={-SIDE / 2} y={-SIDE / 2} width={SIDE} height={SIDE} transform="rotate(45)" />
      )}
      {status === 'partly' && <path className={styles.half} d={`M${-R},0 A${R},${R} 0 0 1 ${R},0 Z`} />}
    </g>
  );
};

export default BodyMarker;
