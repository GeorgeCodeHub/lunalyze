import { type CSSProperties, type KeyboardEvent, type PointerEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import { angleDelta, compassPoint, dialAngle, type LookAction } from './lookTurn';
import styles from './Terrain3D.module.css';

type CompassProps = {
  heading: number; // the bearing the view faces, degrees clockwise from north
  onNorth: () => void;
  onLook: (action: LookAction) => void;
  onTurn: (degrees: number) => void; // turn the view left (+) or right (-) by this many degrees
};

const KEYS: Record<string, LookAction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

// Below this many degrees a press that moves a little is still a press (face north), not a drag.
const DRAG_START = 2;

// A map's compass: the direction the view faces in the middle, a ring of ticks that turns with the view,
// and a red mark that always points north. Drag the ring round and the view turns with it, the north mark
// following the pointer. Press it to face north. With the keyboard on it, the arrow keys turn and tilt.
const Compass = ({ heading, onNorth, onLook, onTurn }: CompassProps) => {
  const { t } = useTranslation('compare');

  const drag = useRef<{ angle: number; moved: number } | null>(null);
  const dragged = useRef(false);
  const point = compassPoint(heading);
  const label = t('terrain3d.compassLabel', { direction: t(`terrain3d.heading_${point}`) });

  // The pointer's angle around the dial's centre, degrees clockwise from up.
  const angleAt = (e: PointerEvent<HTMLButtonElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return dialAngle(box.left + box.width / 2, box.top + box.height / 2, e.clientX, e.clientY);
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { angle: angleAt(e), moved: 0 };
    dragged.current = false;
  };

  // Turning the ring clockwise turns north clockwise on the dial, so the view turns left by the same angle.
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const last = drag.current;
    if (!last) return;
    const angle = angleAt(e);
    const delta = angleDelta(last.angle, angle);
    const moved = last.moved + Math.abs(delta);
    drag.current = { angle, moved };
    if (moved < DRAG_START) return;
    dragged.current = true;
    onTurn(delta);
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const onClick = () => {
    if (dragged.current) {
      dragged.current = false; // the end of a drag, not a press
      return;
    }
    onNorth();
  };

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
      onClick={onClick}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
