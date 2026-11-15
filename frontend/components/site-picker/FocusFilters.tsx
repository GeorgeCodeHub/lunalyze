import { useTranslation } from 'react-i18next';
import { FOCUSES, type Focus } from '../../scenario';
import { testIds } from '../../test-ids';
import Segmented from '../shared/Segmented';
import styles from './FocusFilters.module.css';

type FocusFiltersProps = { focus: Focus; onChange: (focus: Focus) => void };

const TITLE_ID = 'focus-filters-title';

// The quick filters: what matters most for the mission. They change which place the tool shows as the
// best option. The place the person chose stays as it is.
const FocusFilters = ({ focus, onChange }: FocusFiltersProps) => {
  const { t } = useTranslation('compare');

  return (
    <section className={styles.filters} aria-labelledby={TITLE_ID}>
      <h2 id={TITLE_ID} className={styles.title}>
        {t('focus.title')}
      </h2>
      <Segmented
        label={t('focus.title')}
        options={FOCUSES.map((value) => ({ value, label: t(`focus.${value}`) }))}
        value={focus}
        onChange={onChange}
        testId={testIds.compare.focus}
      />
    </section>
  );
};

export default FocusFilters;
