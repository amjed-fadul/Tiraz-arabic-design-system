import { story } from "../../system/ai/examples/finance-story";
import { heading } from "../month-end-close/data";
import type { Text } from "../month-end-close/data";

// Values only: text in both languages, Arabic first, with numbers. The
// accruals request, the Jeddah question and the three reminders are the Month-end
// close's (../month-end-close/data.ts), so the two screens agree; the story
// gives the agents, the close's steps and the figures. This file adds only what
// they lack. The screen formats every number and amount with the frame's
// helpers.

export type AgentId = "finance" | "collections" | "campaigns";
export const agentIds: readonly AgentId[] = [
  "finance",
  "collections",
  "campaigns",
];

/** What the rows that belong to the close say under their title. */
export const closeContext: Text = {
  ar: "ضمن إقفال حسابات أكتوبر",
  en: "Part of the October close",
};
/** The running close, named as the Month-end close names it. */
export const closeName: Text = heading;
/** The supplier match, the story's first step, finished an hour ago. */
export const anHourAgo: Text = { ar: "قبل ساعة", en: "an hour ago" };

/** The campaign designer's cover, which the inbox shows failed. */
export const cover = {
  title: { ar: "غلاف حملة رمضان", en: "Ramadan campaign cover" },
  error: {
    ar: "تعذّر توليد الصورة",
    en: "The image couldn't be generated",
  },
};

/** What a row says once the host recorded what the person did, and no more. */
export const receipts = {
  approved: { ar: "تمت الموافقة · الآن", en: "Approved · just now" },
  rejected: { ar: "رُفض الطلب · الآن", en: "Request rejected · just now" },
  answered: {
    ar: "أُرسلت إجاباتك · الآن",
    en: "Your answers were sent · just now",
  },
};

/** Minutes since each row arrived, and since the close started running. */
export const minutes = {
  accruals: 9,
  jeddah: 12,
  /** One per reminder, in the order of `reminders`. */
  drafts: [20, 19, 18],
  campaign: 35,
  close: 14,
} as const;

/** A short count with its noun, or a word alone, as a task row's summary. */
export interface Summary extends Text {
  count?: number;
}
/** The operation a running step is on. */
export interface Tool {
  label: Text;
  tool: string;
  /** Preformatted input, shown when the call opens. */
  input: string;
}
export interface PanelTask {
  id: string;
  title: Text;
  state: "completed" | "running" | "failed";
  summary: Summary;
  note: Text;
  /** The operation it is on while it runs. */
  tool?: Tool;
  /** What a failed task says, and does, once the host retries it. */
  retried?: { summary: Summary; note: Text };
}
export interface Panel {
  /** Tokens in the agent's context, in all and by part. */
  context: {
    used: number;
    capacity: number;
    parts: { id: string; label: Text; value: number }[];
  };
  tasks: PanelTask[];
}

const [suppliers, bank, , , closeSummary] = story.closeSteps;
const aging = story.sources.find((source) => source.id === "aging-report")!;

const parts = (instructions: number, messages: number, tools: number) => [
  {
    id: "instructions",
    label: { ar: "التعليمات", en: "Instructions" },
    value: instructions,
  },
  { id: "messages", label: { ar: "الرسائل", en: "Messages" }, value: messages },
  { id: "tools", label: { ar: "الأدوات", en: "Tools" }, value: tools },
];

/**
 * Each agent's panel: its context, and its tasks beside the inbox's requests.
 * Finance's close steps are the story's; the other tasks are invented.
 */
export const panels: Record<AgentId, Panel> = {
  finance: {
    context: {
      used: 118_400,
      capacity: 200_000,
      parts: parts(6_200, 52_000, 60_200),
    },
    tasks: [
      {
        id: "suppliers",
        title: suppliers.title,
        state: "completed",
        summary: { count: suppliers.invoices, ar: "فاتورة", en: "invoices" },
        note: {
          ar: "تطابقت الفواتير مع أوامر الشراء، وسُجّلت الفروقات للمراجعة.",
          en: "The invoices matched their purchase orders, and the differences are logged for review.",
        },
      },
      {
        id: "bank",
        title: bank.title,
        state: "completed",
        summary: { count: bank.transactions, ar: "حركة", en: "transactions" },
        note: {
          ar: "طابق الوكيل حركات الحسابات الثلاثة بكشف البنك الأهلي.",
          en: "The agent matched the three accounts' transactions to the Al Ahli statement.",
        },
      },
      {
        id: "summary",
        title: closeSummary.title,
        state: "running",
        summary: { ar: closeSummary.format, en: closeSummary.format },
        note: {
          ar: "يجمع الوكيل أرقام الملخص من تقرير أعمار الديون.",
          en: "The agent gathers the summary's figures from the receivables aging report.",
        },
        tool: {
          label: {
            ar: `قراءة ${aging.title.ar}`,
            en: `Read the ${aging.title.en.toLowerCase()}`,
          },
          tool: "aging.read",
          input: JSON.stringify(
            { report: aging.id, period: "2026-10" },
            null,
            2,
          ),
        },
      },
    ],
  },
  collections: {
    context: {
      used: 41_200,
      capacity: 200_000,
      parts: parts(6_200, 21_000, 14_000),
    },
    tasks: [
      {
        id: "gather",
        title: {
          ar: "تجميع الفواتير المتأخرة",
          en: "Gather the overdue invoices",
        },
        state: "completed",
        summary: {
          count: story.overdue.invoices,
          ar: "فاتورة",
          en: "invoices",
        },
        note: {
          ar: "معظم قيمتها على العملاء الثلاثة الكبار.",
          en: "Most of their value is with the three large customers.",
        },
      },
      {
        id: "write",
        title: { ar: "صياغة مسودات التذكير", en: "Write the reminder drafts" },
        state: "completed",
        summary: {
          count: story.closeSteps[3].customers,
          ar: "مسودات",
          en: "drafts",
        },
        note: {
          ar: "مسودة لكل عميل، ولا تُرسل أي منها قبل أن تراجعها.",
          en: "One draft per customer. None is sent before you review it.",
        },
      },
    ],
  },
  campaigns: {
    context: {
      used: 98_600,
      capacity: 200_000,
      parts: parts(5_800, 41_000, 51_800),
    },
    tasks: [
      {
        id: "cover",
        title: cover.title,
        state: "failed",
        summary: { ar: "تعذّر التوليد", en: "Generation failed" },
        note: {
          ar: "تعذّر توليد الصورة. أعد المحاولة من صندوق القرارات.",
          en: "The image couldn't be generated. Try again from the decision inbox.",
        },
        tool: {
          label: {
            ar: "توليد غلاف حملة رمضان",
            en: "Generate the Ramadan campaign cover",
          },
          tool: "image.generate",
          input: JSON.stringify(
            { brief: "ramadan-cover", versions: 1 },
            null,
            2,
          ),
        },
        retried: {
          summary: { ar: "جارٍ التوليد", en: "Generating" },
          note: {
            ar: "يُعاد توليد الصورة.",
            en: "The image is being generated again.",
          },
        },
      },
      {
        id: "visual",
        title: {
          ar: "صورة حملة تذكيرات الدفع",
          en: "Payment reminders campaign visual",
        },
        state: "completed",
        summary: { count: 4, ar: "نسخ", en: "versions" },
        note: {
          ar: "النسخ الأربع جاهزة لتختار منها.",
          en: "The four versions are ready for you to choose from.",
        },
      },
    ],
  },
};
