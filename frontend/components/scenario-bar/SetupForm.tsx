import { type FormEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_START, DEFAULT_STAY, type Scenario, type Stay, STAYS, uniquePlaces, ZOOM } from '../../scenario';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import IconArrow from '../shared/IconArrow';
import { STAY_KEY } from '../shared/stayKeys';
import WhenFields from '../shared/WhenFields';
import { draftFrom, placeFrom } from '../site-picker/placeDrafts';
import SitePicker from '../site-picker/SitePicker';
import fieldStyles from '../shared/Field.module.css';
import styles from './SetupForm.module.css';

type SetupFormProps = { initial: Scenario | null; onSubmit: (scenario: Scenario) => void };

const SetupForm = ({ initial, onSubmit }: SetupFormProps) => {
  const { t } = useTranslation('compare');
  const startIso = (initial?.start ?? DEFAULT_START).toISOString();
  const [draft, setDraft] = useState(() => draftFrom(initial?.places[0]));
  const [date, setDate] = useState(() => startIso.slice(0, 10));
  const [hour, setHour] = useState(() => startIso.slice(11, 13));
  const [stay, setStay] = useState<Stay>(initial?.stay ?? DEFAULT_STAY);
  const [checked, setChecked] = useState(false); // errors show only after the first submit

  const siteRef = useRef<HTMLSelectElement>(null);
  const coordsRef = useRef<HTMLInputElement>(null);
  const place = placeFrom(draft);
  const errorVisible = checked && place === null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setChecked(true);
    if (place === 'invalid') {
      coordsRef.current?.focus();
      return;
    }
    if (place === null) {
      siteRef.current?.focus();
      return;
    }
    const start = new Date(`${date}T${hour}:00:00Z`);
    // The hills switch is not asked here: the Compare screen opens with hills counted, and the switch
    // is there. Coming back to change the setup keeps it, and keeps the other places being compared
    // after the landing place. The time span is always one Moon day.
    onSubmit({
      places: uniquePlaces([place, ...(initial?.places.slice(1) ?? [])]),
      start: Number.isNaN(start.getTime()) ? DEFAULT_START : start,
      zoom: ZOOM,
      stay,
      terrain: initial?.terrain ?? true,
    });
  };

  return (
    <form className={styles.form} noValidate onSubmit={submit} data-testid={testIds.setup.form}>
      <fieldset className={styles.step}>
        <legend className={styles.question}>{t('setup.where.label')}</legend>
        <SitePicker
          draft={draft}
          onChange={setDraft}
          siteRef={siteRef}
          coordsRef={coordsRef}
          errorId={errorVisible ? 'setup-where-error' : undefined}
          coordsInvalid={checked && place === 'invalid'}
        />
        {errorVisible && (
          <p id="setup-where-error" className={fieldStyles.error} role="alert" data-testid={testIds.setup.siteError}>
            <IconAlert />
            {t('setup.where.error')}
          </p>
        )}
      </fieldset>

      <fieldset className={styles.step}>
        <legend className={styles.question}>{t('setup.when.label')}</legend>
        <div className={styles.when}>
          <WhenFields
            date={date}
            hour={hour}
            onDate={setDate}
            onHour={setHour}
            dateTestId={testIds.setup.date}
            hourTestId={testIds.setup.hour}
          />
        </div>
      </fieldset>

      <fieldset className={styles.step}>
        <legend className={styles.question}>
          <label htmlFor="setup-stay">{t('setup.stay.label')}</label>
        </legend>
        <select
          id="setup-stay"
          className={fieldStyles.control}
          value={stay}
          data-testid={testIds.setup.stay}
          onChange={(e) => setStay(Number(e.target.value) as Stay)}
        >
          {STAYS.map((s) => (
            <option key={s} value={s}>
              {t(`setup.stay.${STAY_KEY[s]}`)}
            </option>
          ))}
        </select>
      </fieldset>

      <button type="submit" className={styles.submit} data-testid={testIds.setup.submit}>
        <span className={styles.submitLabel}>{t('setup.submit')}</span>
        <IconArrow />
      </button>
    </form>
  );
};

export default SetupForm;
