"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent
} from "react";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";

// ISO datetime-local format used internally and emitted to onChange:
// "YYYY-MM-DDTHH:mm" — same as <input type="datetime-local">.

type Props = {
  locale: Locale;
  value: string;
  onChange: (next: string) => void;
  id?: string;
  ariaLabel?: string;
};

const BCP47: Record<Locale, string> = {
  sr: "sr-Latn",
  en: "en-US",
  ru: "ru-RU"
};

const TIME_STEP_MIN = 15;
const TIME_SLOTS_PER_DAY = (24 * 60) / TIME_STEP_MIN + 1; // 00:00 through 24:00

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let i = 0; i < TIME_SLOTS_PER_DAY; i++) {
    const m = i * TIME_STEP_MIN;
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTrigger(iso: string, locale: Locale): string {
  const parsed = parseStoredValue(iso);
  if (!parsed) return iso;
  const datePart = parsed.date.toLocaleDateString(BCP47[locale], {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return `${datePart} ${parsed.time}`;
}

function parseStoredValue(
  value: string
): { date: Date; time: string } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (hour > 24 || minute > 59 || (hour === 24 && minute !== 0)) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return { date, time: `${pad(hour)}:${pad(minute)}` };
}

// Build a 6-row x 7-col matrix. The reference picker starts weeks on Sunday.
function calendarCells(year: number, month: number, weekStart: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() - weekStart + 7) % 7;
  const cells: { date: Date; otherMonth: boolean }[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, 1 - (startOffset - i));
    cells.push({ date: d, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), otherMonth: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, otherMonth: true });
  }
  return cells;
}

function weekdayShort(locale: Locale, weekStart: number): string[] {
  const fmt = new Intl.DateTimeFormat(BCP47[locale], { weekday: "short" });
  // Use a fixed reference Sunday (2024-01-07) and rotate to weekStart.
  const base: Date[] = [];
  for (let i = 0; i < 7; i++) {
    base.push(new Date(2024, 0, 7 + i));
  }
  const rotated = [...base.slice(weekStart), ...base.slice(0, weekStart)];
  return rotated.map((d) => fmt.format(d).replace(".", ""));
}

function monthName(locale: Locale, monthIndex: number, year: number): string {
  return new Intl.DateTimeFormat(BCP47[locale], { month: "long" }).format(
    new Date(year, monthIndex, 1)
  );
}

