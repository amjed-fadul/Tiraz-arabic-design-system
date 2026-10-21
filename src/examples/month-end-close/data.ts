import { story } from "../../system/ai/examples/finance-story";

// Values only: text in both languages, Arabic first, with numbers and ISO
// dates. The story gives the close's steps, agents, figures and customers; this
// file adds only what it lacks. The screen formats every number and amount
// with the frame's helpers, so the digits follow the page language.

/** Text in both languages, Arabic first. */
export interface Text {
  ar: string;
  en: string;
}

/** The run's name, as the screen's heading. */
export const heading: Text = {
  ar: "إقفال حسابات أكتوبر",
  en: "Close the October books",
};
/** The task card's own title, so the page doesn't say its heading twice. */
export const taskTitle: Text = { ar: "مهمة الإقفال", en: "The close task" };

/** How a finished step ran: its seconds, and the operations it lists. */
export interface Run {
  seconds: number;
  tools: readonly { tool: string; seconds: number; label: Text }[];
}
/**
 * How each step that can finish here ran, by the story's step id. A step shows
 * its operations once it is completed.
 */
export const runs: Record<string, Run> = {
  "supplier-invoices": {
    seconds: 64,
    tools: [
      {
        tool: "ledger.read",
        seconds: 1.2,
        label: { ar: "قراءة دفتر الموردين", en: "Read the supplier ledger" },
      },
      {
        tool: "po.match",
        seconds: 2.9,
        label: {
          ar: "مطابقة الفواتير بأوامر الشراء",
          en: "Match invoices to purchase orders",
        },
      },
    ],
  },
  "bank-reconciliation": {
    seconds: 48,
    tools: [
      {
        tool: "bank.statement",
        seconds: 1.1,
        label: { ar: "جلب كشف أكتوبر", en: "Fetch the October statement" },
      },
      {
        tool: "recon.match",
        seconds: 1.7,
        label: {
          ar: "مطابقة الحركات بالكشف",
          en: "Match the transactions to the statement",
        },
      },
    ],
  },
  accruals: {
    seconds: 22,
    tools: [
      {
        tool: "accruals.draft",
        seconds: 0.9,
        label: { ar: "إعداد القيود الأربعة", en: "Draft the four entries" },
      },
      {
        tool: "ledger.post",
        seconds: 0.6,
        label: {
          ar: "ترحيل القيود إلى دفتر أكتوبر",
          en: "Post them to the October ledger",
        },
      },
    ],
  },
};

/** Step 3's approval. The entries post to the ledger, and an offsetting entry can reverse them. */
export const accruals = {
  id: "accruals-oct",
  action: {
    ar: "ترحيل قيود الاستحقاق الأربعة",
    en: "Post the four accrual entries",
  },
  consequence: {
    ar: "تُرحَّل القيود إلى دفتر أكتوبر، ويمكن عكسها بقيد مقابل.",
    en: "The entries post to the October ledger and can be reversed with an offsetting entry.",
  },
  approve: { ar: "ترحيل القيود", en: "Post the entries" },
  reject: { ar: "رفض", en: "Reject" },
} as const;

/** The finance agent's question, which the inbox opens with. */
export const jeddah = {
  id: "jeddah",
  label: {
    ar: "هل أستثني فرع جدة؟",
    en: "Should I leave out the Jeddah branch?",
  },
  choices: [
    {
      value: "exclude",
      label: { ar: "نعم، استثنِه", en: "Yes, leave it out" },
    },
    { value: "include", label: { ar: "لا، أدرجه", en: "No, include it" } },
  ],
  /** Minutes since the agent asked. */
  minutes: 12,
  /** What the row says once the answers were recorded. */
  receipt: {
    ar: "أُرسلت إجاباتك · الآن",
    en: "Your answers were sent · just now",
  },
} as const;

/**
 * The three payment reminders the Collections agent drafts once step 3 is
 * decided: one per customer, each about that customer's first invoice. The
 * first is the story's own draft, to Madar.
 */
export const reminders = story.customers.map((customer) => ({
  id: `reminder-${customer.id}`,
  customer: customer.name,
  invoice: customer.invoices[0].id,
  amount: customer.invoices[0].amount,
}));
export const reminderTitle: Text = {
  ar: "تذكير بالدفع إلى",
  en: "Payment reminder to",
};

/**
 * What changed since September, as the points each sparkline draws, oldest
 * first. Their ends are the story's: down 18%, 34 to 47 days, 12 invoices.
 */
export const trends = {
  cash: [100, 97, 95, 90, 82],
  dso: [34, 35, 38, 43, 47],
  overdue: [4, 5, 7, 9, 12],
} as const;

/** The close's agent, and who started the run. */
export const finance = story.agents.finance;
export const collections = story.agents.collections;
export const laila = story.user;
