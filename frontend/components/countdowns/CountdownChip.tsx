import { useTranslation } from 'react-i18next';
import type { Countdown } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import BodyGlyph from '../shared/BodyGlyph';
import { useDuration } from '../shared/useDuration';
import styles from './CountdownChip.module.css';

type CountdownChipProps = { body: 'sun' | 'earth'; countdown: Countdown };

const KEYS = {
  sun: { set: 'countdown.sunset', rise: 'countdown.sunrise', staysUp: 'countdown.sunStaysUp', staysDown: 'countdown.sunStaysDown' },
  earth: {
    set: 'countdown.earthset',
    rise: 'countdown.earthrise',
    staysUp: 'countdown.earthStaysUp',
    staysDown: 'countdown.earthStaysDown',
  },
} as const;

// "Sunset in 11h 43m". A body that is up counts down to its set, one that is down to its rise.
// hours null means nothing changes within one Moon day, so the chip says it stays as it is.
const CountdownChip = ({ body, countdown }: CountdownChipProps) => {
  const { t } = useTranslation('compare');
  const duration = useDuration();

  const keys = KEYS[body];
  const text =
    countdown.hours === null
      ? t(countdown.kind === 'set' ? keys.staysUp : keys.staysDown)
      : t(keys[countdown.kind], { time: duration(countdown.hours, 'short') });

  return (
    <li
      className={styles.chip}
      data-testid={testIds.countdowns.chip}
      data-body={body}
      data-kind={countdown.kind}
      data-change={countdown.hours === null ? 'none' : 'coming'}
      title={countdown.hours === null ? t('countdown.noChange') : undefined}
    >
      <BodyGlyph body={body} />
      <span>{text}</span>
    </li>
  );
};

export default CountdownChip;
