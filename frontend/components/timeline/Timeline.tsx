import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import type { TimeFrame } from '../shared/timeFrame';
import { axisTicks, UNITS } from './timeAxis';
import TimelineLane from './TimelineLane';
import styles from './Timeline.module.css';

type TimelineProps = { view: SiteView; frame: TimeFrame };

const LANES = ['sun', 'earth', 'both'] as const;

// When the Sun, Earth and both together are in view across the time span shown. Over the lanes:
// a frame around the stay (it starts at landing, the left edge) and a line at the playhead.
const Timeline = ({ view, frame }: TimelineProps) => {
  const { t } = useTranslation('compare');

  const stayWidth = Math.min(1, frame.stayH / frame.spanH) * UNITS;
  const playheadX = (frame.offsetH / frame.spanH) * UNITS;

  return (
    <section className={styles.timeline} data-testid={testIds.timeline.root}>
      <h3 className={styles.title}>{t('timeline.title')}</h3>
      <div className={styles.lanes}>
        {LANES.map((lane) => (
          <TimelineLane key={lane} lane={lane} intervals={view.lanes[lane]} frame={frame} />
        ))}
        <svg className={styles.overlay} viewBox={`0 0 ${UNITS} 100`} preserveAspectRatio="none" aria-hidden="true">
          <rect className={styles.stay} data-testid={testIds.timeline.stay} x="0" y="0" width={stayWidth} height="100" />
          <path className={styles.playhead} data-testid={testIds.timeline.playhead} data-x={Math.round(playheadX)} d={`M${playheadX},0 V100`} />
        </svg>
        <div className={styles.axis} aria-hidden="true">
          {axisTicks(frame).map((tick) => (
            <span key={tick.ms}>{tick.label}</span>
          ))}
        </div>
      </div>
      <p className={styles.note}>{t('timeline.legend')}</p>
    </section>
  );
};

export default Timeline;
