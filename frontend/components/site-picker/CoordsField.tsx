import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import fieldStyles from '../shared/Field.module.css';
import IconAlert from '../shared/IconAlert';
import { parseCoords } from './placeDrafts';
import styles from './CoordsField.module.css';

type CoordsFieldProps = {
  value: string; // the coordinates in use, as "latitude, longitude"; '' when the place is a listed site
  onPick: (coords: { lat: number; lon: number }) => void;
};

const ERROR_ID = 'scenario-bar-coords-error';

// The person's own coordinates, in the top toolbar. The text is used when the person presses Enter or
// leaves the field, not on every key, so half-typed numbers never reach the comparison.
const CoordsField = ({ value, onPick }: CoordsFieldProps) => {
  const { t } = useTranslation('compare');
  const [draft, setDraft] = useState<string | null>(null); // what is being typed; null shows the coordinates in use
  const [invalid, setInvalid] = useState(false);

  const commit = () => {
    const text = (draft ?? '').trim();
    if (text === '') return; // nothing typed: the place stays as it is
    const coords = parseCoords(text);
    setInvalid(coords === null);
    if (coords) onPick(coords);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    commit();
  };

  return (
    <form className={styles.form} noValidate onSubmit={submit}>
      <label className={fieldStyles.field}>
        <span className={fieldStyles.label}>{t('bar.coords')}</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          className={fieldStyles.control}
          value={draft ?? value}
          placeholder={t('setup.where.coordsExample')}
          title={t('setup.where.coordsHint')}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? ERROR_ID : undefined}
          data-testid={testIds.scenarioBar.coords}
          onChange={(e) => {
            setDraft(e.target.value);
            setInvalid(false);
          }}
          onBlur={commit}
        />
      </label>
      {invalid && (
        <p id={ERROR_ID} className={fieldStyles.error} role="alert" data-testid={testIds.scenarioBar.coordsError}>
          <IconAlert />
          {t('setup.where.coordsError')}
        </p>
      )}
    </form>
  );
};

export default CoordsField;
