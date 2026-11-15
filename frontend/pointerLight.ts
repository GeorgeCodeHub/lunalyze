// Where the mouse is over the button under it, so the warm light inside the button can glide after it
// (Section.module.css, .lit). Written on the button as --pointer-x and --pointer-y: percent of its width and
// height from its top-left corner. A touch or a pen leaves the light where it rests.

/** How far along a side the pointer is, as a percent from 0 to 100, to one decimal place. */
export const pointerPercent = (offset: number, size: number): number =>
  Math.round(Math.min(100, Math.max(0, (offset / size) * 100)) * 10) / 10;

const onPointerMove = (e: PointerEvent) => {
  if (e.pointerType !== 'mouse') return;
  const button = e.target instanceof Element ? e.target.closest('button') : null;
  if (!button) return;
  const box = button.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return; // not laid out: nothing to light
  button.style.setProperty('--pointer-x', `${pointerPercent(e.clientX - box.left, box.width)}%`);
  button.style.setProperty('--pointer-y', `${pointerPercent(e.clientY - box.top, box.height)}%`);
};

/** Starts following the mouse over buttons. Returns a function that stops. */
export const watchPointerLight = (): (() => void) => {
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  return () => window.removeEventListener('pointermove', onPointerMove);
};
