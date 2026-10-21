import type { PermissionLevel } from "../../system";
import { photoMembers } from "../../system/ai/examples/portraits";
import { story } from "../../system/ai/examples/finance-story";
import { today } from "../frame/screen";

/**
 * Team and AI settings' facts, as values: text in both languages, numbers and
 * ISO dates. The people are the docs' team (`teamMembers`, with the two
 * portraits) and Laila, from the story. Their roles, emails and last activity,
 * and the assistant's settings below, are the docs example's and what the
 * story lacks.
 */
export type Role = "admin" | "member" | "viewer";
type Text = { readonly ar: string; readonly en: string };

export const roles: Record<Role, Text> = {
  admin: { ar: "مسؤول", en: "Admin" },
  member: { ar: "عضو", en: "Member" },
  viewer: { ar: "مشاهد", en: "Viewer" },
};

/** The plan's seats; people invited take one until they join. */
export const seats = 10;

export interface Member {
  id: string;
  /** Null for someone invited, who has no name here yet. */
  name: Text | null;
  initials?: Text;
  photo?: string;
  email: string;
  role: Role;
  /** An ISO date, or null before the invitation is accepted. */
  lastActive: string | null;
  you?: boolean;
}

const arabic = photoMembers("ar");
const english = photoMembers("en");
const work: Record<string, { role: Role; lastActive: string }> = {
  sara: { role: "member", lastActive: "2026-10-18" },
  omar: { role: "member", lastActive: "2026-10-17" },
  lina: { role: "member", lastActive: "2026-10-16" },
  huda: { role: "viewer", lastActive: "2026-10-12" },
  sami: { role: "viewer", lastActive: "2026-10-09" },
};

/** Laila first, then the five in `teamMembers`. */
export const team: readonly Member[] = [
  {
    id: "laila",
    name: story.user,
    email: "laila@tiraz.example",
    role: "admin",
    lastActive: today,
    you: true,
  },
  ...arabic.map((member, index): Member => ({
    id: member.id,
    name: { ar: member.name, en: english[index].name },
    initials: { ar: member.fallback, en: english[index].fallback },
    photo: member.src,
    email: `${member.id}@tiraz.example`,
    ...work[member.id],
  })),
];

// Assistant controls: the docs example's data. Each action's level, what is
// remembered, the context window and its parts, and the models.
const customers: Text = { ar: "العملاء", en: "Customers" };
const close: Text = { ar: "الإقفال", en: "Month-end close" };
const chat: Text = {
  ar: `من محادثة مع ${story.user.ar}`,
  en: `From a conversation with ${story.user.en}`,
};

export interface Permission {
  id: string;
  label: Text;
  description: Text;
  level: PermissionLevel;
  risks?: readonly ("sensitive" | "irreversible")[];
}
export const permissions: readonly Permission[] = [
  {
    id: "ledger",
    label: {
      ar: "قراءة دفتر الحسابات والفواتير",
      en: "Read the ledger and invoices",
    },
    description: {
      ar: "ليجيب عن أسئلتك ويحلّل الأرقام، دون أن يغيّر شيئًا.",
      en: "To answer your questions and analyze the figures, without changing anything.",
    },
    level: "auto",
  },
  {
    id: "accruals",
    label: story.closeSteps[2].title,
    description: {
      ar: "قيود نهاية الشهر في دفتر الحسابات، ويمكن عكسها.",
      en: "Month-end entries in the ledger, which can be reversed.",
    },
    level: "sensitive",
    risks: ["sensitive"],
  },
  // Neither can be undone, so both always ask, whatever level is stored.
  {
    id: "messages",
    label: { ar: "إرسال رسائل للعملاء", en: "Send messages to customers" },
    description: {
      ar: "تذكيرات السداد والردود عبر البريد.",
      en: "Payment reminders and replies by email.",
    },
    level: "always",
    risks: ["sensitive", "irreversible"],
  },
  {
    id: "payments",
    label: { ar: "جدولة دفعات الموردين", en: "Schedule supplier payments" },
    description: {
      ar: "تحويلات من حسابات البنك الأهلي في مواعيد استحقاقها.",
      en: "Transfers from the Al Ahli bank accounts on their due dates.",
    },
    level: "always",
    risks: ["sensitive", "irreversible"],
  },
];

export interface Memory {
  id: string;
  category: Text;
  text: Text;
  source: Text;
  /** An ISO date. */
  date: string;
  /** Paused from the start. */
  paused?: boolean;
}
const [madar, nada] = story.customers;
export const memory: readonly Memory[] = [
  {
    id: "madar",
    category: customers,
    text: {
      ar: `تفضّل ${madar.name.ar} التواصل مع ${story.draft.recipient.ar}`,
      en: `${madar.name.en} prefers to be contacted through ${story.draft.recipient.en}`,
    },
    source: chat,
    date: "2026-10-14",
  },
  {
    id: "summary",
    category: close,
    text: {
      ar: "يريد المدير المالي ملخص الإقفال في صفحة واحدة",
      en: "The CFO wants the close summary on one page",
    },
    source: { ar: "من مهمة إقفال أكتوبر", en: "From the October close task" },
    date: "2026-10-16",
  },
  {
    id: "nada",
    category: customers,
    text: {
      ar: `تسدّد ${nada.name.ar} دفعاتها في آخر الشهر`,
      en: `${nada.name.en} pays at the end of the month`,
    },
    source: {
      ar: "من تقرير أعمار الديون",
      en: "From the receivables aging report",
    },
    date: "2026-10-12",
    paused: true,
  },
  {
    id: "order",
    category: close,
    text: {
      ar: "تُطابَق فواتير الموردين قبل تسوية البنك",
      en: "Supplier invoices are matched before the bank reconciliation",
    },
    source: chat,
    date: "2026-10-15",
  },
];

/** The context window the finance assistant works in, and what fills it. */
export const context = {
  capacity: 128_000,
  parts: [
    {
      id: "conversation",
      label: { ar: "المحادثة", en: "Conversation" },
      value: 20_480,
    },
    {
      id: "records",
      label: { ar: "السجلات المرفقة", en: "Attached records" },
      value: 12_800,
    },
    { id: "memory", label: { ar: "الذاكرة", en: "Memory" }, value: 5_120 },
    {
      id: "instructions",
      label: { ar: "التعليمات", en: "Instructions" },
      value: 2_600,
    },
  ],
  note: { ar: "حُدّث بعد آخر رسالة", en: "Updated after your last message" },
} as const;

export const models = [
  {
    id: "falak-swift",
    name: { ar: "فلك سريع", en: "Falak Swift" },
    provider: { ar: "فلك", en: "Falak" },
    description: {
      ar: "ردود سريعة ومسودات قصيرة",
      en: "Quick replies and short drafts",
    },
    context: 128_000,
  },
  {
    id: "falak-precise",
    name: { ar: "فلك متقن", en: "Falak Precise" },
    provider: { ar: "فلك", en: "Falak" },
    description: {
      ar: "للمستندات الطويلة وتحليل الجداول",
      en: "Long documents and spreadsheet analysis",
    },
    context: 128_000,
  },
] as const;
export const defaultModel = "falak-swift";
