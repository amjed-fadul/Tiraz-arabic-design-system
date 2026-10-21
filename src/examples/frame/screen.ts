import { createContext, useContext } from "react";
import type { Context } from "react";
import {
  BadgeCheck,
  Bot,
  CalendarCheck,
  FileSignature,
  LayoutDashboard,
  LifeBuoy,
  Palette,
  ReceiptText,
  Settings,
  SquareKanban,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The example screens, the Dashboard first: one place for each screen's slug,
 * name, icon and one-sentence description, Arabic first. The frame's Sidebar,
 * the routes and the docs' screen pages all read this table.
 */
export const screens = [
  {
    slug: "dashboard",
    name: ["لوحة العملاء", "Customer dashboard"],
    description: [
      "الطلبات والعملاء وصندوق القرارات في لوحة واحدة.",
      "Orders, customers and the decision inbox on one page.",
    ],
    icon: LayoutDashboard,
  },
  {
    slug: "month-end-close",
    name: ["إقفال الشهر", "Month-end close"],
    description: [
      "تابع إقفال وكيل المالية لشهر أكتوبر، وتدخّل حيث ينتظر ليلى.",
      "Follow the Finance agent's October close, and step in where it waits on Laila.",
    ],
    icon: CalendarCheck,
  },
  {
    slug: "invoices",
    name: ["الفواتير والتحصيل", "Invoices and collections"],
    description: [
      "اعثر على الفواتير المتأخرة، وأرسل التذكيرات بعد مراجعتها، فاتورةً تلو الأخرى.",
      "Find late invoices, and send reviewed reminders one invoice at a time.",
    ],
    icon: ReceiptText,
  },
  {
    slug: "customer-profile",
    name: ["ملف العميل", "Customer profile"],
    description: [
      "شركة مدار في لمحة، وسؤال عنها مع إرفاق العميل.",
      "Madar Company at a glance, and a question about it with the customer attached.",
    ],
    icon: UserRound,
  },
  {
    slug: "sales-pipeline",
    name: ["خط المبيعات", "Sales pipeline"],
    description: [
      "صفقات أكتوبر حسب المرحلة: انقل صفقة إلى مرحلتها التالية من لوحة المفاتيح، ثم تابِعها.",
      "October's deals by stage: move one on from the keyboard, and follow up.",
    ],
    icon: SquareKanban,
  },
  {
    slug: "onboarding",
    name: ["التسجيل والتوثيق", "Onboarding and verification"],
    description: [
      "سجّل منشأتك ووثّقها في أربع خطوات قصيرة.",
      "Register a company and verify it in four short steps.",
    ],
    icon: BadgeCheck,
  },
  {
    slug: "help-center",
    name: ["مركز المساعدة", "Help center"],
    description: [
      "اطرح سؤالًا واحدًا، ثم احصل على إجابة موثّقة أو تحدّث إلى شخص.",
      "Ask one question, then get a sourced answer or reach a person.",
    ],
    icon: LifeBuoy,
  },
  {
    slug: "contract-review",
    name: ["مراجعة العقود", "Contract review"],
    description: [
      "راجع تعديلات المساعد على شروط الدفع، ثم أرسل العقد المعدّل، لا قبل ذلك.",
      "Review the assistant's edits to the payment terms, then send the revised contract, never before.",
    ],
    icon: FileSignature,
  },
  {
    slug: "content-studio",
    name: ["استوديو المحتوى", "Content studio"],
    description: [
      "صمّم صورة حملة تذكيرات الدفع من موجز، واختر نسخة منها، ثم حسّن نصّها المرافق.",
      "Make the payment-reminder campaign's visual from a brief, pick a version, and polish its caption.",
    ],
    icon: Palette,
  },
  {
    slug: "agent-control-room",
    name: ["غرفة متابعة الوكلاء", "Agent control room"],
    description: [
      "كل الوكلاء معًا: ما ينتظر ليلى، وما يعمل، وما فشل.",
      "Every agent at once: what waits on Laila, what runs, and what failed.",
    ],
    icon: Bot,
  },
  {
    slug: "team-settings",
    name: ["الفريق والإعدادات", "Team and AI settings"],
    description: [
      "من في فريق المالية، وما يمكن للمساعد فعله دون أن يسأل.",
      "Who is on the finance team, and what the assistant may do without asking.",
    ],
    icon: Settings,
  },
] as const satisfies readonly {
  slug: string;
  name: readonly [string, string];
  description: readonly [string, string];
  icon: LucideIcon;
}[];
export type ScreenSlug = (typeof screens)[number]["slug"];
/** A screen's standalone route. */
export const screenPath = (slug: ScreenSlug) => `/examples/${slug}`;
/** The screens' clock: the story's week ends here (story.period.week.to). */
export const today = "2026-10-18";

/** Stands in for a server: resolves after `ms`; rejects with an AbortError on abort. */
export function recorded(signal: AbortSignal, ms = 600): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", cancel, { once: true });
  });
}

/** What a screen gets from its frame (`useScreen`). */
export interface Screen {
  slug: ScreenSlug;
  language: "ar" | "en";
  /** The text for the page language, Arabic first. */
  t(ar: string, en: string): string;
  /** numberLocale(config, language): Arabic-Indic digits in Arabic. */
  locale: string;
  /** «٤٨٬٣٠٠» / "48,300". */
  number(value: number): string;
  /** A value in percent: 18 → «١٨٪», 6.1 → «٦٫١٪». */
  percent(value: number): string;
  /** finance-story's money(): «٩٬٤٠٠ ر.س» / "SAR 9,400". */
  money(value: number, options?: { compact?: boolean }): string;
  /** An ISO date as «٣٠ أكتوبر» / "Oct 30": day numeric, month short, UTC. */
  date(iso: string): string;
  /** screenPath(slug), plus lang=en and theme=dark when set. */
  href(slug: ScreenSlug): string;
  /** Embedded: posts tiraz:open-screen to the docs; otherwise goes to href(slug). */
  open(slug: ScreenSlug): void;
  /** From main's content width: wide from 960px, medium from 640px, else narrow. */
  size: "wide" | "medium" | "narrow";
  /** The Sheet side for the end edge: left in Arabic. */
  endSide: "left" | "right";
}
export const ScreenContext: Context<Screen | null> =
  createContext<Screen | null>(null);
/** The frame's helpers; throws outside ScreenFrame. */
export function useScreen(): Screen {
  const screen = useContext(ScreenContext);
  if (!screen) throw new Error("useScreen needs a ScreenFrame around it.");
  return screen;
}
