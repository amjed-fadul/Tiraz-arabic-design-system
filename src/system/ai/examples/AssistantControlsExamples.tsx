import { useState } from "react";
import { AssistantControls, numberLocale, useSystem } from "../../index";
import type {
  AssistantMemoryItem,
  AssistantPermission,
  ModelOption,
  PermissionLevel,
} from "../../index";
import { story } from "./finance-story";
type Language = "ar" | "en";

// The context window the finance assistant works in, and the four parts that
// fill it. Filling up, the conversation has grown.
const capacity = 128_000;
const usages = {
  normal: {
    conversation: 20_480,
    records: 12_800,
    memory: 5_120,
    rules: 2_600,
  },
  filling: {
    conversation: 89_480,
    records: 12_800,
    memory: 5_120,
    rules: 2_600,
  },
};

export function AssistantControlsExample({
  language = "ar",
  appearance = "card",
  usage = "normal",
}: {
  language?: Language;
  appearance?: "card" | "plain";
  /** "normal" uses 41,000 of 128,000 tokens; "filling" uses 110,000. */
  usage?: "normal" | "filling";
}) {
  const ar = language === "ar",
    { config } = useSystem();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const date = (iso: string) =>
    new Intl.DateTimeFormat(numberLocale(config, language), {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(iso));

  // Your records: each action's level, whether memory is on, what is
  // remembered and paused, and the model. Your app enforces them when the
  // assistant acts; the pattern only shows them and reports the person's
  // choices.
  const [levels, setLevels] = useState<Record<string, PermissionLevel>>({
    ledger: "auto",
    accruals: "sensitive",
    messages: "always",
    payments: "always",
  });
  const [memoryEnabled, setMemoryEnabled] = useState(true),
    [paused, setPaused] = useState<Record<string, boolean>>({ nada: true }),
    [deleted, setDeleted] = useState<readonly string[]>([]),
    [model, setModel] = useState("falak-swift");

  const permissions: AssistantPermission[] = [
    {
      id: "ledger",
      label: t("قراءة دفتر الحسابات والفواتير", "Read the ledger and invoices"),
      description: t(
        "ليجيب عن أسئلتك ويحلّل الأرقام، دون أن يغيّر شيئًا.",
        "To answer your questions and analyze the figures, without changing anything.",
      ),
      level: levels.ledger,
    },
    {
      id: "accruals",
      label: story.closeSteps[2].title[language],
      description: t(
        "قيود نهاية الشهر في دفتر الحسابات، ويمكن عكسها.",
        "Month-end entries in the ledger, which can be reversed.",
      ),
      level: levels.accruals,
      risks: ["sensitive"],
    },
    // Neither can be undone, so both always ask, whatever level you store.
    {
      id: "messages",
      label: t("إرسال رسائل للعملاء", "Send messages to customers"),
      description: t(
        "تذكيرات السداد والردود عبر البريد.",
        "Payment reminders and replies by email.",
      ),
      level: levels.messages,
      risks: ["sensitive", "irreversible"],
    },
    {
      id: "payments",
      label: t("جدولة دفعات الموردين", "Schedule supplier payments"),
      description: t(
        "تحويلات من حسابات البنك الأهلي في مواعيد استحقاقها.",
        "Transfers from the Al Ahli bank accounts on their due dates.",
      ),
      level: levels.payments,
      risks: ["sensitive", "irreversible"],
    },
  ];

  const customers = t("العملاء", "Customers"),
    close = t("الإقفال", "Month-end close"),
    chat = t("من محادثة مع ليلى", "From a conversation with Laila");
  const remembered: AssistantMemoryItem[] = [
    {
      id: "madar",
      category: customers,
      text: t(
        "تفضّل شركة مدار التواصل مع سارة العتيبي",
        "Madar Company prefers to be contacted through Sara Al-Otaibi",
      ),
      source: chat,
      date: date("2026-10-14"),
    },
    {
      id: "summary",
      category: close,
      text: t(
        "يريد المدير المالي ملخص الإقفال في صفحة واحدة",
        "The CFO wants the close summary on one page",
      ),
      source: t("من مهمة إقفال أكتوبر", "From the October close task"),
      date: date("2026-10-16"),
    },
    {
      id: "nada",
      category: customers,
      text: t(
        "تسدّد مؤسسة الندى دفعاتها في آخر الشهر",
        "Al Nada Establishment pays at the end of the month",
      ),
      source: t("من تقرير أعمار الديون", "From the receivables aging report"),
      date: date("2026-10-12"),
    },
    {
      id: "order",
      category: close,
      text: t(
        "تُطابَق فواتير الموردين قبل تسوية البنك",
        "Supplier invoices are matched before the bank reconciliation",
      ),
      source: chat,
      date: date("2026-10-15"),
    },
  ];
  const memory = remembered
    .filter((item) => !deleted.includes(item.id))
    .map((item) => ({ ...item, paused: !!paused[item.id] }));

  const parts = usages[usage],
    used = Object.values(parts).reduce((sum, value) => sum + value, 0);
  const models: ModelOption[] = [
    {
      id: "falak-swift",
      name: t("فلك سريع", "Falak Swift"),
      provider: t("فلك", "Falak"),
      description: t(
        "ردود سريعة ومسودات قصيرة",
        "Quick replies and short drafts",
      ),
      context: "128k",
    },
    {
      id: "falak-precise",
      name: t("فلك متقن", "Falak Precise"),
      provider: t("فلك", "Falak"),
      description: t(
        "للمستندات الطويلة وتحليل الجداول",
        "Long documents and spreadsheet analysis",
      ),
      context: "128k",
    },
  ];

  return (
    <AssistantControls
      permissions={permissions}
      onPermissionChange={(id, level) =>
        setLevels((current) => ({ ...current, [id]: level }))
      }
      memoryEnabled={memoryEnabled}
      onMemoryEnabledChange={setMemoryEnabled}
      memory={memory}
      onMemoryPauseChange={(id, next) =>
        setPaused((current) => ({ ...current, [id]: next }))
      }
      // Your app deletes the memory from its store, after a confirmation if
      // it can't bring it back, and then passes the shorter list.
      onMemoryDelete={(id) => setDeleted((current) => [...current, id])}
      contextUsage={{
        used,
        capacity,
        details: [
          {
            id: "conversation",
            label: t("المحادثة", "Conversation"),
            value: parts.conversation,
          },
          {
            id: "records",
            label: t("السجلات المرفقة", "Attached records"),
            value: parts.records,
          },
          { id: "memory", label: t("الذاكرة", "Memory"), value: parts.memory },
          {
            id: "instructions",
            label: t("التعليمات", "Instructions"),
            value: parts.rules,
          },
        ],
        metadata: t("حُدّث بعد آخر رسالة", "Updated after your last message"),
        action: {
          label: t("لخّص المحادثة", "Summarize the conversation"),
          onSelect: () => {
            // Your app summarizes the conversation here, then passes the
            // smaller usage it reports.
          },
        },
      }}
      models={models}
      model={model}
      onModelChange={setModel}
      appearance={appearance}
    />
  );
}
