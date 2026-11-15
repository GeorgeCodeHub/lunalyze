import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_PICKS, type Place } from '../../scenario';
import { testIds } from '../../test-ids';
import fieldStyles from '../shared/Field.module.css';
import { groupLabelKey, PICKER_GROUPS, siteNameKey } from './siteIds';
import styles from './PlacePicker.module.css';

type PlacePickerProps = {
  places: Place[]; // the places picked: listed sites, and typed coordinates if any
  onChange: (places: Place[]) => void;
};

const LABEL_ID = 'scenario-bar-places-label';
const BUTTON_ID = 'scenario-bar-places-button';
const MENU_ID = 'scenario-bar-places-menu';

// The places compared with the tool's best option, in the top toolbar: up to 2, ticked in a menu that
// opens under the field. When 2 are picked the others wait until one is unticked; the last place
// cannot be unticked, because the comparison needs one.
const PlacePicker = ({ places, onChange }: PlacePickerProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const [open, setOpen] = useState(false);

  const pickedIds = new Set(places.flatMap((place) => (place.kind === 'site' ? [place.id] : [])));
  const full = places.length >= MAX_PICKS;
  const names = places.map((place) => (place.kind === 'site' ? tSites(siteNameKey(place.id)) : t('site.typedTitle')));

  const toggle = (id: string) => {
    const picked = pickedIds.has(id);
    onChange(picked ? places.filter((place) => place.kind !== 'site' || place.id !== id) : [...places, { kind: 'site', id }]);
  };

  return (
    <div className={fieldStyles.field}>
      <span id={LABEL_ID} className={fieldStyles.label}>
        {t('bar.places')}
      </span>
      <button
        id={BUTTON_ID}
        type="button"
        className={styles.button}
        popoverTarget={MENU_ID}
        aria-labelledby={`${LABEL_ID} ${BUTTON_ID}`}
        aria-expanded={open}
        data-testid={testIds.scenarioBar.places}
        data-count={places.length}
      >
        {names.length > 0 ? names.join(', ') : t('setup.where.choose')}
      </button>
      <div id={MENU_ID} popover="auto" className={styles.menu} onToggle={(e) => setOpen(e.newState === 'open')}>
        <p className={styles.hint}>{t('bar.placesHint', { count: MAX_PICKS })}</p>
        {PICKER_GROUPS.map(({ group, ids }) => (
          <fieldset key={group} className={styles.group}>
            <legend className={styles.groupName}>{tSites(groupLabelKey(group))}</legend>
            {ids.map((id) => {
              const picked = pickedIds.has(id);
              return (
                <label key={id} className={styles.option}>
                  <input
                    type="checkbox"
                    checked={picked}
                    disabled={picked ? places.length === 1 : full}
                    onChange={() => toggle(id)}
                    data-testid={testIds.scenarioBar.placeOption}
                    data-site-id={id}
                  />
                  {tSites(siteNameKey(id))}
                </label>
              );
            })}
          </fieldset>
        ))}
      </div>
    </div>
  );
};

export default PlacePicker;
