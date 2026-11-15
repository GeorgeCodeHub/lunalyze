import { useTranslation } from 'react-i18next';
import type { Interval } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import BodyGlyph from '../shared/BodyGlyph';
import type { TimeFrame } from '../shared/timeFrame';
import { laneX, UNITS } from './timeAxis';
import styles from './TimelineLane.module.css';

type TimelineLaneProps = { lane: 'sun' | 'earth' | 'both'; intervals: Interval[]; frame: TimeFrame };

const MIN_BAR = 2; // a period too short to see at this time span still shows as a sliver

// One lane: a solid bar for each period in view. The gaps are the hidden periods, over a dashed line.
const TimelineLane = ({ lane, intervals, frame }: TimelineLaneProps) => {
  const { t } = useTranslation('compare');

  const name = t(`timeline.${lane}`);
  const bars = intervals.map(([from, to]) => {
    const x = laneX(Date.parse(from), frame);
    return { from, x, width: Math.max(laneX(Date.parse(to), frame) - x, MIN_BAR) };
  });

  return (
    <div className={styles.lane} data-testid={testIds.timeline.lane} data-lane={lane} data-bars={bars.length}>
      <span className={styles.label}>
        <BodyGlyph body={lane} />
        {name}
      </span>
      <svg
        className={styles.track}
        viewBox={`0 0 ${UNITS} 10`}
        preserveAspectRatio="none"
        role="img"
        aria-label={t('timeline.summary', { lane: name, count: bars.length })}
      >
        <path className={styles.baseline} d={`M0,5 H${UNITS}`} />
        {bars.map((bar) => (
          <rect key={bar.from} className={styles.bar} data-testid={testIds.timeline.bar} x={bar.x} y="1" width={bar.width} height="8" />
        ))}
      </svg>
    </div>
  );
};

export default TimelineLane;
