import { numberLocale } from "./config";
import type { Direction, Numerals } from "./config";

/** The shape numberLocale takes; patterns pass useSystem().config. */
type FormatConfig = { direction?: Direction; numerals?: Numerals };

export type CountNoun =
  | "record"
  | "source"
  | "image"
  | "edit"
  | "message"
  | "invoice"
  | "step"
  | "operation"
  | "hour"
  | "day"
  | "customer";

// Each noun's gender, then its forms for one and two (which stand alone), and
// for few (3–10), many (11–99) and other (100 and up), which follow the number.
// Zero is «لا» with the few form, the plural (spec section 15).
const arabicForms: Record<
  CountNoun,
  readonly ["m" | "f", string, string, string, string, string]
> = {
  record: ["m", "سجل واحد", "سجلّان", "سجلات", "سجلًا", "سجل"],
  source: ["m", "مصدر واحد", "مصدران", "مصادر", "مصدرًا", "مصدر"],
  image: ["f", "صورة واحدة", "صورتان", "صور", "صورة", "صورة"],
  edit: ["m", "تعديل واحد", "تعديلان", "تعديلات", "تعديلًا", "تعديل"],
  message: ["f", "رسالة واحدة", "رسالتان", "رسائل", "رسالة", "رسالة"],
  invoice: ["f", "فاتورة واحدة", "فاتورتان", "فواتير", "فاتورة", "فاتورة"],
  step: ["f", "خطوة واحدة", "خطوتان", "خطوات", "خطوة", "خطوة"],
  operation: ["f", "عملية واحدة", "عمليتان", "عمليات", "عملية", "عملية"],
  hour: ["f", "ساعة واحدة", "ساعتان", "ساعات", "ساعة", "ساعة"],
  day: ["m", "يوم واحد", "يومان", "أيام", "يومًا", "يوم"],
  customer: ["m", "عميل واحد", "عميلان", "عملاء", "عميلًا", "عميل"],
};
const arabicPlural = new Intl.PluralRules("ar");
const englishPlural = new Intl.PluralRules("en");

/** A count with its noun: Arabic agrees across all six plural categories,
 * English adds "s"; digits follow numberLocale. */
export function formatCount(
  count: number,
  noun: CountNoun,
  config: FormatConfig,
): string {
  const number = new Intl.NumberFormat(numberLocale(config)).format(count);
  if (config.direction !== "rtl")
    return `${number} ${englishPlural.select(count) === "one" ? noun : `${noun}s`}`;
  const [, one, two, few, many, other] = arabicForms[noun];
  switch (arabicPlural.select(count)) {
    case "zero":
      return `لا ${few}`;
    case "one":
      return one;
    case "two":
      return two;
    case "few":
      return `${number} ${few}`;
    case "many":
      return `${number} ${many}`;
    default:
      return `${number} ${other}`;
  }
}

/** The noun's grammatical gender, for words that agree with a count
 * (اكتملت ٣ رسائل, اكتمل طلبان). */
export function nounGender(noun: CountNoun): "m" | "f" {
  return arabicForms[noun][0];
}

/**
 * Elapsed or remaining time: ٦ث / 6s under a minute (one fraction digit on
 * request), ١د ١٢ث / 1m 12s under an hour, then ١س ٢د / 1h 2m. A zero last
 * part is dropped (٢د). Time is truncated, never rounded up, so 59.9 seconds
 * never reads as a minute. Negative values clamp to zero; a non-finite value
 * gives an empty string.
 */
export function formatElapsed(
  seconds: number,
  config: FormatConfig,
  options?: { fractionDigits?: 0 | 1 },
): string {
  if (!Number.isFinite(seconds)) return "";
  const ar = config.direction === "rtl",
    locale = numberLocale(config),
    value = Math.max(0, seconds);
  const [s, m, h] = ar ? ["ث", "د", "س"] : ["s", "m", "h"];
  if (value < 60) {
    const digits = options?.fractionDigits ?? 0,
      scale = 10 ** digits;
    return (
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping: false,
      }).format(Math.floor(value * scale + 1e-9) / scale) + s
    );
  }
  const whole = new Intl.NumberFormat(locale, { useGrouping: false }),
    total = Math.floor(value),
    hours = Math.floor(total / 3600),
    minutes = Math.floor((total % 3600) / 60),
    rest = total % 60;
  const parts: [number, string][] =
    hours > 0
      ? [
          [hours, h],
          [minutes, m],
        ]
      : [
          [minutes, m],
          [rest, s],
        ];
  return parts
    .filter(([amount], index) => index === 0 || amount > 0)
    .map(([amount, unit]) => whole.format(amount) + unit)
    .join(" ");
}
