// A drawn ›, 1.5px stroke to match the panel lines. It points right; turn it with CSS for the other
// directions. Decorative: the button carries the label.
const IconChevron = () => {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

export default IconChevron;
