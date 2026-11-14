import { type FormEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Zoom } from '../../../backend/lib/types';
import { DEFAULT_START, type Scenario, type Stay, STAYS, ZOOMS } from '../../scenario';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import IconArrow from '../shared/IconArrow';
import SitePicker from '../site-picker/SitePicker';
import fieldStyles from '../shared/Field.module.css';
import styles from './SetupForm.module.css';

type SetupFormProps = { initial: Scenario | null; onSubmit: (scenario: Scenario) => void };

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const ZOOM_KEYS = { day: 'setup.flex.day', lunarDay: 'setup.flex.lunarDay', year: 'setup.flex.year' } as const;
const STAY_KEYS = { 0.5: 'setup.stay.half', 1: 'setup.stay.one', 2: 'setup.stay.two', 3: 'setup.stay.three' } as const;

const SetupForm = ({ initial, onSubmit }: SetupFormProps) => {
  const { t } = useTranslation('compare');
  const startIso = (initial?.start ?? DEFAULT_START).toISOString();
  const [siteIds, setSiteIds] = useState(initial?.siteIds ?? []);
  const [date, setDate] = useState(() => startIso.slice(0, 10));
  const [hour, setHour] = useState(() => startIso.slice(11, 13));
  const [zoom, setZoom] = useState<Zoom>(initial?.zoom ?? 'lunarDay');
  const [stay, setStay] = useState<Stay>(initial?.stay ?? 1);
  const [showError, setShowError] = useState(false);

  const firstPlaceRef = useRef<HTMLSelectElement>(null);
  const errorVisible = showError && siteIds.length === 0;

  const changeSites = (ids: string[]) => {
    setSiteIds(ids);
    setShowError(false);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (siteIds.length === 0) {
      setShowError(true);
      firstPlaceRef.current?.focus();
      return;
    }
    const start = new Date(`${date}T${hour}:00:00Z`);
    onSubmit({ siteIds, start: Number.isNaN(start.getTime()) ? DEFAULT_START : start, zoom, stay });
  };

  return (
    <form className={styles.form} noValidate onSubmit={submit} data-testid={testIds.setup.form}>
      <fieldset className={styles.step}>
        <legend className={styles.question}>{t('setup.where.label')}</legend>
        <SitePicker
          picked={siteIds}
          onChange={changeSites}
          firstRef={firstPlaceRef}
          errorId={errorVisible ? 'setup-where-error' : undefined}
        />
        {errorVisible && (
          <p id="setup-where-error" className={styles.error} role="alert" data-testid={testIds.setup.siteError}>
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
          <label htmlFor="setup-zoom">{t('setup.flex.label')}</label>
        </legend>
        <select
          id="setup-zoom"
          className={fieldStyles.control}
          value={zoom}
          data-testid={testIds.setup.zoom}
          onChange={(e) => setZoom(e.target.value as Zoom)}
        >
          {ZOOMS.map((z) => (
            <option key={z} value={z}>
              {t(ZOOM_KEYS[z])}
            </option>
          ))}
        </select>
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
