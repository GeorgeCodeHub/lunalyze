import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import type { Stay } from '../../scenario';
import { testIds } from '../../test-ids';
import CountdownChips from '../countdowns/CountdownChips';
import HorizonStrip from '../horizon-strip/HorizonStrip';
import MetricCards from '../metric-cards/MetricCards';
import type { TimeFrame } from '../shared/timeFrame';
import { usePosition } from '../shared/usePosition';
import { groupLabelKey, siteNameKey } from '../site-picker/siteIds';
import Timeline from '../timeline/Timeline';
import ColumnHeader from './ColumnHeader';
import FitLabel from './FitLabel';
import SiteCaveats from './SiteCaveats';
import { stayFit } from './stayFit';
import styles from './SiteColumn.module.css';

type SiteColumnProps = {
  view: SiteView; // the time span shown
  stayView: SiteView; // the Moon day from landing: its lanes cover the stay
  now: SiteView; // the moment the playhead is on
  frame: TimeFrame;
  stay: Stay;
  terrain: boolean;
  onRemove?: () => void;
};

// Everything about one place, top to bottom: the verdict, the caveats, the sky, what happens next,
// the numbers and the timeline.
const SiteColumn = ({ view, stayView, now, frame, stay, terrain, onRemove }: SiteColumnProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const position = usePosition();

  const { site } = view;
  const name = tSites(siteNameKey(site.id));
  const titleId = `site-column-${site.id}`;
  const meta = [
    tSites(groupLabelKey(site.group)),
    position(site.lat, site.lon),
    ...(site.precision === 'proxy' ? [t('site.approximate')] : []),
  ];
  const fit = stayFit(stayView.lanes, frame.startMs, frame.stayH);

  return (
    <article
      className={styles.column}
      aria-labelledby={titleId}
      data-testid={testIds.siteColumns.column}
      data-status="ready"
      data-site-id={site.id}
    >
      <ColumnHeader titleId={titleId} title={name} meta={meta} removeLabel={t('site.remove', { site: name })} onRemove={onRemove} />
      <FitLabel fit={fit} stay={stay} />
      <SiteCaveats view={view} terrain={terrain} />
      <HorizonStrip view={view} now={now} siteName={name} />
      <CountdownChips now={now} />
      <MetricCards view={view} now={now} zoom={frame.zoom} />
      <Timeline view={view} frame={frame} />
    </article>
  );
};

export default SiteColumn;
