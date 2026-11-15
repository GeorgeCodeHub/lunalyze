import { type CSSProperties, useId, useState } from 'react';
import fieldStyles from './Field.module.css';
import styles from './Menu.module.css';

type SelectFieldProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  testId: string;
};

// A labelled dropdown: a field that opens the app's own menu under it, the same in every browser (a
// native select's list is the browser's own outside Chromium). The field carries the chosen value in
// data-value; each choice is a radio, so arrow keys move through them.
const SelectField = ({ label, value, options, onChange, testId }: SelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const id = useId();

  const labelId = `${id}-label`;
  const buttonId = `${id}-button`;
  const menuId = `${id}-menu`;
  const anchor = `--menu-${id.replace(/[^a-zA-Z0-9-]/g, '')}`; // the field and its menu find each other by this name
  const chosen = options.find((o) => o.value === value);

  return (
    <div className={fieldStyles.field} style={{ '--menu-anchor': anchor } as CSSProperties} data-testid={testId} data-value={value}>
      <span id={labelId} className={fieldStyles.label}>
        {label}
      </span>
      <button
        id={buttonId}
        type="button"
        className={styles.button}
        popoverTarget={menuId}
        aria-labelledby={`${labelId} ${buttonId}`}
        aria-expanded={open}
      >
        {chosen?.label}
      </button>
      <div id={menuId} popover="auto" className={styles.menu} onToggle={(e) => setOpen(e.newState === 'open')}>
        {options.map((o) => (
          <label key={o.value} className={styles.option}>
            <input
              type="radio"
              name={menuId}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
              onClick={(e) => {
                // A pointer pick closes the menu; arrow keys move through the list and leave it open.
                if (e.detail > 0) document.getElementById(menuId)?.hidePopover();
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default SelectField;
