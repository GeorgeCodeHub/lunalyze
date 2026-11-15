import { useTranslation } from 'react-i18next';
import { HOUR, LUNAR_DAY_H } from '../../../backend/lib/realView';
import type { Interval, SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import BodyGlyph from '../shared/BodyGlyph';
import type { StayFit } from './stayFit';
import styles from './StayStrip.module.css';

type StayStripProps = {
  lanes: Pick<SiteView['lanes'], 'sun' | 'earth'>; // the Moon day from landing
  fit: StayFit;
  startMs: number; // the landing time
  stayH: number;
};

const UNITS = 1000; // the strip's width in SVG units: landing at 0, the end of the stay at 1000

// The stay drawn as a strip, from landing to its end: a row for the Sun and a row for Earth, a bar
// wherever one is in view. Where both rows are empty the place has neither; the period that makes
// the stay risky is framed. The words next to it say the same, so the strip is hidden from screen readers.
const StayStrip = ({ lanes, fit, startMs, stayH }: StayStripProps) => {
  const { t } = useTranslation('compare');

  const spanMs = Math.min(stayH, LUNAR_DAY_H) * HOUR; // as in stayFit: the 30-day stay ends with the Moon day
  const x = (ms: number) => Math.min(UNITS, Math.max(0, ((ms - startMs) / spanMs) * UNITS));
  const bars = (intervals: Interval[]) =>
    intervals
      .map(([from, to]) => ({ from, x: x(Date.parse(from)), width: x(Date.parse(to)) - x(Date.parse(from)) }))
      .filter((bar) => bar.width > 0);
  const sun = bars(lanes.sun);
  const earth = bars(lanes.earth);

  return (
    <div className={styles.strip} data-testid={testIds.siteColumns.stay} data-sun-bars={sun.length} data-earth-bars={earth.length} aria-hidden="true">
      <span className={styles.glyphs}>
        <BodyGlyph body="sun" />
        <BodyGlyph body="earth" />
      </span>
      <svg className={styles.track} viewBox={`0 0 ${UNITS} 28`} preserveAspectRatio="none">
        <path className={styles.baseline} d={`M0,7 H${UNITS} M0,21 H${UNITS}`} />
        {sun.map((bar) => (
          <rect key={bar.from} className={styles.sun} x={bar.x} y="2" width={bar.width} height="10" />
        ))}
        {earth.map((bar) => (
          <rect key={bar.from} className={styles.earth} x={bar.x} y="16" width={bar.width} height="10" />
        ))}
        {fit.status === 'risky' && <rect className={styles.dark} x={x(fit.fromMs)} y="0.5" width={x(fit.toMs) - x(fit.fromMs)} height="27" />}
      </svg>
      <span className={styles.ends}>
        <span>{t('stay.landing')}</span>
        <span>{t('stay.end')}</span>
      </span>
    </div>
  );
};

export default StayStrip;
