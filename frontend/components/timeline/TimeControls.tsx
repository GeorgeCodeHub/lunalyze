import { type CSSProperties, type KeyboardEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HOUR } from '../../../backend/lib/realView';
import { usePlaybackStore } from '../../stores/compare';
import { testIds } from '../../test-ids';
import { formatDateTime, formatDay } from '../shared/formatTime';
import IconPause from '../shared/IconPause';
import IconPlay from '../shared/IconPlay';
import { PLAYBACK, type TimeFrame } from '../shared/timeFrame';
import { useDuration } from '../shared/useDuration';
import styles from './TimeControls.module.css';

type TimeControlsProps = { frame: TimeFrame };

const TITLE_ID = 'time-controls-title';
const HINT_ID = 'time-controls-hint';
const KEYS_ID = 'time-controls-keys';
const DAY_H = 24;

// The time player, the way a video or weather-radar player reads: what it is, the moment shown in large
// type, then the play button and a track from landing to the end of the time span, with the stay shaded
// on it. One playhead for every place on the screen: the map, sky, 3D view and timelines all follow it.
// The track is a native range input, so arrow keys move 1 hour; Shift + arrow moves 1 day.
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
  const { offsetH, endH, stayH, startMs } = frame;
  const shown = t('playback.utc', { time: formatDateTime(frame.nowMs) });
  const sinceLanding = offsetH === 0 ? t('playback.atLanding') : t('playback.afterLanding', { time: duration(offsetH) });
  const inStay = offsetH <= stayH;
  // The share of the track the stay covers, for the shaded band (0 to 1).
  const stayShare = endH > 0 ? Math.min(1, stayH / endH) : 1;

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
    <section className={styles.controls} aria-labelledby={TITLE_ID}>
      <div className={styles.top}>
        <h3 id={TITLE_ID} className={styles.title}>
          {t('playback.title')}
        </h3>
        <p className={styles.readout} data-testid={testIds.timeline.readout} data-offset-h={offsetH} aria-live="off">
          <strong className={styles.readoutTime}>{shown}</strong>
          <span className={styles.readoutSince}>
            {sinceLanding} · {t(inStay ? 'playback.inStay' : 'playback.afterStay')}
          </span>
        </p>
      </div>
      <div className={styles.row}>
        <button type="button" className={styles.play} onClick={toggle} data-status={status} data-testid={testIds.timeline.play}>
          {playing ? <IconPause /> : <IconPlay />}
          {playing ? t('playback.pause') : t('playback.play')}
        </button>
        <div className={styles.track} style={{ '--stay': stayShare } as CSSProperties}>
          <span className={styles.stay} aria-hidden="true" />
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
              aria-describedby={`${HINT_ID} ${KEYS_ID}`}
              title={t('playback.keys')}
              data-testid={testIds.timeline.scrubber}
              onChange={(e) => seek(Number(e.target.value))}
              onKeyDown={onKeyDown}
            />
          </label>
          <p className={styles.ends} aria-hidden="true">
            <span>{t('playback.start', { date: formatDay(startMs) })}</span>
            <span>{formatDay(startMs + endH * HOUR)}</span>
          </p>
        </div>
      </div>
      <p id={HINT_ID} className={styles.hint}>
        {t('playback.hint')}
      </p>
      <p id={KEYS_ID} className={styles.visuallyHidden}>
        {t('playback.keys')}
      </p>
    </section>
  );
};

export default TimeControls;
