import { useTranslation } from 'react-i18next';
import type { Place } from '../../scenario';
import { testIds } from '../../test-ids';
import fieldStyles from '../shared/Field.module.css';
import { groupLabelKey, PICKER_GROUPS, siteNameKey } from './siteIds';
import styles from './AddPlace.module.css';

type AddPlaceProps = { pickedIds: string[]; onAdd: (place: Place) => void };

const TITLE_ID = 'add-place-title';

// The empty slot beside the picked places: choose another known site and it joins the comparison at once.
// Sites already on the screen are left out of the list.
const AddPlace = ({ pickedIds, onAdd }: AddPlaceProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');

  const picked = new Set(pickedIds);
  const groups = PICKER_GROUPS.map(({ group, ids }) => ({ group, ids: ids.filter((id) => !picked.has(id)) })).filter(
    ({ ids }) => ids.length > 0,
  );

  return (
    <section className={styles.add} aria-labelledby={TITLE_ID}>
      <h2 id={TITLE_ID} className={styles.title}>
        {t('picker.addTitle')}
      </h2>
      <p className={styles.hint}>{t('picker.addHint')}</p>
      <label className={fieldStyles.field}>
        <span className={fieldStyles.label}>{t('picker.add')}</span>
        <select
          className={fieldStyles.control}
          value=""
          data-testid={testIds.sitePicker.add}
          onChange={(e) => {
            if (e.target.value) onAdd({ kind: 'site', id: e.target.value });
          }}
        >
          <option value="">{t('picker.choose')}</option>
          {groups.map(({ group, ids }) => (
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
    </section>
  );
};

export default AddPlace;
