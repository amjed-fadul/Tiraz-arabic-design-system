import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "@daypicker/react";
import * as YearSelect from "@radix-ui/react-select";
import type { DropdownProps } from "@daypicker/react";
import { ar, enUS } from "@daypicker/react/locale";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, ComponentPropsWithRef } from "react";
import { Field } from "./Field";
import type { FieldControlProps } from "./Field";
import { associateControl, mergeDescriptionIds } from "./control-associations";
import { useEntryReset } from "./useEntryReset";
import { useSystem } from "./useSystem";
import { numberLocale } from "./config";
import { parseDateOnly, formatDateOnly } from "./date-only";
export type DatePickerProps = Omit<
  ComponentPropsWithRef<"button">,
  "value" | "defaultValue" | "type" | "children" | "onChange"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  min?: string;
  max?: string;
  locale?: "ar" | "en";
  /** Direct year choices only; min/max alone constrain selectable dates. */
  yearRange?: readonly [number, number];
  placeholder?: string;
  invalid?: boolean;
} & (
    | { label: string; helper?: string; error?: string; field?: never }
    | {
        label?: never;
        helper?: never;
        error?: never;
        field?: FieldControlProps;
      }
  );
const YearChoices = createContext<{
  range?: readonly [number, number];
  container: HTMLElement | null;
}>({ container: null });
function NavigationYears(props: DropdownProps) {
  const { range, container } = useContext(YearChoices);
  const { config } = useSystem();
  const year = Number(props.value);
  const valid =
    range &&
    Number.isFinite(range[0]) &&
    Number.isFinite(range[1]) &&
    range[0] <= range[1] &&
    range[0] <= 9999 &&
    range[1] >= 1;
  const first = valid ? Math.max(1, Math.trunc(range[0])) : year - 100;
  const last = valid ? Math.min(9999, Math.trunc(range[1])) : year + 100;
  const options = props.options?.filter(
    (option) =>
      (option.value >= first && option.value <= last) || option.value === year,
  );
  return (
    <YearSelect.Root
      value={String(props.value)}
      disabled={props.disabled}
      dir={config.direction}
      onValueChange={(value) => {
        // DayPicker's documented adapter consumes target.value to navigate.
        props.onChange?.({
          target: { value },
        } as ChangeEvent<HTMLSelectElement>);
      }}
    >
      <YearSelect.Trigger
        aria-label={props["aria-label"]}
        aria-describedby={props["aria-describedby"]}
        tabIndex={props.tabIndex}
        style={props.style}
        value={String(props.value)}
        className={`rdp-dropdown ${props.className ?? ""} tz-date-year-trigger`}
      >
        <YearSelect.Value />
        <YearSelect.Icon asChild>
          <ChevronDown size={12} aria-hidden="true" />
        </YearSelect.Icon>
      </YearSelect.Trigger>
      <YearSelect.Portal container={container}>
        <YearSelect.Content
          className="tz-select-popup tz-date-years-popup"
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          dir={config.direction}
        >
          <YearSelect.Viewport className="tz-select-viewport tz-date-years-viewport">
            {options?.map((option) => (
              <YearSelect.Item
                key={option.value}
                value={String(option.value)}
                disabled={option.disabled}
                textValue={option.label}
                className="tz-select-option"
              >
                <YearSelect.ItemText>{option.label}</YearSelect.ItemText>
                <YearSelect.ItemIndicator>
                  <Check size={12} aria-hidden="true" />
                </YearSelect.ItemIndicator>
              </YearSelect.Item>
            ))}
          </YearSelect.Viewport>
        </YearSelect.Content>
      </YearSelect.Portal>
    </YearSelect.Root>
  );
}
const calendarComponents = { YearsDropdown: NavigationYears };
// DayPicker builds year choices across navigation bounds before the dropdown
// filters its window. Reuse number formatters instead of formatting 9999 dates.
const calendarFormatters = new Map<
  string,
  { formatYearDropdown: (date: Date) => string }
