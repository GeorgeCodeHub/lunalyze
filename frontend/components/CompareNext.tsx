import { useTranslation } from 'react-i18next';
import styles from './CompareNext.module.css';

type CompareNextProps = { onBack: () => void };

// Stand-in for the Compare layout until the site columns exist.
const CompareNext = ({ onBack }: CompareNextProps) => {
  const { t } = useTranslation('compare');

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t('next.title')}</h1>
      <p className={styles.body}>{t('next.body')}</p>
      <button type="button" className={styles.back} onClick={onBack}>
        {t('next.back')}
      </button>
    </main>
  );
};

export default CompareNext;
