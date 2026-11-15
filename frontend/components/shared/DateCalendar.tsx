import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import { dayMs, isIsoDay, monthGrid, monthOf, shiftDay, shiftMonth } from './calendar';
import { formatDateLong, formatDayNumber, formatMonthLong, formatWeekdayNarrow } from './formatTime';
import IconChevron from './IconChevron';
import styles from './DateCalendar.module.css';

type DateCalendarProps = {
  id: string; // the popover's id: the field's calendar button opens it
  value: string; // the field's date, YYYY-MM-DD; may be half-typed
  fallback: string; // the day to open on when the field holds no full date
  onPick: (day: string) => void;
};

// Keys that move the focused day, in days: arrows by a day or a week.
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

// The calendar menu under the date field, in the app's own look (the same colour, edge and shadow as the
// other menus). A month at a time, Monday first. Arrow keys move between days, Page Up and Page Down
// between months; Enter or a click picks the day and closes the menu.
const DateCalendar = ({ id, value, fallback, onPick }: DateCalendarProps) => {
  const { t } = useTranslation('compare');
  const selected = isIsoDay(value) ? value : null;
  const [focus, setFocus] = useState(selected ?? fallback);

  const menu = useRef<HTMLDivElement>(null);
  const month = monthOf(focus);
  const days = monthGrid(month);
  const weekdays = days.slice(0, 7);

  const close = () => {
    try {
      if (menu.current?.matches(':popover-open')) menu.current.hidePopover();
    } catch {
      // A browser without popovers shows the calendar in place: there is nothing to close.
    }
  };

  const pick = (day: string) => {
    onPick(day);
    close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = STEPS[e.key];
    const months = e.key === 'PageUp' ? -1 : e.key === 'PageDown' ? 1 : 0;
    if (step === undefined && months === 0) return;
    e.preventDefault();
    setFocus(months === 0 ? shiftDay(focus, step) : `${shiftMonth(month, months)}-01`);
  };

  // Keep the keyboard on the focused day as it moves (only while the menu is open).
  useEffect(() => {
    const element = menu.current;
    if (!element?.matches?.(':popover-open')) return;
    element.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus]);

  return (
    <div
      ref={menu}
      id={id}
      popover="auto"
      className={styles.calendar}
      onToggle={(e) => {
        if (e.newState !== 'open') return;
        const day = selected ?? fallback;
        setFocus(day);
        // Put the keyboard on that day as the menu opens, so the arrow keys work at once.
        requestAnimationFrame(() => menu.current?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus());
      }}
      data-testid={testIds.when.calendar}
    >
      <div className={styles.head}>
        <button type="button" className={styles.step} aria-label={t('when.prevMonth')} onClick={() => setFocus(`${shiftMonth(month, -1)}-01`)} data-testid={testIds.when.prevMonth}>
          <IconChevron />
        </button>
        <p className={styles.month} aria-live="polite" data-testid={testIds.when.month} data-month={month}>
          {formatMonthLong(dayMs(`${month}-01`))}
        </p>
        <button type="button" className={styles.step} aria-label={t('when.nextMonth')} onClick={() => setFocus(`${shiftMonth(month, 1)}-01`)} data-testid={testIds.when.nextMonth}>
          <IconChevron />
        </button>
      </div>
      <div className={styles.grid} role="group" aria-label={formatMonthLong(dayMs(`${month}-01`))} onKeyDown={onKeyDown}>
        {weekdays.map((day) => (
          <span key={`weekday-${day}`} className={styles.weekday} aria-hidden="true">
            {formatWeekdayNarrow(dayMs(day))}
          </span>
        ))}
        {days.map((day) => (
          <button
            key={day}
            type="button"
            className={styles.day}
            tabIndex={day === focus ? 0 : -1}
            aria-label={formatDateLong(dayMs(day))}
            aria-pressed={day === selected}
            data-day={day}
            data-outside={monthOf(day) !== month}
            onClick={() => pick(day)}
            data-testid={testIds.when.day}
          >
            {formatDayNumber(dayMs(day))}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateCalendar;
