import { story } from "../../system/ai/examples/finance-story";

/** Text in both languages, Arabic first. */
type Text = { ar: string; en: string };

/** The help library: what an answer cites. `updated` is an ISO date. */
export const articles = {
  "bank-reconciliation": {
    title: { ar: "مطابقة الحسابات البنكية", en: "Reconciling bank accounts" },
    quote: {
      ar: "ارفع الكشف، وراجع المطابقات التلقائية، ثم عالج ما بقي.",
      en: "Upload the statement, review the automatic matches, then handle what is left.",
    },
    updated: "2026-10-02",
  },
  "statement-upload": {
    title: { ar: "رفع كشف الحساب", en: "Uploading a statement" },
    quote: {
      ar: "ارفع كشف كل حساب على حدة، ويقرأ المساعد حركاته.",
      en: "Upload each account's statement on its own, and the assistant reads its transactions.",
    },
    updated: "2026-09-24",
  },
  "unmatched-transactions": {
    title: { ar: "الحركات غير المطابقة", en: "Unmatched transactions" },
    quote: {
      ar: "سجّل الفرق أو علّم الحركة للمتابعة قبل إغلاق التسوية.",
      en: "Record the difference or flag the transaction before you close the reconciliation.",
    },
    updated: "2026-10-05",
  },
  "close-checklist": {
    title: { ar: "قائمة إقفال الشهر", en: "The month-end checklist" },
    quote: {
      ar: "ترتيب خطوات الإقفال، ومن يعتمد كل واحدة منها.",
      en: "The order of the close steps, and who signs off each.",
    },
    updated: "2026-10-01",
  },
  "days-sales-outstanding": {
    title: { ar: "أيام التحصيل", en: "Days sales outstanding" },
    quote: {
      ar: "المبالغ المستحقة على العملاء مقسومة على المبيعات اليومية.",
      en: "What customers owe, divided by daily sales.",
    },
    updated: "2026-08-30",
  },
  "aging-report": {
    title: { ar: "تقرير أعمار الديون", en: "The receivables aging report" },
    quote: {
      ar: "يوزّع الفواتير المتأخرة حسب مدة التأخر.",
      en: "Groups late invoices by how long they have been late.",
    },
    updated: "2026-10-12",
  },
  "payment-reminders": {
    title: { ar: "تذكيرات الدفع", en: "Payment reminders" },
    quote: {
      ar: "يكتب المساعد تذكيرًا لكل فاتورة متأخرة، وتراجعه قبل إرساله.",
      en: "The assistant drafts a reminder for each late invoice, and you review it before it goes.",
    },
    updated: "2026-10-08",
  },
  journal: {
    title: { ar: "دفتر اليومية", en: "The journal" },
    quote: {
      ar: "حيث تُنشأ القيود وتُراجع وتُرحَّل.",
      en: "Where entries are created, reviewed and posted.",
    },
    updated: "2026-09-18",
  },
  "accrual-entries": {
    title: { ar: "قيود الاستحقاق", en: "Accrual entries" },
    quote: {
      ar: "قيد يسجّل المصروف أو الإيراد قبل دفعه فعليًا.",
      en: "An entry that records an expense or revenue before it is paid.",
    },
    updated: "2026-09-18",
  },
  "posting-entries": {
    title: { ar: "ترحيل القيود", en: "Posting entries" },
    quote: {
      ar: "راجع القيد ثم رحّله لينتقل إلى دفتر الحسابات.",
      en: "Review the entry, then post it so it moves to the general ledger.",
    },
    updated: "2026-09-18",
  },
} as const satisfies Record<
  string,
  { title: Text; quote: Text; updated: string }
>;
export type ArticleId = keyof typeof articles;

/**
 * The figures an answer names, from the story, as [how to format it, value].
 * An answer's text holds {slots} that the screen fills with the frame's
 * formatters, so the digits follow the page language.
 */
export const figures = {
  accounts: ["number", story.closeSteps[1].accounts],
  transactions: ["number", story.closeSteps[1].transactions],
  from: ["number", story.dso.from],
  to: ["number", story.dso.to],
  invoices: ["number", story.overdue.invoices],
  overdue: ["money", story.overdue.amount],
  largest: ["money", story.overdue.largest.amount],
  share: ["percent", story.overdue.largest.share],
  entries: ["number", story.closeSteps[2].entries],
  accrued: ["money", story.closeSteps[2].amount],
} as const;

