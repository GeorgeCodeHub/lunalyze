import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import type { Stay } from '../../scenario';
import { testIds } from '../../test-ids';
import CountdownChips from '../countdowns/CountdownChips';
import MetricCards from '../metric-cards/MetricCards';
import type { TimeFrame } from '../shared/timeFrame';
import { usePosition } from '../shared/usePosition';
import { siteNameKey } from '../site-picker/siteIds';
import FitLabel from './FitLabel';
import type { Role } from './pickPlaces';
import PlaceDetails from './PlaceDetails';
import PlaceHeader from './PlaceHeader';
import SiteCaveats from './SiteCaveats';
import { stayFit } from './stayFit';
import styles from './PlaceCard.module.css';

type PlaceCardProps = {
  role: Role;
  alsoYours?: boolean; // the best option is also the place chosen in setup
  view: SiteView; // the time span shown
  stayView: SiteView; // the Moon day from landing: its lanes cover the stay
  now: SiteView; // the moment the playhead is on
  frame: TimeFrame;
  stay: Stay;
  terrain: boolean;
  foot?: ReactNode; // the last line of the card's face: why the best option won
  how?: ReactNode; // the best option's details add how it was chosen
};

// One place, made to be read in a glance: what it is and where, the verdict, three numbers, what happens next.
// Both cards carry the same blocks in the same order, so the eye compares them straight across.
// Everything else is one step away, in Details.
const PlaceCard = ({ role, alsoYours, view, stayView, now, frame, stay, terrain, foot, how }: PlaceCardProps) => {
  const { t: tSites } = useTranslation('sites');
  const position = usePosition();

  const { site } = view;
  const titleId = `place-card-${site.id}`;
  const fit = stayFit(stayView.lanes, frame.startMs, frame.stayH);

  return (
    <article
      className={styles.card}
      aria-labelledby={titleId}
      data-testid={testIds.siteColumns.column}
      data-status="ready"
      data-role={role}
      data-site-id={site.id}
    >
      <PlaceHeader
        titleId={titleId}
        title={tSites(siteNameKey(site.id))}
        meta={position(site.lat, site.lon)}
        role={role}
        alsoYours={alsoYours}
        risky={fit.status === 'risky'}
      />
      <FitLabel fit={fit} lanes={stayView.lanes} startMs={frame.startMs} stayH={frame.stayH} />
      <MetricCards view={view} zoom={frame.zoom} />
      <CountdownChips now={now} />
      <SiteCaveats view={view} terrain={terrain} />
      {foot}
      <PlaceDetails view={view} now={now} fit={fit} stay={stay} terrain={terrain}>
        {how}
      </PlaceDetails>
    </article>
  );
};

export default PlaceCard;
