import { useTranslation } from 'react-i18next';
import { mapDirection } from '../../../backend/lib/projectPolar';
import type { SiteView } from '../../../backend/lib/types';
import type { SiteId } from '../../i18n';
import { testIds } from '../../test-ids';
import BodyLine from './BodyLine';
import { MARK_PX } from './mapUnits';
import styles from './MapPin.module.css';

// labelEnd: the name is written to the left of the pin, ending at it. Default: left for a pin right of the pole.
// k: map units per CSS pixel, so the pin and its name keep their size on screen at any map size.
type MapPinProps = { view: SiteView; x: number; y: number; k: number; labelEnd?: boolean };

const MapPin = ({ view, x, y, k, labelEnd }: MapPinProps) => {
  const { t } = useTranslation('compare');

  const { site, sky, horizonIncomplete } = view;
  const name = t(`${site.id as SiteId}.name`, { ns: 'sites' });
  const sun = mapDirection(sky.sun.az, site.lon);
  const earth = mapDirection(sky.earth.az, site.lon);
  const short = t(`${site.id as SiteId}.short`, { ns: 'sites' }); // long names run off the map
  const nameOnLeft = labelEnd ?? x > 0;
  const labelOffset = MARK_PX.labelGap * k;
  // Chrome caps font-size at 10000px, so the label is drawn 10 units tall and scaled to MARK_PX.label.
  const labelScale = (MARK_PX.label * k) / 10;
  const title = [
    site.precision === 'proxy' ? t('map.approximate', { site: name }) : t('map.pin', { site: name }),
    ...(horizonIncomplete ? [t('map.lowerBound')] : []),
  ].join('\n');

  return (
    <g data-testid={testIds.polarMap.pin} data-site-id={site.id} data-precision={site.precision}>
      <title>{title}</title>
      <BodyLine body="sun" status={sky.sun.hidden ? 'hidden' : 'visible'} x={x} y={y} dx={sun.dx} dy={sun.dy} k={k} />
      <BodyLine body="earth" status={sky.earth.hidden ? 'hidden' : 'visible'} x={x} y={y} dx={earth.dx} dy={earth.dy} k={k} />
      <circle className={styles.pin} data-testid={testIds.polarMap.pinDot} cx={x} cy={-y} r={MARK_PX.pin * k} />
      <text
        className={styles.label}
        transform={`translate(${nameOnLeft ? x - labelOffset : x + labelOffset} ${-y}) scale(${labelScale})`}
        textAnchor={nameOnLeft ? 'end' : 'start'}
      >
        {short}
      </text>
    </g>
  );
};

export default MapPin;
