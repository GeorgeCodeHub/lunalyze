import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import BodyGlyph from '../shared/BodyGlyph';
import type { SkyStatus } from './skyScale';
import styles from './BodyStatus.module.css';

type BodyStatusProps = { body: 'sun' | 'earth'; status: SkyStatus };

// The words for what the strip shows: "Sun: Visible", "Earth: Hidden". Also the strip's legend.
const BodyStatus = ({ body, status }: BodyStatusProps) => {
  const { t } = useTranslation('compare');

  return (
    <li className={styles.status} data-testid={testIds.horizonStrip.status} data-body={body} data-status={status}>
      <BodyGlyph body={body} />
      <span>{t('horizon.status', { body: t(`horizon.${body}`), status: t(`horizon.${status}`) })}</span>
    </li>
  );
};

export default BodyStatus;
