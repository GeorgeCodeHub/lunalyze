import { useTranslation } from 'react-i18next';
import { mapDirection, POLAR_MAP } from '../../../backend/lib/projectPolar';
import type { SiteView } from '../../../backend/lib/types';
import type { SiteId } from '../../i18n';
import { testIds } from '../../test-ids';
import BodyLine from './BodyLine';
import styles from './MapPin.module.css';

type MapPinProps = { view: SiteView; x: number; y: number };

const LABEL_OFFSET_M = 0.06 * POLAR_MAP.halfWidthM;
// Chrome caps font-size at 10000px, so the label is drawn 10 units tall and scaled up to 0.08·H.
const LABEL_SCALE = (0.08 * POLAR_MAP.halfWidthM) / 10;

const MapPin = ({ view, x, y }: MapPinProps) => {
  const { t } = useTranslation('compare');

  const { site, sky, horizonIncomplete } = view;
  const name = t(`${site.id as SiteId}.name`, { ns: 'sites' });
  const sun = mapDirection(sky.sun.az, site.lon);
  const earth = mapDirection(sky.earth.az, site.lon);
  const labelEnd = x > 0;
  const title = [
    site.precision === 'proxy' ? t('map.approximate', { site: name }) : t('map.pin', { site: name }),
    ...(horizonIncomplete ? [t('map.lowerBound')] : []),
  ].join('\n');

  return (
    <g data-testid={testIds.polarMap.pin} data-site-id={site.id} data-precision={site.precision}>
      <title>{title}</title>
      <BodyLine body="sun" status={sky.sun.hidden ? 'hidden' : 'visible'} x={x} y={y} dx={sun.dx} dy={sun.dy} />
      <BodyLine body="earth" status={sky.earth.hidden ? 'hidden' : 'visible'} x={x} y={y} dx={earth.dx} dy={earth.dy} />
      <circle className={styles.pin} data-testid={testIds.polarMap.pinDot} cx={x} cy={-y} />
      <text
        className={styles.label}
        transform={`translate(${labelEnd ? x - LABEL_OFFSET_M : x + LABEL_OFFSET_M} ${-y}) scale(${LABEL_SCALE})`}
        textAnchor={labelEnd ? 'end' : 'start'}
      >
        {name}
      </text>
    </g>
  );
};

export default MapPin;
