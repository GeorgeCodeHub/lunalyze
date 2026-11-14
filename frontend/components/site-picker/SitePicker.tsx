import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import fieldStyles from '../shared/Field.module.css';
import IconAlert from '../shared/IconAlert';
import type { PlaceDraft } from './placeDrafts';
import styles from './SitePicker.module.css';
import { groupLabelKey, PICKER_GROUPS, siteNameKey } from './siteIds';

type SitePickerProps = {
  draft: PlaceDraft;
  onChange: (draft: PlaceDraft) => void;
  siteRef: RefObject<HTMLSelectElement | null>;
  coordsRef: RefObject<HTMLInputElement | null>;
  errorId?: string;
  coordsInvalid: boolean;
};

const HINT_ID = 'setup-coords-hint';
const COORDS_ERROR_ID = 'setup-coords-error';

// The one place the mission wants to land: a known site from the list, or coordinates typed in.
// Filling one clears the other. Alternatives to compare with come on the results screen.
const SitePicker = ({ draft, onChange, siteRef, coordsRef, errorId, coordsInvalid }: SitePickerProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');

  const missing = errorId ? true : undefined;

  return (
    <div className={styles.picker}>
      <div className={styles.row}>
        <label className={fieldStyles.field}>
          <span className={fieldStyles.label}>{t('setup.where.site')}</span>
          <select
            ref={siteRef}
            className={fieldStyles.control}
            value={draft.siteId}
            aria-describedby={errorId}
            aria-invalid={missing}
            data-testid={testIds.setup.siteSelect}
            onChange={(e) => onChange({ siteId: e.target.value, coords: '' })}
          >
            <option value="">{t('setup.where.choose')}</option>
            {PICKER_GROUPS.map(({ group, ids }) => (
              <optgroup key={group} label={tSites(groupLabelKey(group))}>
                {ids.map((id) => (
                  <option key={id} value={id}>
                    {tSites(siteNameKey(id))}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <span className={styles.or} aria-hidden="true">
          {t('setup.where.or')}
        </span>
        <label className={fieldStyles.field}>
          <span className={fieldStyles.label}>{t('setup.where.coords')}</span>
          <input
            ref={coordsRef}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            className={fieldStyles.control}
            value={draft.coords}
            placeholder={t('setup.where.coordsExample')}
            aria-invalid={coordsInvalid || missing}
            aria-describedby={[coordsInvalid ? COORDS_ERROR_ID : HINT_ID, errorId].filter(Boolean).join(' ')}
            data-testid={testIds.setup.coords}
            onChange={(e) => onChange({ siteId: '', coords: e.target.value })}
          />
        </label>
      </div>
      {coordsInvalid ? (
        <p id={COORDS_ERROR_ID} className={fieldStyles.error} role="alert" data-testid={testIds.setup.coordsError}>
          <IconAlert />
          {t('setup.where.coordsError')}
        </p>
      ) : (
        <p id={HINT_ID} className={styles.hint}>
          {t('setup.where.coordsHint')}
        </p>
      )}
    </div>
  );
};

export default SitePicker;
