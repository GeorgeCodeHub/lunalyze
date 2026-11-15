import fieldStyles from './Field.module.css';

type SelectFieldProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  testId: string;
};

// A labelled dropdown in the shared frosted-glass field style.
const SelectField = ({ label, value, options, onChange, testId }: SelectFieldProps) => {
  return (
    <label className={fieldStyles.field}>
      <span className={fieldStyles.label}>{label}</span>
      <select className={fieldStyles.control} value={value} data-testid={testId} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default SelectField;
