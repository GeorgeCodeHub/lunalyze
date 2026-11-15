import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import type { WinReason } from './rankSites';
import styles from './WhyBest.module.css';

type WhyBestProps = { reason: WinReason; checked: number };

// Why the tool put this place first, in one short line.
const WhyBest = ({ reason, checked }: WhyBestProps) => {
  const { t } = useTranslation('compare');

  return (
    <p className={styles.why} data-testid={testIds.siteColumns.why} data-reason={reason} data-checked={checked}>
      {t(`why.${reason}`, { count: checked })}
    </p>
  );
};

export default WhyBest;
