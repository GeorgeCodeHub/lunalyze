import { useTranslation } from 'react-i18next';
import { testIds } from '../test-ids';
import MoonRise from './MoonRise';
import styles from './DataCredits.module.css';

// The foot of the page: where every number comes from, then the Moon rising under it (README rule 8: NASA data
// is credited). The sources are folded into one quiet line; a click opens them.
const DataCredits = () => {
  const { t } = useTranslation('compare');

  return (
    <footer className={styles.footer} data-testid={testIds.compare.credits}>
      <details className={styles.credits}>
        <summary className={styles.summary}>
          <span className={styles.title}>{t('credits.title')}</span>
          <span className={styles.team}>{t('credits.team')}</span>
        </summary>
        <div className={styles.body}>
          <p>{t('credits.positions')}</p>
          <p>{t('credits.hills')}</p>
          <p>{t('credits.checks')}</p>
          <p>
            {t('credits.textures')} <a href="https://creativecommons.org/licenses/by/4.0/">{t('credits.texturesLicence')}</a>
          </p>
          <p>{t('hero.credit')}</p>
        </div>
      </details>
      <MoonRise />
    </footer>
  );
};

export default DataCredits;
