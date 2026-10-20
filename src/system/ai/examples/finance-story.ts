import { numberLocale } from "../../index";
import type { Numerals } from "../../index";

/**
 * The one story every AI pattern demo tells (spec section 14): the finance
 * team closing October 2026. Text is Arabic and English; amounts, counts,
 * percentages and dates are values, so each example formats them with its own
 * numerals. The amounts agree everywhere.
 */
export const story = {
  team: { ar: "فريق المالية", en: "Finance team" },
  user: { ar: "ليلى", en: "Laila" },
  period: {
    month: { ar: "أكتوبر", en: "October" },
    year: 2026,
    week: { from: "2026-10-12", to: "2026-10-18" },
  },
  cash: {
    /** Riyals available. */
    available: 612_000,
    /** Net cash flow against September, in percent: down 18%. */
    netFlowChange: -18,
  },
  revenue: { amount: 1_240_000, change: 6.1 },
  /** Days sales outstanding, from September to October. */
  dso: { from: 34, to: 47 },
  overdue: {
    invoices: 12,
    amount: 48_300,
    /** The three large customers together, and their share of the total. */
    largest: { amount: 34_800, share: 72 },
  },
  customers: [
    {
      id: "madar",
      name: { ar: "شركة مدار", en: "Madar Company" },
      amount: 15_600,
      invoices: [
        { id: "INV-1043", amount: 9_400 },
        { id: "INV-1046", amount: 6_200 },
      ],
    },
    {
      id: "al-nada",
      name: { ar: "مؤسسة الندى", en: "Al Nada Establishment" },
      amount: 11_200,
      invoices: [{ id: "INV-1039", amount: 11_200 }],
    },
    {
      id: "al-rowad",
      name: { ar: "الرواد للتجارة", en: "Al Rowad Trading" },
      amount: 8_000,
      invoices: [{ id: "INV-1041", amount: 8_000 }],
    },
  ],
  earlyPayment: {
    supplier: { ar: "النخبة للتغليف", en: "Al Nukhba Packaging" },
    amount: 125_000,
    paidOn: "2026-10-09",
    dueOn: "2026-10-30",
    /** The early-payment discount, in percent. */
    discount: 2,
  },
  forecast: {
    cash: 740_000,
    by: "2026-11-15",
    condition: {
      ar: "إذا سدّد العملاء الثلاثة",
      en: "if the three customers pay",
    },
  },
  closeSteps: [
    {
      id: "supplier-invoices",
      title: { ar: "مطابقة فواتير الموردين", en: "Match supplier invoices" },
      invoices: 217,
      differences: 3,
    },
    {
      id: "bank-reconciliation",
      title: {
        ar: "تسوية حسابات البنك الأهلي",
        en: "Reconcile the Al Ahli bank accounts",
      },
      accounts: 3,
      transactions: 94,
    },
    {
      id: "accruals",
      title: { ar: "تسجيل قيود الاستحقاق", en: "Record the accrual entries" },
      entries: 4,
      amount: 6_850,
    },
    {
      id: "payment-reminders",
      title: {
        ar: "إرسال تذكيرات الدفع للعملاء الثلاثة",
        en: "Send payment reminders to the three customers",
      },
      customers: 3,
    },
    {
      id: "close-summary",
      title: {
        ar: "ملخص الإقفال للمدير المالي",
        en: "Close summary for the CFO",
      },
      pages: 1,
      format: "PDF",
    },
  ],
  agents: {
    finance: { ar: "وكيل المالية", en: "Finance agent" },
    collections: { ar: "وكيل التحصيل", en: "Collections agent" },
    campaigns: { ar: "مصمّم الحملات", en: "Campaign designer" },
  },
  /** Shaped like SourceReference, with the title in both languages. */
  sources: [
    {
      id: "ledger",
      number: 1,
      title: { ar: "دفتر الحسابات · أكتوبر", en: "General ledger · October" },
    },
    {
      id: "customer-invoices",
      number: 2,
      title: { ar: "فواتير العملاء", en: "Customer invoices" },
    },
    {
      id: "al-ahli-statement",
      number: 3,
      title: { ar: "كشف البنك الأهلي", en: "Al Ahli bank statement" },
    },
    {
      id: "aging-report",
      number: 4,
      title: { ar: "تقرير أعمار الديون", en: "Receivables aging report" },
    },
    {
      id: "cash-forecast",
      number: 5,
      title: { ar: "توقعات التدفق النقدي", en: "Cash flow forecast" },
    },
  ],
  /** The reminder the collections agent drafts for Madar. */
  draft: {
    recipient: { ar: "سارة العتيبي", en: "Sara Al-Otaibi" },
    customer: "madar",
    invoice: "INV-1043",
    amount: 9_400,
    due: "2026-10-06",
    daysLate: 12,
  },
} as const;

/**
 * An amount in Saudi riyals: «٩٬٤٠٠ ر.س» / "SAR 9,400", or compact
 * «٦١٢ ألف ر.س» / "SAR 612K". Digits follow `numerals` through numberLocale.
 */
export function money(
  value: number,
  language: "ar" | "en",
  numerals?: Numerals,
  options?: { compact?: boolean },
): string {
  const amount = new Intl.NumberFormat(
    numberLocale({ numerals }, language),
    options?.compact
      ? { notation: "compact", maximumSignificantDigits: 3 }
      : undefined,
  ).format(value);
  return language === "ar" ? `${amount} ر.س` : `SAR ${amount}`;
}
