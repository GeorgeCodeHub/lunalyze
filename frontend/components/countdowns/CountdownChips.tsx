import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import CountdownChip from './CountdownChip';
import styles from './CountdownChips.module.css';

type CountdownChipsProps = { now: SiteView }; // the moment the playhead is on

const CountdownChips = ({ now }: CountdownChipsProps) => {
  const { t } = useTranslation('compare');

  return (
    <section className={styles.countdowns} data-testid={testIds.countdowns.root}>
      <h3 className={styles.title}>{t('countdown.title')}</h3>
      <ul className={styles.list}>
        <CountdownChip body="sun" countdown={now.countdown.sun} />
        <CountdownChip body="earth" countdown={now.countdown.earth} />
      </ul>
    </section>
  );
};

export default CountdownChips;
