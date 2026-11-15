import { testIds } from '../../test-ids';
import IconClose from '../shared/IconClose';
import styles from './ColumnHeader.module.css';

type ColumnHeaderProps = {
  titleId: string;
  title: string;
  meta: string[]; // short facts under the name: group, position, "approximate location"
  removeLabel: string;
  onRemove?: () => void; // left out when this is the only place: the screen always shows one
};

const ColumnHeader = ({ titleId, title, meta, removeLabel, onRemove }: ColumnHeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h2 id={titleId} className={styles.name}>
          {title}
        </h2>
        {meta.length > 0 && (
          <ul className={styles.meta}>
            {meta.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          aria-label={removeLabel}
          title={removeLabel}
          onClick={onRemove}
          data-testid={testIds.siteColumns.remove}
        >
          <IconClose />
        </button>
      )}
    </header>
  );
};

export default ColumnHeader;
