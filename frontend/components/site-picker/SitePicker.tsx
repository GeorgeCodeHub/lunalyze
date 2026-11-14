import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_SITES } from '../../scenario';
import { testIds } from '../../test-ids';
import fieldStyles from '../shared/Field.module.css';
import styles from './SitePicker.module.css';
import { groupLabelKey, PICKER_GROUPS, siteNameKey } from './siteIds';

type SitePickerProps = {
  picked: string[];
  onChange: (ids: string[]) => void;
  firstRef: RefObject<HTMLSelectElement | null>;
  errorId?: string;
};

const SLOTS = Array.from({ length: MAX_SITES }, (_, i) => i);

// One dropdown per place: Place 1 is required, Places 2 and 3 are optional. A place picked in one
// dropdown is left out of the others, so the same place cannot be compared with itself.
const SitePicker = ({ picked, onChange, firstRef, errorId }: SitePickerProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');

  const change = (slot: number, id: string) => {
    const slots = SLOTS.map((i) => (i === slot ? id : (picked[i] ?? '')));
    onChange(slots.filter(Boolean));
  };

  return (
    <div className={styles.picker}>
      {SLOTS.map((slot) => {
        const value = picked[slot] ?? '';
        const takenElsewhere = new Set(picked.filter((_, i) => i !== slot));
        const first = slot === 0;
        const label = first ? t('setup.where.place', { n: 1 }) : t('setup.where.placeOptional', { n: slot + 1 });
        return (
          <label key={slot} className={fieldStyles.field}>
            <span className={fieldStyles.label}>{label}</span>
            <select
              ref={first ? firstRef : undefined}
              className={fieldStyles.control}
              value={value}
              aria-describedby={first ? errorId : undefined}
              aria-invalid={first && errorId ? true : undefined}
              data-testid={testIds.setup.siteSelect}
              data-slot={slot + 1}
              onChange={(e) => change(slot, e.target.value)}
            >
              <option value="">{first ? t('setup.where.choose') : t('setup.where.none')}</option>
              {PICKER_GROUPS.map(({ group, ids }) => (
                <optgroup key={group} label={tSites(groupLabelKey(group))}>
                  {ids
                    .filter((id) => !takenElsewhere.has(id))
                    .map((id) => (
                      <option key={id} value={id}>
                        {tSites(siteNameKey(id))}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  );
};

export default SitePicker;
