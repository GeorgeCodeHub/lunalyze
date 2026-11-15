import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import styles from './PlaceNote.module.css';

type BestPendingProps = { loading: boolean };

const TITLE_ID = 'place-card-best-pending';

// The best option's place on the screen before there is one: while every place is being checked, or
// when the check could not run.
const BestPending = ({ loading }: BestPendingProps) => {
  const { t } = useTranslation('compare');

  return (
    <article
      className={styles.note}
      aria-labelledby={TITLE_ID}
      aria-busy={loading}
      data-testid={testIds.siteColumns.column}
      data-status={loading ? 'ranking' : 'unranked'}
      data-role="best"
    >
      <h2 id={TITLE_ID} className={styles.heading}>
        {t('role.best')}
      </h2>
      <p className={styles.body} role={loading ? 'status' : undefined}>
        {t(loading ? 'rank.pending' : 'rank.failed')}
      </p>
    </article>
  );
};

export default BestPending;
