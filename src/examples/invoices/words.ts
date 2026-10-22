import type { Screen } from "../frame/screen";

// Counts with the words that agree with them (spec §1): Arabic has six plural
// categories, and the noun follows the number only from 3. The forms here are
// the ones after a preposition or a verb, «من ١٦ فاتورة» and «قبل يومين».
const arabicPlural = new Intl.PluralRules("ar");
type Words = Pick<Screen, "language" | "number">;

/** «فاتورة واحدة» · «فاتورتين» · «٥ فواتير» · «١٦ فاتورة» / "16 invoices". */
export function invoiceCount({ language, number }: Words, count: number) {
  if (language === "en")
    return `${number(count)} ${count === 1 ? "invoice" : "invoices"}`;
  switch (arabicPlural.select(count)) {
    case "zero":
      return "لا فواتير";
    case "one":
      return "فاتورة واحدة";
    case "two":
      return "فاتورتين";
    case "few":
      return `${number(count)} فواتير`;
    default:
      return `${number(count)} فاتورة`;
  }
}

/** «يوم واحد» · «يومين» · «٦ أيام» · «١٢ يومًا» / "12 days". */
export function dayCount({ language, number }: Words, count: number) {
  if (language === "en")
    return `${number(count)} ${count === 1 ? "day" : "days"}`;
  switch (arabicPlural.select(count)) {
    case "zero":
      return "لا أيام";
    case "one":
      return "يوم واحد";
    case "two":
      return "يومين";
    case "few":
      return `${number(count)} أيام`;
    default:
      return `${number(count)} يومًا`;
  }
}

/**
 * The count of late invoices as a phrase of its own, where the adjective agrees:
 * «فاتورة واحدة متأخرة» · «فاتورتان متأخرتان» · «٥ فواتير متأخرة» ·
 * «١٢ فاتورة متأخرة» / "12 late invoices".
 */
export function lateInvoices({ language, number }: Words, count: number) {
  if (language === "en")
    return `${number(count)} late ${count === 1 ? "invoice" : "invoices"}`;
  switch (arabicPlural.select(count)) {
    case "zero":
      return "لا فواتير متأخرة";
    case "one":
      return "فاتورة واحدة متأخرة";
    case "two":
      return "فاتورتان متأخرتان";
    case "few":
      return `${number(count)} فواتير متأخرة`;
    default:
      return `${number(count)} فاتورة متأخرة`;
  }
}
