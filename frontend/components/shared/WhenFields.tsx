import { type CSSProperties, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_START } from '../../scenario';
import DateCalendar from './DateCalendar';
import fieldStyles from './Field.module.css';
import { testIds } from '../../test-ids';
import SelectField from './SelectField';
import styles from './WhenFields.module.css';

type WhenFieldsProps = {
  date: string; // YYYY-MM-DD, as the date input holds it
  hour: string; // '00'..'23'
  onDate: (date: string) => void;
  onHour: (hour: string) => void;
  dateTestId: string;
  hourTestId: string;
};

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));

// The landing date and hour, in UTC. Two fields side by side; the parent lays them out. The date can be
// typed, or picked in the calendar menu that the field's calendar button opens under it.
const WhenFields = ({ date, hour, onDate, onHour, dateTestId, hourTestId }: WhenFieldsProps) => {
  const { t } = useTranslation('compare');
  const id = useId();

  const inputId = `${id}-date`;
  const calendarId = `${id}-calendar`;
  const anchor = `--calendar-${id.replace(/[^a-zA-Z0-9-]/g, '')}`; // the field and its menu find each other by this name

  return (
    <>
      <div className={fieldStyles.field} style={{ '--calendar-anchor': anchor } as CSSProperties}>
        <label className={fieldStyles.label} htmlFor={inputId}>
          {t('when.date')}
        </label>
        <div className={styles.date}>
          <input
            id={inputId}
            type="date"
            className={`${fieldStyles.control} ${styles.input}`}
            value={date}
            required
            data-testid={dateTestId}
            onChange={(e) => onDate(e.target.value)}
          />
          <button type="button" className={styles.open} popoverTarget={calendarId} aria-label={t('when.openCalendar')} title={t('when.openCalendar')} data-testid={testIds.when.open} />
          <DateCalendar id={calendarId} value={date} fallback={DEFAULT_START.toISOString().slice(0, 10)} onPick={onDate} />
        </div>
      </div>
      <SelectField
        label={t('when.time')}
        value={hour}
        options={HOURS.map((h) => ({ value: h, label: t('when.hour', { hour: h }) }))}
        onChange={onHour}
        testId={hourTestId}
      />
    </>
  );
};

export default WhenFields;
