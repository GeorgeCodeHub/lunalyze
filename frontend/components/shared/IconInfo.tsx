// A drawn "i": a dot over a short bar, 1.5px stroke to match the panel lines. Decorative: the button
// around it carries the label.
const IconInfo = () => {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="2.75" r="1" fill="currentColor" />
      <path d="M6 5.25v5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

export default IconInfo;
