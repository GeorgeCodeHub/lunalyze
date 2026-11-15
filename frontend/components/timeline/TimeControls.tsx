import { type KeyboardEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlaybackStore } from '../../stores/compare';
import { testIds } from '../../test-ids';
import { formatDateTime } from '../shared/formatTime';
import IconPause from '../shared/IconPause';
import IconPlay from '../shared/IconPlay';
import { PLAYBACK, type TimeFrame } from '../shared/timeFrame';
import { useDuration } from '../shared/useDuration';
import styles from './TimeControls.module.css';

type TimeControlsProps = { frame: TimeFrame };

const HINT_ID = 'time-controls-hint';
const DAY_H = 24;

// The play button and the time scrubber: one playhead for every place on the screen.
// The scrubber is a native range input, so arrow keys move 1 hour; Shift + arrow moves 1 day.
const TimeControls = ({ frame }: TimeControlsProps) => {
  const { t } = useTranslation('compare');
  const status = usePlaybackStore((s) => s.status);
  const play = usePlaybackStore((s) => s.play);
  const pause = usePlaybackStore((s) => s.pause);
  const seek = usePlaybackStore((s) => s.seek);
  const tick = usePlaybackStore((s) => s.tick);
  const duration = useDuration();

  const playing = status === 'playing';
  const { stepH, tickMs } = PLAYBACK[frame.zoom];
  const { offsetH, endH } = frame;
  const shown = t('playback.utc', { time: formatDateTime(frame.nowMs) });
  const sinceLanding = offsetH === 0 ? t('playback.atLanding') : t('playback.afterLanding', { time: duration(offsetH) });

  const toggle = () => {
    if (playing) {
      pause();
      return;
    }
    if (offsetH >= endH) seek(0); // at the end: play again from the landing time
    play(stepH);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!e.shiftKey) return;
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowUp';
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowDown';
    if (!forward && !back) return;
    e.preventDefault();
    seek(Math.min(endH, Math.max(0, offsetH + (forward ? DAY_H : -DAY_H))));
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => tick(endH), tickMs);
    return () => window.clearInterval(id);
  }, [playing, tick, endH, tickMs]);

  return (
    <div className={styles.controls}>
      <button type="button" className={styles.play} onClick={toggle} data-status={status} data-testid={testIds.timeline.play}>
        {playing ? <IconPause /> : <IconPlay />}
        {playing ? t('playback.pause') : t('playback.play')}
      </button>
      <label className={styles.scrub}>
        <span className={styles.visuallyHidden}>{t('playback.scrubber')}</span>
        <input
          type="range"
          className={styles.range}
          min={0}
          max={endH}
          step={1}
          value={offsetH}
          aria-valuetext={`${shown}, ${sinceLanding}`}
          aria-describedby={HINT_ID}
          title={t('playback.hint')}
          data-testid={testIds.timeline.scrubber}
          onChange={(e) => seek(Number(e.target.value))}
          onKeyDown={onKeyDown}
        />
      </label>
      <p className={styles.readout} data-testid={testIds.timeline.readout} data-offset-h={offsetH}>
        <span className={styles.readoutLabel}>{t('playback.showing')}</span>
        <strong className={styles.readoutTime}>{shown}</strong>
        <span className={styles.readoutSince}>{sinceLanding}</span>
      </p>
      <p id={HINT_ID} className={styles.visuallyHidden}>
        {t('playback.hint')}
      </p>
    </div>
  );
};

export default TimeControls;
