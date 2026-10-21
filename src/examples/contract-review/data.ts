import { story } from "../../system/ai/examples/finance-story";

/** Text in both languages, Arabic first. */
type Text = { ar: string; en: string };

const { earlyPayment } = story;
/** The supplier the contract goes to, and whose folder holds its files. */
export const supplier = earlyPayment.supplier;

/**
 * The figures that clauses and messages name, from the story, with how each
 * is formatted. A text holds {slots} that the screen fills with the frame's
 * formatters, so the digits follow the page language.
 */
export const figures = {
  amount: { kind: "money", value: earlyPayment.amount },
  discount: { kind: "percent", value: earlyPayment.discount },
  due: { kind: "date", value: earlyPayment.dueOn },
} as const;

/** The supplier's folder: the annex under review, and two files to read. */
export const files = [
  {
    id: "annex",
    name: { ar: "ملحق شروط الدفع", en: "Payment terms annex" },
    note: { ar: "قيد المراجعة", en: "In review" },
  },
  {
    id: "agreement",
    name: { ar: "اتفاقية التوريد", en: "Supply agreement" },
    note: { ar: "للقراءة فقط", en: "Read-only" },
  },
  {
    id: "messages",
    name: { ar: "المراسلات", en: "Messages" },
    note: { ar: "للقراءة فقط", en: "Read-only" },
  },
] as const satisfies readonly { id: string; name: Text; note: Text }[];
export type FileId = (typeof files)[number]["id"];

/**
 * The annex's clauses. The payment terms come last, so the review card that
 * floats under them covers no text.
 */
export const annex = {
  description: {
    ar: `ملحق باتفاقية التوريد مع ${supplier.ar}`,
    en: `An annex to the supply agreement with ${supplier.en}`,
  },
  clauses: [
    {
      id: "parties",
      title: { ar: "الأطراف", en: "Parties" },
      text: {
        ar: `يُبرم هذا الملحق بين الشركة و${supplier.ar} («المورّد»).`,
        en: `This annex is made between the Company and ${supplier.en} (the “Supplier”).`,
      },
    },
    {
      id: "purpose",
      title: { ar: "الغرض", en: "Purpose" },
      text: {
        ar: "يحدّد هذا الملحق كيف تسدّد الشركة قيمة الطلبات التي يوردها المورّد.",
        en: "This annex sets how the Company pays for the orders the Supplier delivers.",
      },
    },
    {
      id: "payment",
      title: { ar: "شروط الدفع", en: "Payment terms" },
    },
  ],
} as const;

/**
 * The payment-terms clause as the assistant rewrote it: runs that stay, and
 * three changes, each deleting what the clause says now and inserting what it
 * would say from the early payment. `row` is the same term in the approval's
 * impact table: what it holds once the change is accepted (`set`) and while it
 * is not (`kept`).
 */
export const clause = [
  { id: "s1", text: { ar: "تسدّد الشركة ", en: "The Company pays " } },
  {
    id: "c1",
    from: { ar: "قيمة الفاتورة", en: "the invoice amount" },
    to: { ar: "{amount}", en: "{amount}" },
    row: {
      id: "amount",
      label: { ar: "المبلغ", en: "Amount" },
      kept: { ar: "قيمة الفاتورة", en: "The invoice amount" },
      set: { ar: "{amount}", en: "{amount}" },
    },
  },
  { id: "s2", text: { ar: " ", en: " " } },
  {
    id: "c2",
    from: {
      ar: "خلال ستين يومًا من تاريخ إصدارها",
      en: "within sixty days of the invoice date",
    },
    to: { ar: "قبل {due}", en: "before {due}" },
    row: {
      id: "due",
      label: { ar: "الاستحقاق", en: "Due" },
      kept: {
        ar: "خلال ستين يومًا من الإصدار",
        en: "Within sixty days of the invoice date",
      },
      set: { ar: "قبل {due}", en: "Before {due}" },
    },
  },
  { id: "s3", text: { ar: "، ", en: ", " } },
  {
    id: "c3",
    from: { ar: "دون أي خصم", en: "with no discount" },
    to: {
      ar: "مع خصم قدره {discount} عند السداد المبكر",
      en: "with a {discount} discount for early payment",
    },
    row: {
      id: "discount",
      label: { ar: "الخصم", en: "Discount" },
      kept: { ar: "بلا خصم", en: "None" },
      set: {
        ar: "{discount} عند السداد المبكر",
        en: "{discount} for early payment",
      },
    },
  },
  { id: "s4", text: { ar: ".", en: "." } },
] as const;

/** The supply agreement, to read. */
export const agreement = {
  description: {
    ar: `بين الشركة و${supplier.ar}`,
    en: `Between the Company and ${supplier.en}`,
  },
  clauses: [
    {
      id: "supply",
      title: { ar: "التوريد", en: "Supply" },
      text: {
        ar: `تورّد ${supplier.ar} مواد التغليف إلى الشركة بموجب أوامر الشراء المعتمدة.`,
        en: `${supplier.en} supplies packaging materials to the Company under approved purchase orders.`,
      },
    },
    {
      id: "term",
      title: { ar: "المدة", en: "Term" },
      text: {
        ar: "تسري هذه الاتفاقية سنة واحدة وتتجدد باتفاق الطرفين.",
        en: "This agreement runs for one year and renews by agreement of both parties.",
      },
    },
    {
      id: "payment",
      title: { ar: "الدفع", en: "Payment" },
      text: {
        ar: "تحكم شروط الدفع ملحقٌ مستقل.",
        en: "Payment terms are set in a separate annex.",
      },
    },
  ],
} as const;

/** The conversation with the supplier about the early payment, to read. */
export const messages = {
  description: { ar: `مع ${supplier.ar}`, en: `With ${supplier.en}` },
  thread: [
    {
      id: "paid",
      from: story.team,
      on: earlyPayment.paidOn,
      text: {
        ar: "حوّلنا {amount} قبل موعد استحقاقها في {due}.",
        en: "We transferred {amount} ahead of its {due} due date.",
      },
    },
    {
      id: "received",
      from: supplier,
      on: "2026-10-12",
      text: {
        ar: "وصلتنا الدفعة. نرجو توثيق خصم السداد المبكر البالغ {discount} في ملحق شروط الدفع.",
        en: "We received the payment. Please record the {discount} early-payment discount in the payment terms annex.",
      },
    },
    {
      id: "annex",
      from: story.team,
      on: "2026-10-14",
      text: {
        ar: "سنعدّل الملحق ونرسله إليكم بعد المراجعة.",
        en: "We'll update the annex and send it to you after review.",
      },
    },
  ],
} as const;
