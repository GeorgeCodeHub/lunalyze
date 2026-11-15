import { testIds } from '../../test-ids';
import styles from './MetricCard.module.css';

type MetricCardProps = {
  metric: string; // the SiteView.metrics field this tile shows
  raw: number; // that field's value as backend/lib gave it
  value: string; // the same number with its unit, short enough to read at a glance
  label: string;
  note?: string; // a second line, only when the label alone could be misread
  meter?: { pct: number; body: 'sun' | 'earth' }; // a share of time, 0..100, repeated as a bar in the body's colour
};

// One number to compare: the figure large, then what it measures. The bar repeats a percentage as a
// length, so two cards can be compared without reading; it adds no number.
const MetricCard = ({ metric, raw, value, label, note, meter }: MetricCardProps) => {
  return (
    <li className={styles.tile} data-testid={testIds.metricCards.card} data-metric={metric} data-value={raw}>
      <span className={styles.value}>{value}</span>
      {meter && (
        <svg className={styles.meter} viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
          <rect className={styles.meterTrack} width="100" height="4" />
          <rect className={styles.meterFill} data-body={meter.body} width={Math.min(100, Math.max(0, meter.pct))} height="4" />
        </svg>
      )}
      <span className={styles.label}>{label}</span>
      {note && <span className={styles.note}>{note}</span>}
    </li>
  );
};

export default MetricCard;
