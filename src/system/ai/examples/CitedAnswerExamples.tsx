import { useEffect, useState } from "react";
import {
  CitedAnswer,
  numberLocale,
  useReducedMotion,
  useSystem,
} from "../../index";
import type {
  CitedAnswerProps,
  FeedbackReason,
  SourceReference,
} from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Status = CitedAnswerProps["status"];

// How the host paces the demo: a source every 450 ms while thinking, then five
// words every 170 ms while writing.
const arrivalMs = 450,
  wordMs = 170,
  wordsPerBeat = 5;

export function CitedAnswerExample({
  language = "ar",
  appearance = "card",
  question = true,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: "card" | "plain";
  /** Shows the question above the answer; a conversation would show it. */
  question?: boolean;
  /**
   * "thinking", "writing", "completed", "failed" or "stopped", held as given.
   * Stopping, retrying or regenerating moves the answer on and reports where
   * it went. Without a phase the answer rests on the finished state.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem(),
    reduced = useReducedMotion();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const locale = numberLocale(config, language);
  const n = (value: number) => new Intl.NumberFormat(locale).format(value);
  const percent = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / 100);
  const sar = (value: number, compact = false) =>
    money(value, language, config.numerals, { compact });

  const [local, setLocal] = useState<Status>("completed");
  const status = (phase as Status | undefined) ?? local;
  // How far the run has come in its status, and where it was when the person
  // stopped it: the words written, the sources found and the seconds taken.
  const [beat, setBeat] = useState({ status, n: 0 }),
    [cut, setCut] = useState<{
      words: number;
      arrived: number;
      seconds: number;
    }>();
  if (beat.status !== status) {
    setBeat({ status, n: 0 });
    if (status !== "stopped") setCut(undefined);
  }
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null),
    [reason, setReason] = useState<FeedbackReason>();
  function move(next: Status) {
    setLocal(next);
    onPhaseChange?.(next);
  }

  // The answer comes from the shared story. [n] names a source's number.
  const text = t(
    `انخفض صافي التدفق النقدي في أكتوبر ${percent(-story.cash.netFlowChange)} عن سبتمبر رغم ارتفاع الإيرادات ${percent(story.revenue.change)} [1]، ويعود ذلك إلى سببين:

1. تأخّر ثلاثة عملاء كبار في السداد. بلغ مجموع فواتيرهم المتأخرة ${sar(story.overdue.largest.amount)}، أي ${percent(story.overdue.largest.share)} من إجمالي المتأخرات البالغ ${sar(story.overdue.amount)} [2].
2. دفعة مبكرة للنخبة للتغليف. دُفع ${sar(story.earlyPayment.amount)} في ${n(9)} أكتوبر مع أن موعدها ${n(30)} أكتوبر، مقابل خصم ${percent(story.earlyPayment.discount)} [3].`,
    `Net cash flow fell ${percent(-story.cash.netFlowChange)} from September even though revenue rose ${percent(story.revenue.change)} [1], for two reasons:

1. Three large customers paid late. Their overdue invoices total ${sar(story.overdue.largest.amount)}, ${percent(story.overdue.largest.share)} of the ${sar(story.overdue.amount)} overdue [2].
2. An early payment to Al Nukhba Packaging. ${sar(story.earlyPayment.amount)} went out on October ${n(9)}, due October ${n(30)}, for a ${percent(story.earlyPayment.discount)} discount [3].`,
  );
  const words = text.match(/\S+\s*/gu) ?? [];
  const beats = Math.ceil(words.length / wordsPerBeat),
    limit = status === "thinking" ? story.sources.length : beats;
  useEffect(() => {
    if (
      reduced ||
      (status !== "thinking" && status !== "writing") ||
      beat.n >= limit
    )
      return;
    const timer = setTimeout(
      () => setBeat((current) => ({ ...current, n: current.n + 1 })),
      status === "thinking" ? arrivalMs : wordMs,
    );
    return () => clearTimeout(timer);
  }, [status, beat.n, limit, reduced]);

  const written =
    status === "completed"
      ? words.length
      : status === "writing"
        ? reduced
          ? words.length
          : Math.min(beat.n * wordsPerBeat, words.length)
        : status === "failed"
          ? Math.floor(words.length * 0.4)
          : status === "stopped"
            ? (cut?.words ?? Math.floor(words.length * 0.65))
            : 0;
  // The search goes on while thinking, and was cut short when the person
  // stopped it before a word was written: then the answer cites nothing, and
  // the step the search was on gets no tick.
  const searching =
    status === "thinking" || (status === "stopped" && written === 0);

  // The five sources the search covered, and the three the answer cites.
  const detail: Record<string, [description: string, metadata: string]> = {
    ledger: [
      t(
        `صافي التدفق النقدي أقل ${percent(-story.cash.netFlowChange)} من سبتمبر، والإيرادات ${sar(story.revenue.amount, true)}.`,
        `Net cash flow is ${percent(-story.cash.netFlowChange)} below September; revenue is ${sar(story.revenue.amount, true)}.`,
      ),
      `${n(12)}–${n(18)} ${story.period.month[language]}`,
    ],
    "customer-invoices": [
      t(
        `${n(story.overdue.invoices)} فاتورة متأخرة بإجمالي ${sar(story.overdue.amount)}.`,
        `${n(story.overdue.invoices)} overdue invoices totalling ${sar(story.overdue.amount)}.`,
      ),
      t(`محدّث قبل ${n(5)} د`, `Updated ${n(5)} min ago`),
    ],
    "al-ahli-statement": [
      t(
        `دفعة ${sar(story.earlyPayment.amount)} إلى ${story.earlyPayment.supplier.ar} في ${n(9)} أكتوبر.`,
        `A ${sar(story.earlyPayment.amount)} payment to ${story.earlyPayment.supplier.en} on October ${n(9)}.`,
      ),
      t("كشف أكتوبر", "October statement"),
    ],
  };
  const searched: SourceReference[] = story.sources.map((source) => ({
    id: source.id,
    number: source.number,
    title: source.title[language],
    href: `#${source.id}`,
  }));
  const cited: SourceReference[] = searching
    ? []
    : searched.slice(0, 3).map((source) => ({
        ...source,
        description: detail[source.id]?.[0],
        metadata: detail[source.id]?.[1],
      }));
  // A stopped run keeps only what had arrived when it was stopped.
  const arrived =
    status === "thinking" && !reduced
      ? Math.min(beat.n, searched.length)
      : status === "stopped" && cut
        ? cut.arrived
        : searched.length;
  const elapsed =
    status === "thinking"
      ? Math.floor((beat.n * arrivalMs) / 1000)
      : status === "stopped" && cut
        ? cut.seconds
        : 6;
  const current =
    status === "thinking" ? ("running" as const) : ("pending" as const);
  const steps = [
    {
      id: "ledger",
      label: t("قراءة دفتر الحسابات", "Read the general ledger"),
      state: arrived >= 2 ? ("completed" as const) : current,
    },
    {
      id: "invoices",
      label: t("مطابقة فواتير العملاء", "Match the customer invoices"),
      state:
        arrived < 2
          ? ("pending" as const)
          : arrived >= 4
            ? ("completed" as const)
            : current,
    },
    {
      id: "bank",
      label: t("مقارنة حركات البنك الأهلي", "Compare the Al Ahli transactions"),
      state:
        arrived < 4
          ? ("pending" as const)
          : searching
            ? current
            : ("completed" as const),
    },
  ];

  return (
    <CitedAnswer
      status={status}
      question={
        question
          ? t(
              "لماذا انخفض التدفق النقدي في أكتوبر؟",
              "Why did cash flow fall in October?",
            )
          : undefined
      }
      content={words.slice(0, written).join("")}
      sources={cited}
      thinking={{
        // Seconds, updated at most once a second.
        elapsed,
        searched: searched.slice(0, arrived),
        steps,
      }}
      followUps={[
        {
          id: "late",
          label: t(
            "من العملاء الأكثر تأخرًا في السداد؟",
            "Which customers pay latest?",
          ),
        },
        {
          id: "early",
          label: t(
            "ما أثر الدفعة المبكرة على الرصيد؟",
            "What did the early payment do to the balance?",
          ),
        },
      ]}
      // Ask the question in your own composer.
      onFollowUp={() => {}}
      feedback={feedback}
      reason={reason}
      onFeedbackChange={(value, why) => {
        setFeedback(value);
        setReason(why);
      }}
      onCopy={(text) => navigator.clipboard.writeText(text)}
      onRegenerate={() => {
        setFeedback(null);
        setReason(undefined);
        move("thinking");
      }}
      onStop={() => {
        setCut({ words: written, arrived, seconds: elapsed });
        move("stopped");
      }}
      onRetry={() => move("thinking")}
      duration={status === "completed" ? 6.2 : undefined}
      error={t(
        "انقطع الاتصال بدفتر الحسابات قبل اكتمال الإجابة.",
        "The connection to the ledger dropped before the answer was done.",
      )}
      appearance={appearance}
    />
  );
}
