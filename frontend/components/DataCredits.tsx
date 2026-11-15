import { useTranslation } from 'react-i18next';
import { testIds } from '../test-ids';
import styles from './DataCredits.module.css';

// Where every number on the Compare screen comes from (README rule 8: NASA data is credited).
const DataCredits = () => {
  const { t } = useTranslation('compare');

  return (
    <footer className={styles.credits} data-testid={testIds.compare.credits}>
      <h2 className={styles.title}>{t('credits.title')}</h2>
      <p>{t('credits.positions')}</p>
      <p>{t('credits.hills')}</p>
      <p>{t('credits.checks')}</p>
      <p className={styles.team}>{t('credits.team')}</p>
    </footer>
  );
};

export default DataCredits;
