import { testIds } from '../../test-ids';
import styles from './MetricCard.module.css';

type MetricCardProps = {
  metric: string; // the SiteView.metrics field this card shows
  raw: number; // that field's value as backend/lib gave it
  label: string;
  value: string; // the same number with its unit, written out for reading
  note: string; // the time range the number covers
  meter?: { pct: number; body: 'sun' | 'earth' }; // a bar for a share of time, 0..100
};

// One number with its unit and its time range. The bar repeats a percentage as a length; it adds no number.
const MetricCard = ({ metric, raw, label, value, note, meter }: MetricCardProps) => {
  return (
    <li className={styles.card} data-testid={testIds.metricCards.card} data-metric={metric} data-value={raw}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {meter && (
        <svg className={styles.meter} viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
          <rect className={styles.meterTrack} width="100" height="4" />
          <rect className={styles.meterFill} data-body={meter.body} width={Math.min(100, Math.max(0, meter.pct))} height="4" />
        </svg>
      )}
      <span className={styles.note}>{note}</span>
    </li>
  );
};

export default MetricCard;
