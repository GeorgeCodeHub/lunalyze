import type { ReactNode } from 'react';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import type { TimeFrame } from '../shared/timeFrame';
import { axisTicks, UNITS } from './timeAxis';
import TimelineLane from './TimelineLane';
import styles from './Timeline.module.css';

// axis: draw the dates under the lanes. Stacked timelines share one axis, under the last of them.
// aside: shown on the name's line, at the far end: what happens next at the playhead.
type TimelineProps = { view: SiteView; frame: TimeFrame; siteName: string; axis: boolean; aside?: ReactNode };

const LANES = ['sun', 'earth', 'both'] as const;

// One place: when the Sun, Earth and both together are in view across the time span shown. Over the
// lanes: a frame around the stay (it starts at landing, the left edge) and a line at the playhead.
const Timeline = ({ view, frame, siteName, axis, aside }: TimelineProps) => {
  const stayWidth = Math.min(1, frame.stayH / frame.spanH) * UNITS;
  const playheadX = (frame.offsetH / frame.spanH) * UNITS;

  return (
    <section className={styles.timeline} data-testid={testIds.timeline.root} data-site-id={view.site.id}>
      <div className={styles.head}>
        <h4 className={styles.place}>{siteName}</h4>
        {aside}
      </div>
      <div className={styles.lanes}>
        {LANES.map((lane) => (
          <TimelineLane key={lane} lane={lane} intervals={view.lanes[lane]} frame={frame} />
        ))}
        <svg className={styles.overlay} viewBox={`0 0 ${UNITS} 100`} preserveAspectRatio="none" aria-hidden="true">
          <rect className={styles.stay} data-testid={testIds.timeline.stay} x="0" y="0" width={stayWidth} height="100" />
          <path className={styles.playhead} data-testid={testIds.timeline.playhead} data-x={Math.round(playheadX)} d={`M${playheadX},0 V100`} />
        </svg>
        {axis && (
          <div className={styles.axis} aria-hidden="true">
            {axisTicks(frame).map((tick) => (
              <span key={tick.ms}>{tick.label}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Timeline;
