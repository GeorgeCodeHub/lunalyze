import { type KeyboardEvent, type PointerEvent, useRef } from 'react';
import styles from './ResizeHandle.module.css';

type ResizeHandleProps = {
  label: string; // what it resizes, for screen readers
  width: number; // the panel's width now, px
  min: number;
  max: number;
  onResize: (width: number) => void;
  testId: string;
};

const KEY_STEP = 16; // px per arrow key, on the 4px grid

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// A window splitter: drag it, or focus it and use the arrow keys (Home and End jump to the ends), to
// make the panel on its left wider or narrower. The WAI-ARIA window splitter pattern.
const ResizeHandle = ({ label, width, min, max, onResize, testId }: ResizeHandleProps) => {
  const drag = useRef<{ x: number; width: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, width };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    onResize(clamp(drag.current.width + e.clientX - drag.current.x, min, max));
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = { ArrowLeft: width - KEY_STEP, ArrowRight: width + KEY_STEP, Home: min, End: max }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onResize(clamp(next, min, max));
  };

  return (
    <div
      className={styles.handle}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(width)}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      data-testid={testId}
    >
      <span className={styles.grip} aria-hidden="true" />
    </div>
  );
};

export default ResizeHandle;
