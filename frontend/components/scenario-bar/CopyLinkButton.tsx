import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import styles from './CopyLinkButton.module.css';

const CopyLinkButton = () => {
  const { t } = useTranslation('compare');
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    setStatus('idle'); // empties the live region so a second click announces again
    try {
      await Promise.resolve(); // yield so the idle commit lands before a synchronous failure sets the outcome
      // No navigator.clipboard (insecure context) throws a TypeError here, so it shares the failed path.
      await navigator.clipboard.writeText(window.location.href);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <div className={styles.copy}>
      <span className={styles.status} role="status" data-testid={testIds.scenarioBar.copyStatus}>
        {status === 'idle' ? '' : t(status === 'copied' ? 'copyLink.copied' : 'copyLink.failed')}
      </span>
      <button type="button" className={styles.button} onClick={copy} data-status={status} data-testid={testIds.scenarioBar.copyLink}>
        {t('copyLink.action')}
      </button>
    </div>
  );
};

export default CopyLinkButton;