/**
 * The questions the library answers. A search covers `articles`; the answer
 * cites the first three, numbered in that order, and the rest were read but
 * not used. `followUps` are the other questions it can answer.
 */
export const topics = [
  {
    id: "bank",
    question: {
      ar: "كيف أطابق كشف البنك الأهلي؟",
      en: "How do I reconcile the Al Ahli bank statement?",
    },
    articles: [
      "bank-reconciliation",
      "statement-upload",
      "unmatched-transactions",
      "close-checklist",
    ],
    answer: {
      ar: `طابق حركات كشف البنك الأهلي مع دفتر الحسابات على ثلاث خطوات [1]:

1. ارفع كشف كل حساب كما نزّلته من البنك. في أكتوبر {accounts} حسابات و{transactions} حركة [2].
2. راجع الحركات التي طابقها المساعد تلقائيًا، فكل واحدة منها تطابقت في المبلغ والتاريخ.
3. عالج ما بقي دون مطابقة: سجّل الفرق أو علّم الحركة للمتابعة [3]، ثم أغلق التسوية.`,
      en: `Reconcile the Al Ahli statement against the general ledger in three steps [1]:

1. Upload each account's statement as you downloaded it from the bank. October has {accounts} accounts and {transactions} transactions [2].
2. Review the transactions the assistant matched automatically; each one agrees on amount and date.
3. Handle what is left unmatched: record the difference or flag the transaction for follow-up [3], then close the reconciliation.`,
    },
    followUps: ["dso", "accrual"],
  },
  {
    id: "dso",
    question: {
      ar: "لماذا ارتفعت أيام التحصيل؟",
      en: "Why did days sales outstanding rise?",
    },
    articles: [
      "days-sales-outstanding",
      "aging-report",
      "payment-reminders",
      "close-checklist",
    ],
    answer: {
      ar: `ارتفعت أيام التحصيل من {from} يومًا في سبتمبر إلى {to} يومًا في أكتوبر [1]، والسبب تأخر العملاء في السداد:

1. {invoices} فاتورة متأخرة بمجموع {overdue} [2].
2. ثلاثة عملاء كبار تبلغ فواتيرهم المتأخرة {largest}، أي {share} من المجموع [2].

الرقم هو المبالغ المستحقة على العملاء مقسومة على المبيعات اليومية، فكل فاتورة تتأخر ترفعه [1]. وللحد منه أرسل تذكيرًا لكل فاتورة متأخرة [3].`,
      en: `Days sales outstanding rose from {from} days in September to {to} in October [1], because customers paid late:

1. {invoices} invoices are overdue, {overdue} in total [2].
2. Three large customers owe {largest} of it, {share} of the total [2].

The figure is what customers owe divided by daily sales, so every late invoice raises it [1]. To bring it down, send a reminder for each late invoice [3].`,
    },
    followUps: ["bank", "accrual"],
  },
  {
    id: "accrual",
    question: {
      ar: "كيف أرحّل قيد استحقاق؟",
      en: "How do I post an accrual entry?",
    },
    articles: [
      "journal",
      "accrual-entries",
      "posting-entries",
      "close-checklist",
    ],
    answer: {
      ar: `رحّل قيد الاستحقاق من دفتر اليومية على ثلاث خطوات [1]:

1. اختر «قيد جديد» ثم نوع القيد «استحقاق» [2].
2. أدخل الحساب والمبلغ وتاريخ الاستحقاق. في أكتوبر {entries} قيود بمجموع {accrued}.
3. راجع القيد ثم رحّله ليصل إلى دفتر الحسابات [3].`,
      en: `Post an accrual entry from the journal in three steps [1]:

1. Choose "New entry", then the type "Accrual" [2].
2. Enter the account, the amount and the accrual date. October has {entries} entries totalling {accrued}.
3. Review the entry, then post it so it reaches the general ledger [3].`,
    },
    followUps: ["bank", "dso"],
  },
] as const satisfies readonly {
  id: string;
  question: Text;
  articles: readonly ArticleId[];
  answer: Text;
  followUps: readonly string[];
}[];

/** What any other question gets: no article, no sources. */
export const notFound: Text = {
  ar: "لم أجد مقالًا يجيب عن هذا السؤال.",
  en: "I couldn't find an article that answers this question.",
};

/** Beside a failed answer. */
export const connectionError: Text = {
  ar: "انقطع الاتصال بمكتبة المقالات قبل اكتمال الإجابة.",
  en: "The connection to the article library dropped before the answer was done.",
};

export const supportEmail = "support@tiraz.example";
