import { type FormEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_START, DEFAULT_STAY, type Scenario, type Stay, STAYS } from '../../scenario';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import IconArrow from '../shared/IconArrow';
import { draftFrom, placeFrom } from '../site-picker/placeDrafts';
import SitePicker from '../site-picker/SitePicker';
import fieldStyles from '../shared/Field.module.css';
import styles from './SetupForm.module.css';

type SetupFormProps = { initial: Scenario | null; onSubmit: (scenario: Scenario) => void };

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const STAY_KEYS = {
  1: 'setup.stay.day',
  3: 'setup.stay.threeDays',
  7: 'setup.stay.week',
  14: 'setup.stay.twoWeeks',
  30: 'setup.stay.month',
} as const;

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
    // The time window is not asked here; the Compare screen opens on one Moon day and can zoom.
    onSubmit({
      places: [place],
      start: Number.isNaN(start.getTime()) ? DEFAULT_START : start,
      zoom: initial?.zoom ?? 'lunarDay',
      stay,
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
          <label className={fieldStyles.field}>
            <span className={fieldStyles.label}>{t('setup.when.date')}</span>
            <input
              type="date"
              className={fieldStyles.control}
              value={date}
              required
              data-testid={testIds.setup.date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className={fieldStyles.field}>
            <span className={fieldStyles.label}>{t('setup.when.time')}</span>
            <select
              className={fieldStyles.control}
              value={hour}
              data-testid={testIds.setup.hour}
              onChange={(e) => setHour(e.target.value)}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {t('setup.when.hour', { hour: h })}
                </option>
              ))}
            </select>
          </label>
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
              {t(STAY_KEYS[s])}
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