>();
function yearFormatters(locale: string) {
  let formatters = calendarFormatters.get(locale);
  if (!formatters) {
    const format = new Intl.NumberFormat(locale, {
      useGrouping: false,
      minimumIntegerDigits: 4,
    });
    formatters = {
      formatYearDropdown: (date: Date) => format.format(date.getFullYear()),
    };
    calendarFormatters.set(locale, formatters);
  }
  return formatters;
}

/** Single Gregorian date; empty string clears. The app owns form validation. */
export function DatePicker({
  value,
  defaultValue = "",
  onValueChange,
  min,
  max,
  locale,
  yearRange,
  placeholder,
  label,
  helper,
  error,
  field,
  invalid,
  disabled,
  name,
  form,
  className = "",
  ...props
}: DatePickerProps) {
  const { config, container } = useSystem();
  const language = locale ?? (config.direction === "rtl" ? "ar" : "en");
  const arabic = language === "ar";
  const numbers = numberLocale(config, language);
  const dates = arabic ? numbers : "en-US";
  const initial = useRef(defaultValue);
  const [local, setLocal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  if (disabled && open) setOpen(false);
  const [popup, setPopup] = useState<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!popup) return;
    // Autofocus can run before Popper applies the viewport height constraint.
    // Reconcile the inner scroll position after that constraint changes size.
    const keepFocusVisible = () => {
      const active = popup.ownerDocument.activeElement;
      if (!(active instanceof HTMLElement) || !popup.contains(active)) return;
      // Nested year options have their own viewport and positioning. Scrolling
      // the calendar for them would move their anchor out of view.
      if (active.closest(".tz-date-years-popup")) return;
      const viewport = popup.getBoundingClientRect();
      const focused = active.getBoundingClientRect();
      const scale = viewport.height ? popup.offsetHeight / viewport.height : 1;
      if (focused.bottom > viewport.bottom)
        popup.scrollBy({
          top: (focused.bottom - viewport.bottom + 4) * scale,
          behavior: "instant",
        });
      else if (focused.top < viewport.top)
        popup.scrollBy({
          top: -(viewport.top - focused.top + 4) * scale,
          behavior: "instant",
        });
    };
    const observer = new ResizeObserver(keepFocusVisible);
    observer.observe(popup);
    popup.addEventListener("focusin", keepFocusVisible);
    keepFocusVisible();
    return () => {
      observer.disconnect();
      popup.removeEventListener("focusin", keepFocusVisible);
    };
  }, [popup]);
  const raw = value ?? local;
  const selected = parseDateOnly(raw);
  const current = selected ? raw : "";
  const minimum = min ? parseDateOnly(min) : undefined,
    maximum = max ? parseDateOnly(max) : undefined;
  const [month, setMonth] = useState(() => selected ?? minimum ?? new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const statusId = useId();
  const outOfBounds =
    !!selected && ((!!minimum && raw < min!) || (!!maximum && raw > max!));
  const feedback =
    raw && !selected
      ? arabic
        ? "تاريخ غير صالح. استخدم YYYY-MM-DD."
        : "Invalid date. Use YYYY-MM-DD."
      : outOfBounds
        ? arabic
          ? "التاريخ خارج النطاق المتاح."
          : "Date is outside the available range."
        : "";
  useEntryReset(inputRef, () => {
    if (value === undefined) setLocal(initial.current);
    setOpen(false);
  });
  function commit(next: string) {
    if (disabled) return;
    if (value === undefined) setLocal(next);
    if (next !== raw) onValueChange?.(next);
    setOpen(false);
  }
  const [today, setToday] = useState(() => new Date());
  const todayValue = formatDateOnly(today);
  const todayDisabled =
    (!!minimum && todayValue < min!) || (!!maximum && todayValue > max!);
  const display = selected?.toLocaleDateString(dates, {
    calendar: "gregory",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const control = (association = field) => (
    <>
      <Popover.Root
        open={open && !disabled}
        onOpenChange={(next) => {
          if (next) {
            const now = new Date();
            setToday(now);
            setMonth(selected ?? minimum ?? now);
          }
          setOpen(next);
        }}
      >
        <Popover.Trigger asChild>
          <button
            {...props}
            {...associateControl(association, props, invalid || !!feedback)}
            aria-labelledby={mergeDescriptionIds(
              associateControl(association, props)["aria-labelledby"],
              props["aria-label"] ? `${statusId}-name` : undefined,
              associateControl(association, props)["aria-labelledby"] ||
                props["aria-label"]
                ? `${statusId}-value`
                : undefined,
            )}
            type="button"
            disabled={disabled}
            className={`tz-input tz-date-trigger ${className}`}
            aria-describedby={mergeDescriptionIds(
              associateControl(association, props)["aria-describedby"],
              feedback ? statusId : undefined,
              display &&
                !associateControl(association, props)["aria-labelledby"] &&
                !props["aria-label"]
                ? `${statusId}-value`
                : undefined,
            )}
          >
            {props["aria-label"] && (
              <span id={`${statusId}-name`} className="tz-visually-hidden">
                {props["aria-label"]}
              </span>
            )}
            <span id={`${statusId}-value`}>
              {display ??
                placeholder ??
                (arabic ? "اختر تاريخًا" : "Choose a date")}
            </span>
            <CalendarDays size={16} aria-hidden="true" />
          </button>
        </Popover.Trigger>
        <Popover.Portal container={container}>
          <Popover.Content
            ref={setPopup}
            className="tz-datepicker-popup"
            dir={config.direction}
            sideOffset={6}
            align="start"
            collisionPadding={8}
            hideWhenDetached
            aria-label={label ?? (arabic ? "اختيار التاريخ" : "Choose date")}
          >
            <YearChoices.Provider
              value={{ range: yearRange, container: popup }}
            >
              <DayPicker
                captionLayout="dropdown"
                navLayout="around"
                components={calendarComponents}
                formatters={yearFormatters(numbers)}
                mode="single"
                autoFocus
                selected={selected}
                month={month}
                onMonthChange={setMonth}
                onSelect={(date) => commit(date ? formatDateOnly(date) : "")}
                locale={arabic ? ar : enUS}
                dir={config.direction}
                numerals={arabic ? (config.numerals ?? "arab") : "latn"}
                labels={{
                  // The bundled Arabic locale reads «اذهب إلى الشهر السابق».
                  ...(arabic
                    ? {
                        labelPrevious: () => "الشهر السابق",
                        labelNext: () => "الشهر التالي",
                      }
                    : {}),
                  labelDayButton: (date, modifiers) => {
                    // Numeric days keep visible cell text in the accessible name;
                    // the default English ordinal labels (1st/2nd) obscure it.
                    const text = date.toLocaleDateString(dates, {
                      calendar: "gregory",
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                    return `${modifiers.today ? (arabic ? "اليوم، " : "Today, ") : ""}${text}${modifiers.selected ? (arabic ? "، محدد" : ", selected") : ""}`;
                  },
                }}
                disabled={[
                  ...(minimum ? [{ before: minimum }] : []),
                  ...(maximum ? [{ after: maximum }] : []),
                ]}
                startMonth={minimum ?? parseDateOnly("0001-01-01")}
                endMonth={maximum ?? parseDateOnly("9999-12-31")}
              />
            </YearChoices.Provider>
            <div className="tz-date-actions">
              <button
                type="button"
                className="tz-button"
                data-variant="ghost"
                disabled={todayDisabled}
                onClick={() => commit(todayValue)}
              >
                {arabic ? "اليوم" : "Today"}
              </button>
              <button
                type="button"
                className="tz-button"
                data-variant="ghost"
                disabled={!raw}
                onClick={() => commit("")}
              >
                {arabic ? "مسح" : "Clear"}
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <input
        ref={inputRef}
        type="hidden"
        name={name}
        form={form}
        value={current}
        disabled={disabled}
      />
      {feedback && (
        <span id={statusId} className="tz-entry-feedback" data-error="true">
          {feedback}
        </span>
      )}
    </>
  );
  return label !== undefined ? (
    <Field label={label} helper={helper} error={error} id={props.id}>
      {control}
    </Field>
  ) : (
    control()
  );
}
