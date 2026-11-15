import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import fieldStyles from '../shared/Field.module.css';
import { groupLabelKey, PICKER_GROUPS, siteNameKey } from './siteIds';

type PlaceSelectProps = {
  value: string; // the chosen site id; '' when the place is typed coordinates
  onPick: (siteId: string) => void;
};

// The place the person wants to land, in the top toolbar: pick another and the comparison follows.
const PlaceSelect = ({ value, onPick }: PlaceSelectProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');

  return (
    <label className={fieldStyles.field}>
      <span className={fieldStyles.label}>{t('bar.place')}</span>
      <select
        className={fieldStyles.control}
        value={value}
        data-testid={testIds.scenarioBar.place}
        onChange={(e) => {
          if (e.target.value) onPick(e.target.value);
        }}
      >
        {value === '' && <option value="">{t('bar.placeTyped')}</option>}
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
  );
};

export default PlaceSelect;
