import type { ReactNode } from 'react';
import type { Stay } from '../../scenario';
import type { TimeFrame } from '../shared/timeFrame';
import type { ColumnModel } from './columnModel';
import type { Role } from './pickPlaces';
import PlaceCard from './PlaceCard';
import PlaceNote from './PlaceNote';

type PlaceSlotProps = {
  column: ColumnModel;
  role: Role;
  alsoYours?: boolean; // the best option is also the place chosen in setup
  frame: TimeFrame;
  stay: Stay;
  terrain: boolean;
  foot?: ReactNode; // why the best option won
  how?: ReactNode; // the best option's details add how it was chosen
  onRemove?: () => void; // takes a picked place out of the comparison
  compact?: boolean; // drawn small, to see every place at once
};

// One side of the comparison: the full card when the place has its data, the note that says why not otherwise.
const PlaceSlot = ({ column, role, alsoYours, frame, stay, terrain, foot, how, onRemove, compact }: PlaceSlotProps) => {
  if (column.kind !== 'ready') {
    return (
      <PlaceNote column={column} role={role} onRemove={onRemove}>
        {foot}
      </PlaceNote>
    );
  }

  return (
    <PlaceCard
      role={role}
      alsoYours={alsoYours}
      view={column.view}
      stayView={column.stayView}
      now={column.now}
      frame={frame}
      stay={stay}
      terrain={terrain}
      why={foot}
      how={how}
      onRemove={onRemove}
      compact={compact}
    />
  );
};

export default PlaceSlot;
