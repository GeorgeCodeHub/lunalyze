import type { ReactNode } from 'react';
import IconAlert from './IconAlert';
import styles from './Caveat.module.css';

type CaveatProps = { children: ReactNode; testId?: string; kind?: string };

// A plain note that says where the numbers stop being exact. A drawn mark and words, never colour alone.
const Caveat = ({ children, testId, kind }: CaveatProps) => {
  return (
    <p className={styles.caveat} data-testid={testId} data-kind={kind}>
      <IconAlert />
      <span>{children}</span>
    </p>
  );
};

export default Caveat;
