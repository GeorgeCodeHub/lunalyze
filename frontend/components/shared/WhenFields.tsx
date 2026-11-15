import { useTranslation } from 'react-i18next';
import fieldStyles from './Field.module.css';

type WhenFieldsProps = {
  date: string; // YYYY-MM-DD, as the date input holds it
  hour: string; // '00'..'23'
  onDate: (date: string) => void;
  onHour: (hour: string) => void;
  dateTestId: string;
  hourTestId: string;
};

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));

// The landing date and hour, in UTC. Two fields side by side; the parent lays them out.
const WhenFields = ({ date, hour, onDate, onHour, dateTestId, hourTestId }: WhenFieldsProps) => {
  const { t } = useTranslation('compare');

  return (
    <>
      <label className={fieldStyles.field}>
        <span className={fieldStyles.label}>{t('when.date')}</span>
        <input
          type="date"
          className={fieldStyles.control}
          value={date}
          required
          data-testid={dateTestId}
          onChange={(e) => onDate(e.target.value)}
        />
      </label>
      <label className={fieldStyles.field}>
        <span className={fieldStyles.label}>{t('when.time')}</span>
        <select className={fieldStyles.control} value={hour} data-testid={hourTestId} onChange={(e) => onHour(e.target.value)}>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {t('when.hour', { hour: h })}
            </option>
          ))}
        </select>
      </label>
    </>
  );
};

export default WhenFields;
