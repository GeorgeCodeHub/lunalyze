import { type CSSProperties, useId } from 'react';
import IconInfo from './IconInfo';
import styles from './InfoTip.module.css';

type InfoTipProps = {
  label: string; // what the explanation is about, for the button: "How to read this view"
  text: string; // the explanation, shown only when asked for
  testId?: string;
};

// Progressive disclosure: an explanation kept off the screen until someone asks for it. A small round
// "i" opens it under the button; Escape or a click elsewhere closes it (the native popover).
const InfoTip = ({ label, text, testId }: InfoTipProps) => {
  const id = useId();

  const anchor = `--info-${id.replace(/[^a-zA-Z0-9-]/g, '')}`; // the button and its popover find each other by this name

  return (
    <span className={styles.wrap} style={{ '--info-anchor': anchor } as CSSProperties}>
      <button type="button" className={styles.button} popoverTarget={id} aria-label={label} title={label} data-testid={testId}>
        <IconInfo />
      </button>
      <span id={id} popover="auto" className={styles.tip}>
        {text}
      </span>
    </span>
  );
};

export default InfoTip;
