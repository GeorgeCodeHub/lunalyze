import type { Place, Stay } from '../../scenario';
import { testIds } from '../../test-ids';
import type { TimeFrame } from '../shared/timeFrame';
import AddPlace from '../site-picker/AddPlace';
import type { ColumnModel } from './columnModel';
import PlaceNote from './PlaceNote';
import SiteColumn from './SiteColumn';
import styles from './SiteColumns.module.css';

type SiteColumnsProps = {
  columns: ColumnModel[];
  frame: TimeFrame;
  stay: Stay;
  terrain: boolean;
  pickedIds: string[];
  canAdd: boolean; // false once 3 places are picked
  onAdd: (place: Place) => void;
  onRemove: (key: string) => void;
};

// The picked places side by side, then the open slot for one more.
const SiteColumns = ({ columns, frame, stay, terrain, pickedIds, canAdd, onAdd, onRemove }: SiteColumnsProps) => {
  const removable = columns.length > 1; // the last place stays: without one there is nothing to compare

  return (
    <div className={styles.columns} data-testid={testIds.siteColumns.root} data-count={columns.length}>
      {columns.map((column) => {
        const remove = removable ? () => onRemove(column.key) : undefined;
        return column.kind === 'ready' ? (
          <SiteColumn
            key={column.key}
            view={column.view}
            stayView={column.stayView}
            now={column.now}
            frame={frame}
            stay={stay}
            terrain={terrain}
            onRemove={remove}
          />
        ) : (
          <PlaceNote key={column.key} column={column} onRemove={remove} />
        );
      })}
      {canAdd && <AddPlace pickedIds={pickedIds} onAdd={onAdd} />}
    </div>
  );
};

export default SiteColumns;
