// How the person last moved focus: with the keyboard (Tab) or with a pointer (mouse, touch, pen).
// It is recorded on <html data-modality>, so styles can show the focus outline for the keyboard only:
// a field that was clicked keeps its one lit edge, without a second ring around it.
export type Modality = 'keyboard' | 'pointer';

const record = (modality: Modality) => {
  document.documentElement.dataset.modality = modality;
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') record('keyboard');
};

const onPointerDown = () => record('pointer');

/** Starts recording. Until the first Tab or click nothing is recorded, and outlines show as usual. Returns a function that stops. */
export const watchInputModality = (): (() => void) => {
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('pointerdown', onPointerDown, true);
  return () => {
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('pointerdown', onPointerDown, true);
    delete document.documentElement.dataset.modality;
  };
};