export default function DateTimePicker({
  locale,
  value,
  onChange,
  id,
  ariaLabel
}: Props) {
  const dict = t(locale).modal;
  const pickerDict = dict.dateTimePicker;
  const today = startOfDay(new Date());
  const weekStart = 0;

  const initial = useMemo(() => parseStoredValue(value), [value]);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState((initial?.date ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((initial?.date ?? today).getMonth());
  const [pendingDate, setPendingDate] = useState<Date | null>(
    initial ? startOfDay(initial.date) : null
  );
  const [pendingTime, setPendingTime] = useState<string | null>(
    initial ? initial.time : null
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const timeListRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click + Escape, only while open.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // On open, reset pending state from `value` and scroll the active time
  // slot into view inside the time list.
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setViewYear(initial.date.getFullYear());
      setViewMonth(initial.date.getMonth());
      setPendingDate(startOfDay(initial.date));
      setPendingTime(initial.time);
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setPendingDate(null);
      setPendingTime(null);
    }
    // Scroll selected time slot into view.
    requestAnimationFrame(() => {
      const list = timeListRef.current;
      if (!list) return;
      const active = list.querySelector<HTMLButtonElement>(
        "[data-active='true']"
      );
      if (active) {
        active.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const minMonth =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  const goPrevMonth = () => {
    if (minMonth) return;
    const nextMonth = viewMonth - 1;
    if (nextMonth < 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth(nextMonth);
    }
  };
  const goNextMonth = () => {
    const nextMonth = viewMonth + 1;
    if (nextMonth > 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth(nextMonth);
    }
  };

  const onPickDate = (d: Date) => {
    if (d < today) return;
    setPendingDate(startOfDay(d));
  };

  const isDateDisabled = (d: Date) => d < today;
  const canConfirm = pendingDate !== null && pendingTime !== null;

  const onConfirm = () => {
    if (!pendingDate || !pendingTime) return;
    const [h, m] = pendingTime.split(":").map(Number);
    const iso = `${pendingDate.getFullYear()}-${pad(
      pendingDate.getMonth() + 1
    )}-${pad(pendingDate.getDate())}T${pad(h)}:${pad(m)}`;
    onChange(iso);
    setOpen(false);
  };

  const onCancel = () => setOpen(false);

  // Year dropdown range: current year through current year + 3.
  const yearOptions = useMemo(() => {
    const y = today.getFullYear();
    return [y, y + 1, y + 2, y + 3];
  }, [today]);

  const weekdays = useMemo(
    () => weekdayShort(locale, weekStart),
    [locale, weekStart]
  );
  const cells = useMemo(
    () => calendarCells(viewYear, viewMonth, weekStart),
    [viewYear, viewMonth, weekStart]
  );

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  const displayValue = value ? formatTrigger(value, locale) : "";

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        className="glass-input w-full flex items-center gap-2.5 text-left cursor-pointer"
      >
        <Calendar
          className="h-4 w-4 text-white/65 shrink-0"
          aria-hidden="true"
        />
        <span className={displayValue ? "text-white" : "text-white/45"}>
          {displayValue || pickerDict.placeholder}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={ariaLabel ?? pickerDict.placeholder}
          className="absolute left-0 right-0 z-40 mt-2 rounded-xl border border-white/12 bg-ink-900 p-3 shadow-2xl sm:p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:gap-4">
            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  aria-label={pickerDict.previousMonth}
                  disabled={minMonth}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-1.5">
                  <label className="sr-only" htmlFor={`${id}-month`}>
                    {pickerDict.monthSelect}
                  </label>
                  <select
                    id={`${id}-month`}
                    aria-label={pickerDict.monthSelect}
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    className="glass-input !py-1 !px-2 text-xs cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const minM =
                        viewYear === today.getFullYear() ? today.getMonth() : 0;
                      return (
                        <option key={i} value={i} disabled={i < minM}>
                          {monthName(locale, i, viewYear)}
                        </option>
                      );
                    })}
                  </select>
                  <label className="sr-only" htmlFor={`${id}-year`}>
                    {pickerDict.yearSelect}
                  </label>
                  <select
                    id={`${id}-year`}
                    aria-label={pickerDict.yearSelect}
                    value={viewYear}
                    onChange={(e) => {
                      const y = Number(e.target.value);
                      setViewYear(y);
                      if (y === today.getFullYear() && viewMonth < today.getMonth()) {
                        setViewMonth(today.getMonth());
                      }
                    }}
                    className="glass-input !py-1 !px-2 text-xs cursor-pointer"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={goNextMonth}
                  aria-label={pickerDict.nextMonth}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-[10px] uppercase tracking-widest text-white/45">
                {weekdays.map((w) => (
                  <span key={w} className="h-6 flex items-center justify-center">
                    {w}
                  </span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map(({ date, otherMonth }, i) => {
                  const disabled = isDateDisabled(date);
                  const selected =
                    pendingDate !== null && isSameDay(pendingDate, date);
                  const todayCell = isSameDay(date, today);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onPickDate(date)}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={
                        "h-8 w-8 text-xs font-medium rounded-md transition-colors " +
                        (selected
                          ? "bg-white text-ink-900"
                          : disabled
                            ? "text-white/20 cursor-not-allowed"
                            : otherMonth
                              ? "text-white/35 hover:bg-white/5"
                              : "text-white/85 hover:bg-white/8") +
                        (!selected && todayCell ? " ring-1 ring-gold-400/60" : "")
                      }
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time list */}
            <div className="sm:w-[120px]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/55">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {pickerDict.timeHeading}
              </div>
              <div
                ref={timeListRef}
                className="mt-2 max-h-[14rem] sm:max-h-[14rem] overflow-y-auto pr-1 space-y-1"
              >
                {TIME_SLOTS.map((slot) => {
                  const active = pendingTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPendingTime(slot)}
                      data-active={active}
                      className={
                        "block w-full rounded-md px-2.5 py-1.5 text-center text-xs font-medium transition-colors " +
                        (active
                          ? "bg-white text-ink-900"
                          : "text-white/80 hover:bg-white/8")
                      }
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/8 pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost !py-1.5 !px-3 text-xs"
            >
              {pickerDict.cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="btn-gold !py-1.5 !px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pickerDict.confirm}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
