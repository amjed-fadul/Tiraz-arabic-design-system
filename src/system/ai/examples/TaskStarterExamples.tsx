import type { AgentPresentation } from "../../index";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TaskStarter, numberLocale, useSystem } from "../../index";
import type { ContextItem, TaskStarterProps } from "../../index";
import { story } from "./finance-story";
type Language = "ar" | "en";

/**
 * Reports where the visitor moves the example. It runs when that changes, not
 * when the phase does, so a phase the example was given is never sent back.
 */
function usePhaseReport(
  now: string,
  phase?: string,
  onPhaseChange?: (phase: string) => void,
) {
  const latest = useRef({ phase, onPhaseChange });
  useLayoutEffect(() => {
    latest.current = { phase, onPhaseChange };
  });
  useEffect(() => {
    const { phase, onPhaseChange } = latest.current;
    if (phase !== undefined && now !== phase) onPhaseChange?.(now);
  }, [now]);
}

export function TaskStarterExample({
  language = "ar",
  ...props
}: {
  language?: Language;
  getAgentPresentation?: (status: string) => AgentPresentation;
  appearance?: "card" | "plain";
  disabled?: boolean;
  /**
   * "empty", "writing" or "choosing-mode" (the mode menu open): opens there and
   * reports where the visitor moves it. Without a phase the request rests on
   * writing.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  // The draft and the records are in the page's language, so a change of
  // language starts the request afresh.
  return <Starter key={language} language={language} {...props} />;
}

function Starter({
  getAgentPresentation,
  language,
  appearance = "card",
  disabled = false,
  phase,
  onPhaseChange,
}: {
  language: Language;
  getAgentPresentation?: (status: string) => AgentPresentation;
  appearance?: "card" | "plain";
  disabled?: boolean;
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const n = (value: number) =>
    new Intl.NumberFormat(numberLocale(config, language)).format(value);

  // The records "@" offers: the story's customers and their invoices, and the
  // October report.
  const records: ContextItem[] = [
    ...story.customers.map((customer) => ({
      id: customer.id,
      label: customer.name[language],
      kind: t("عميل", "Customer"),
    })),
    ...story.customers.flatMap((customer) =>
      customer.invoices.map((invoice) => ({
        id: invoice.id,
        label: invoice.id,
        kind: t("فاتورة", "Invoice"),
      })),
    ),
    {
      id: "october-report",
      label: t("تقرير أكتوبر", "October report"),
      kind: t("تقرير", "Report"),
    },
  ];
  const modes: NonNullable<TaskStarterProps["modes"]> = [
    {
      id: "auto",
      label: t("تلقائي", "Auto"),
      description: t(
        "يختار النموذج الأنسب لكل طلب",
        "Picks the right model for each request",
      ),
    },
    {
      id: "fast",
      label: t("سريع", "Fast"),
      description: t(
        "للأسئلة القصيرة والردود الفورية",
        "For short questions and quick replies",
      ),
    },
    {
      id: "deep",
      label: t("معمّق", "Deep"),
      description: t(
        "للتحليل والتقارير، أبطأ وأدق",
        "For analysis and reports, slower and more careful",
      ),
    },
  ];
  const suggestions: NonNullable<TaskStarterProps["suggestions"]> = [
    {
      id: "week",
      label: t("لخّص أداء الأسبوع", "Summarize the week"),
      prompt: t(
        "لخّص أداء الأسبوع وقارنه بسبتمبر",
        "Summarize this week's performance and compare it with September",
      ),
    },
    {
      id: "late",
      label: t(
        "من العملاء الأكثر تأخرًا في السداد؟",
        "Which customers pay latest?",
      ),
    },
    {
      id: "close",
      label: t("جهّز إقفال أكتوبر", "Prepare the October close"),
    },
  ];
  const steps = story.closeSteps;
  const earlier: NonNullable<TaskStarterProps["recent"]> = [
    {
      id: steps[3].id,
      title: steps[3].title[language],
      status: "needs-you",
      time: t(`قبل ${n(5)} د`, `${n(5)} min ago`),
    },
    {
      id: steps[1].id,
      title: steps[1].title[language],
      status: "running",
      time: t(`قبل ${n(12)} د`, `${n(12)} min ago`),
    },
    {
      id: steps[0].id,
      title: steps[0].title[language],
      status: "completed",
      time: t("أمس", "Yesterday"),
    },
  ];

  // The host owns the draft, the attached records and the mode.
  const [value, setValue] = useState(
    phase === "empty"
      ? ""
      : t(
          "لخّص أداء الأسبوع وقارنه بسبتمبر",
          "Summarize this week's performance and compare it with September",
        ),
  );
  const [attached, setAttached] = useState(["INV-1043", "october-report"]),
    [mode, setMode] = useState("auto"),
    [menuOpen, setMenuOpen] = useState(phase === "choosing-mode"),
    [started, setStarted] = useState<NonNullable<TaskStarterProps["recent"]>>(
      [],
    );
  const accept = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(accept.current), []);
  usePhaseReport(
    menuOpen ? "choosing-mode" : value.trim() ? "writing" : "empty",
    phase,
    onPhaseChange,
  );

  return (
    <TaskStarter
      agentPresentation={getAgentPresentation?.("idle")}
      greeting={t(`مرحبًا يا ${story.user.ar}`, `Hello, ${story.user.en}`)}
      value={value}
      onValueChange={setValue}
      // Stands in for your server: it accepts the request after a moment, the
      // task joins the recent list, and the entry starts over.
      onSubmit={(text) =>
        new Promise<void>((resolve) => {
          accept.current = setTimeout(() => {
            setStarted((tasks) => [
              {
                id: `started-${tasks.length}`,
                title: text.trim(),
                status: "running",
                time: t("الآن", "Just now"),
              },
              ...tasks,
            ]);
            setValue("");
            setAttached([]);
            resolve();
          }, 700);
        })
      }
      context={attached.map((id) =>
        records.find((record) => record.id === id)!,
      )}
      onRemoveContext={(id) =>
        setAttached((ids) => ids.filter((item) => item !== id))
      }
      // Open your own file picker and start your own dictation.
      onAttach={() => {}}
      onVoice={() => {}}
      mentionOptions={records}
      onAddContext={(id) =>
        setAttached((ids) => (ids.includes(id) ? ids : [...ids, id]))
      }
      modes={modes}
      mode={mode}
      onModeChange={setMode}
      modeMenuOpen={menuOpen}
      onModeMenuOpenChange={setMenuOpen}
      contextUsage={{ used: 40_960, capacity: 128_000 }}
      suggestions={suggestions}
      onSuggestion={(id) => {
        const suggestion = suggestions.find((item) => item.id === id)!;
        setValue(suggestion.prompt ?? suggestion.label);
      }}
      recent={[...started, ...earlier]}
      // Open the task in your own view.
      onOpenRecent={() => {}}
      disabled={disabled}
      disabledReason={
        disabled
          ? t(
              "المساعد غير متاح الآن. حاول لاحقًا.",
              "The assistant isn't available right now. Try again later.",
            )
          : undefined
      }
      appearance={appearance}
    />
  );
}
