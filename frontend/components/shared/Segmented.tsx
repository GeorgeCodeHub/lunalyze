import styles from './Segmented.module.css';

type SegmentedProps<V extends string> = {
  label: string; // what the buttons choose between, for screen readers
  options: { value: V; label: string }[];
  value: V;
  onChange: (value: V) => void;
  testId: string;
};

// A row of buttons where one is pressed: a choice between a few views. The pressed one is filled.
const Segmented = <V extends string>({ label, options, value, onChange, testId }: SegmentedProps<V>) => {
  return (
    <div className={styles.group} role="group" aria-label={label} data-testid={testId} data-value={value}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default Segmented;
