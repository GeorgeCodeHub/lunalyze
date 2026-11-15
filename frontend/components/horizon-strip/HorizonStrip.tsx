import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import { formatNumber } from '../shared/formatTime';
import BodyMarker from './BodyMarker';
import BodyPath from './BodyPath';
import BodyStatus from './BodyStatus';
import { earthStatus, heightRange, STRIP, stripCentre, sunStatus } from './skyScale';
import TerrainOutline from './TerrainOutline';
import styles from './HorizonStrip.module.css';

// view: the time span shown (hills and the paths across the sky). now: the moment the playhead is on.
type HorizonStripProps = { view: SiteView; now: SiteView; siteName: string };

const { width: W, height: H } = STRIP;
const COMPASS = {
  south: ['north', 'east', 'south', 'west', 'north'],
  north: ['south', 'west', 'north', 'east', 'south'],
} as const;

// The panorama from the landing spot: direction runs left to right, height runs up. toXY places every
// point, so the strip only draws what the data says. The strip is cut open on the side away from Earth.
const HorizonStrip = ({ view, now, siteName }: HorizonStripProps) => {
  const { t } = useTranslation('compare');

  const { sun, earth } = now.sky;
  const range = heightRange([view.sky.sunPath, view.sky.earthPath, [[sun.az, sun.el]], [[earth.az, earth.el]]]);
  const stretch = 10 / range; // toXY shows ±10° at stretch 1
  // Where Earth is at landing decides the middle of the strip, so it holds still while time plays.
  const centre = stripCentre(view.sky.earthPath[0]?.[0] ?? earth.az);
  const half = formatNumber(range / 2);
  const sunLooks = sunStatus(now.metrics.panelOutputPct);
  const earthLooks = earthStatus(earth.hidden);

  return (
    <section className={styles.strip} data-testid={testIds.horizonStrip.root} data-range={range} data-centre={centre}>
      <h3 className={styles.title}>{t('horizon.title')}</h3>
      <div className={styles.frame}>
        <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('horizon.label', { site: siteName })}>
          <path className={styles.grid} d={`M${W / 4},0 V${H} M${W / 2},0 V${H} M${(3 * W) / 4},0 V${H} M0,${H / 4} H${W} M0,${(3 * H) / 4} H${W}`} />
          <TerrainOutline terrain={view.sky.terrain} stretch={stretch} centre={centre} />
          <path className={styles.level} d={`M0,${H / 2} H${W}`} />
          <BodyPath body="sun" path={view.sky.sunPath} stretch={stretch} centre={centre} />
          <BodyPath body="earth" path={view.sky.earthPath} stretch={stretch} centre={centre} />
          <BodyMarker body="earth" az={earth.az} el={earth.el} status={earthLooks} stretch={stretch} centre={centre} />
          <BodyMarker body="sun" az={sun.az} el={sun.el} status={sunLooks} stretch={stretch} centre={centre} />
        </svg>
        <span className={`${styles.tick} ${styles.tickHigh}`} aria-hidden="true">
          +{t('horizon.degrees', { value: half })}
        </span>
        <span className={`${styles.tick} ${styles.tickLevel}`} aria-hidden="true">
          {t('horizon.level')}
        </span>
        <span className={`${styles.tick} ${styles.tickLow}`} aria-hidden="true">
          −{t('horizon.degrees', { value: half })}
        </span>
      </div>
      <div className={styles.compass} aria-hidden="true">
        {COMPASS[centre].map((direction, i) => (
          // The strip's left and right ends are the same direction, so the position is part of the key.
          <span key={`${direction}-${i === 0 ? 'left' : 'on'}`}>{t(`horizon.${direction}`)}</span>
        ))}
      </div>
      <ul className={styles.statuses}>
        <BodyStatus body="sun" status={sunLooks} />
        <BodyStatus body="earth" status={earthLooks} />
      </ul>
      <p className={styles.note}>
        {t('horizon.legend')} {t('horizon.scale', { range: formatNumber(range) })}
      </p>
    </section>
  );
};

export default HorizonStrip;
