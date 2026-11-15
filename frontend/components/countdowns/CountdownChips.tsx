import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import CountdownChip from './CountdownChip';
import styles from './CountdownChips.module.css';

type CountdownChipsProps = { now: SiteView }; // the moment the playhead is on

// The next sunrise or sunset and Earthrise or Earthset, counted from the moment the playhead is on.
// Shown beside the place's timeline, so the playhead they count from is in sight.
const CountdownChips = ({ now }: CountdownChipsProps) => {
  const { t } = useTranslation('compare');

  return (
    <ul className={styles.list} aria-label={t('countdown.title')} data-testid={testIds.countdowns.root}>
      <CountdownChip body="sun" countdown={now.countdown.sun} />
      <CountdownChip body="earth" countdown={now.countdown.earth} />
    </ul>
  );
};

export default CountdownChips;
