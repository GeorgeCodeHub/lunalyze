// A drawn warning mark for error messages, so errors never rely on colour alone.
const IconAlert = () => {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="0.75" y="0.75" width="12.5" height="12.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 3.5v4.5M7 9.5v1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

export default IconAlert;
