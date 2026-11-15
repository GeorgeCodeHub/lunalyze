import type { CSSProperties, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import { compassPoint, type LookAction } from './lookTurn';
import styles from './Terrain3D.module.css';

type CompassProps = {
  heading: number; // the bearing the view faces, degrees clockwise from north
  onNorth: () => void;
  onLook: (action: LookAction) => void;
};

const KEYS: Record<string, LookAction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

// A map's compass: the direction the view faces in the middle, a ring of ticks that turns with the view,
// and a red mark that always points north. Press it to face north. With the keyboard on it, the arrow
// keys turn and tilt the view, as dragging the picture does.
const Compass = ({ heading, onNorth, onLook }: CompassProps) => {
  const { t } = useTranslation('compare');

  const point = compassPoint(heading);
  const label = t('terrain3d.compassLabel', { direction: t(`terrain3d.heading_${point}`) });

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const action = KEYS[e.key];
    if (!action) return;
    e.preventDefault();
    onLook(action);
  };

  return (
    <button
      type="button"
      className={styles.compassDial}
      style={{ '--north': `${-heading}deg` } as CSSProperties}
      aria-label={label}
      title={label}
      onClick={onNorth}
      onKeyDown={onKeyDown}
      data-testid={testIds.terrain3d.compass}
      data-heading={Math.round(heading)}
      data-point={point}
    >
      <span className={styles.dial} aria-hidden="true">
        <span className={styles.needle} />
      </span>
      <span className={styles.headingLetter} aria-hidden="true">
        {t(`terrain3d.point_${point}`)}
      </span>
    </button>
  );
};

export default Compass;
