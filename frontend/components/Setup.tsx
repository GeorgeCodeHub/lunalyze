import { useTranslation } from 'react-i18next';
import type { Scenario } from '../scenario';
import { testIds } from '../test-ids';
import MoonHero from './MoonHero';
import SetupForm from './scenario-bar/SetupForm';
import Barcode from './shared/Barcode';
import styles from './Setup.module.css';

type SetupProps = { initial: Scenario | null; onSubmit: (scenario: Scenario) => void };

// The Compare screen before any place is picked: the title, what the tool does, and the four setup questions.
const Setup = ({ initial, onSubmit }: SetupProps) => {
  const { t } = useTranslation('compare');
  const { t: tCommon } = useTranslation();

  return (
    <div className={styles.page}>
      <MoonHero />
      <main className={styles.main}>
        <header className={styles.intro}>
          <h1 className={styles.title}>{tCommon('appTitle')}</h1>
          <p className={styles.tagline}>{tCommon('tagline')}</p>
          <p className={styles.subtitle}>{t('setup.subtitle')}</p>
        </header>
        <section className={styles.panel} aria-labelledby="setup-panel-title">
          <h2 id="setup-panel-title" className={styles.panelTitle}>
            {t('setup.panelTitle')}
            <Barcode width="long" />
          </h2>
          <SetupForm initial={initial} onSubmit={onSubmit} />
        </section>
        <footer className={styles.footer}>
          <p>{t('setup.team')}</p>
          <p data-testid={testIds.hero.credit}>{t('hero.credit')}</p>
        </footer>
      </main>
    </div>
  );
};

export default Setup;
