import { type CSSProperties, type RefObject, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import fieldStyles from '../shared/Field.module.css';
import IconAlert from '../shared/IconAlert';
import menuStyles from '../shared/Menu.module.css';
import type { PlaceDraft } from './placeDrafts';
import styles from './SitePicker.module.css';
import { groupLabelKey, PICKER_GROUPS, siteNameKey } from './siteIds';

type SitePickerProps = {
  draft: PlaceDraft;
  onChange: (draft: PlaceDraft) => void;
  siteRef: RefObject<HTMLButtonElement | null>;
  coordsRef: RefObject<HTMLInputElement | null>;
  errorId?: string;
  coordsInvalid: boolean;
};

const LABEL_ID = 'setup-site-label';
const BUTTON_ID = 'setup-site-button';
const MENU_ID = 'setup-site-menu';
const HINT_ID = 'setup-coords-hint';
const COORDS_ERROR_ID = 'setup-coords-error';

// The one place the mission wants to land: a known site from the list (the same menu as the toolbar's
// places), or coordinates typed in.
// Filling one clears the other. Alternatives to compare with come on the results screen.
const SitePicker = ({ draft, onChange, siteRef, coordsRef, errorId, coordsInvalid }: SitePickerProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const [open, setOpen] = useState(false);

  const missing = errorId ? true : undefined;

  return (
    <div className={styles.picker}>
      <div className={styles.row}>
        <div className={fieldStyles.field} style={{ '--menu-anchor': '--setup-site-field' } as CSSProperties}>
          <span id={LABEL_ID} className={fieldStyles.label}>
            {t('setup.where.site')}
          </span>
          <button
            ref={siteRef}
            id={BUTTON_ID}
            type="button"
            className={menuStyles.button}
            popoverTarget={MENU_ID}
            aria-labelledby={`${LABEL_ID} ${BUTTON_ID}`}
            aria-expanded={open}
            aria-describedby={errorId}
            aria-invalid={missing}
            data-testid={testIds.setup.siteSelect}
            data-site-id={draft.siteId}
          >
            {draft.siteId ? tSites(siteNameKey(draft.siteId)) : t('setup.where.choose')}
          </button>
          <div id={MENU_ID} popover="auto" className={menuStyles.menu} onToggle={(e) => setOpen(e.newState === 'open')}>
            {PICKER_GROUPS.map(({ group, ids }) => (
              <fieldset key={group} className={menuStyles.group}>
                <legend className={menuStyles.groupName}>{tSites(groupLabelKey(group))}</legend>
                {ids.map((id) => (
                  <label key={id} className={menuStyles.option}>
                    <input
                      type="radio"
                      name="setup-site"
                      checked={draft.siteId === id}
                      onChange={() => onChange({ siteId: id, coords: '' })}
                      onClick={(e) => {
                        // A pointer pick closes the menu; arrow keys move through the list and leave it open.
                        if (e.detail > 0) document.getElementById(MENU_ID)?.hidePopover();
                      }}
                      data-testid={testIds.setup.siteOption}
                      data-site-id={id}
                    />
                    {tSites(siteNameKey(id))}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        </div>
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
