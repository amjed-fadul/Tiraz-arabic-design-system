import type { AgentPresentation } from "../../index";
import { useEffect, useState } from "react";
import {
  DataAnswer,
  numberLocale,
  useReducedMotion,
  useSystem,
} from "../../index";
import type {
  DataAnswerChart,
  DataAnswerProps,
  SourceReference,
} from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Status = DataAnswerProps["status"];

// How the host paces the thinking: a table every 700 ms.
const arrivalMs = 700;
// The customers' short names, for the chart's axis and slices.
const shortNames = {
  madar: ["مدار", "Madar"],
  "al-nada": ["الندى", "Al Nada"],
  "al-rowad": ["الرواد", "Al Rowad"],
} as const;

export function DataAnswerExample({
  getAgentPresentation,
  language = "ar",
  appearance = "card",
  phase,
  onPhaseChange,
}: {
  language?: Language;
  getAgentPresentation?: (status: string) => AgentPresentation;
  appearance?: "card" | "plain";
  /**
   * "thinking", "completed", "failed" or "empty", held as given. Trying again
   * moves the answer on and reports where it went. Without a phase the answer
   * rests on the finished state.
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
  const year = new Intl.NumberFormat(locale, { useGrouping: false }).format(
    story.period.year,
  );
  const percent = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / 100);
  const sar = (value: number, compact = false) =>
    money(value, language, config.numerals, { compact });

  const [local, setLocal] = useState<Status>("completed");
  const status = (phase as Status | undefined) ?? local;
  // The chart type the person chose: the host holds it and reshapes its data.
  const [type, setType] = useState<"bar" | "donut">("bar");
  // How many tables have arrived while thinking.
  const [beat, setBeat] = useState({ status, n: 0 });
  if (beat.status !== status) setBeat({ status, n: 0 });
  function move(next: Status) {
    setLocal(next);
    onPhaseChange?.(next);
  }

  // The two tables the answer rests on, numbered as the explanation cites them.
  const agingReport = story.sources[3],
    cashForecast = story.sources[4];
  const tables: SourceReference[] = [
    {
      id: agingReport.id,
      number: agingReport.number,
      title: agingReport.title[language],
      description: t(
        `${n(story.overdue.invoices)} فاتورة متأخرة لكل عميل، مع أعمارها.`,
        `${n(story.overdue.invoices)} overdue invoices by customer, with their ages.`,
      ),
    },
    {
      id: cashForecast.id,
      number: cashForecast.number,
      title: cashForecast.title[language],
      description: t(
        `الرصيد النقدي المتوقع حتى ${n(15)} نوفمبر ${story.forecast.condition.ar}.`,
        `The expected cash balance through November ${n(15)}, ${story.forecast.condition.en}.`,
      ),
    },
  ];

  // Thinking finds the tables one by one; a failed run lost the forecast, and
  // an empty period needed only the aging report.
  const found = reduced ? tables.length : Math.min(beat.n, tables.length);
  useEffect(() => {
    if (reduced || status !== "thinking" || beat.n >= tables.length) return;
    const timer = setTimeout(
      () => setBeat((current) => ({ ...current, n: current.n + 1 })),
      arrivalMs,
    );
    return () => clearTimeout(timer);
  }, [status, beat.n, tables.length, reduced]);
  const arrived =
    status === "thinking" ? found : status === "completed" ? tables.length : 1;
  const elapsed =
    status === "thinking"
      ? Math.floor((found * arrivalMs) / 1000)
      : status === "completed"
        ? 3
        : 2;
  const labels = [
    t("قراءة تقرير أعمار الديون", "Read the receivables aging report"),
    t("تجميع المتأخرات حسب العميل", "Group the overdue amount by customer"),
    t(
      "مطابقتها مع توقعات التدفق النقدي",
      "Check it against the cash flow forecast",
    ),
  ];
  const steps = labels
    .slice(0, status === "empty" ? 2 : 3)
    .map((label, index) => ({
      id: `step-${index}`,
      label,
      // Steps are the host's: what the run had done is ticked, the step it was
      // on is running, and a failed run never ticks the step it lost.
      state:
        status === "thinking"
          ? index < found
            ? ("completed" as const)
            : index === found
              ? ("running" as const)
              : ("pending" as const)
          : status === "completed" || index < 2
            ? ("completed" as const)
            : ("pending" as const),
    }));

  // The overdue amount by customer: the three largest, and the rest of it.
  const customers = [
    ...story.customers.map((customer) => ({
      key: customer.id,
      label: shortNames[customer.id][ar ? 0 : 1],
      value: customer.amount,
    })),
    {
      key: "others",
      label: t("عملاء آخرون", "Other customers"),
      value: story.overdue.amount - story.overdue.largest.amount,
    },
  ];
  const [first, second, third, others] = customers;
  const summary = t(
    `${first.label} ${sar(first.value)}، ${second.label} ${sar(second.value)}، ${third.label} ${sar(third.value)}، و${others.label} ${sar(others.value)} من أصل ${sar(story.overdue.amount)}.`,
    `${first.label} ${sar(first.value)}, ${second.label} ${sar(second.value)}, ${third.label} ${sar(third.value)} and ${others.label.toLowerCase()} ${sar(others.value)}, of ${sar(story.overdue.amount)} overdue.`,
  );
  // The host reshapes the same figures for each type it offers.
  const shared = {
    summary,
    locale: language,
    height: 220,
    numberFormat: { maximumFractionDigits: 0 },
  };
  const charts: Record<"bar" | "donut", DataAnswerChart> = {
    bar: {
      type: "bar",
      props: {
        ...shared,
        label: t("المبلغ المتأخر حسب العميل", "Overdue amount by customer"),
        data: customers.map(({ label, value }) => ({
          category: label,
          overdue: value,
        })),
        series: [
          {
            key: "overdue",
            label: t("المبلغ المتأخر (ر.س)", "Overdue amount (SAR)"),
          },
        ],
      },
    },
    donut: {
      type: "donut",
      props: {
        ...shared,
        label: t(
          "حصة كل عميل من المبلغ المتأخر",
          "Each customer's share of the overdue amount",
        ),
        data: customers,
        legend: true,
        interactiveLegend: false,
      },
    },
  };

  // Each marker follows its period: a line can break before punctuation that
  // comes after a chip, which would start a line with a lone period.
  const explanation = t(
    `مدار والندى والرواد وحدهم يمثّلون ${percent(story.overdue.largest.share)} من المتأخرات البالغة ${sar(story.overdue.amount)}. [4] وإذا سدّدوا فقد يعود النقد إلى نحو ${sar(story.forecast.cash, true)} بحلول ${n(15)} نوفمبر. [5]`,
    `Madar, Al Nada and Al Rowad alone make up ${percent(story.overdue.largest.share)} of the ${sar(story.overdue.amount)} overdue. [4] If they pay, cash could return to about ${sar(story.forecast.cash, true)} by November ${n(15)}. [5]`,
  );
  const filters = t("الفواتير المتأخرة فقط", "Overdue invoices only");
  const empty = status === "empty";

  return (
    <DataAnswer
      agentPresentation={getAgentPresentation?.(status)}
      status={status}
      question={
        empty
          ? t(
              "كيف يتوزّع المبلغ المتأخر على العملاء في نوفمبر؟",
              "How is the overdue amount split across customers in November?",
            )
          : t(
              "كيف يتوزّع المبلغ المتأخر على العملاء؟",
              "How is the overdue amount split across customers?",
            )
      }
      chart={status === "completed" ? charts[type] : undefined}
      explanation={status === "completed" ? explanation : undefined}
      sources={
        status === "completed" ? tables : empty ? tables.slice(0, 1) : undefined
      }
      method={
        status === "completed"
          ? {
              range: t(
                `حتى ${n(18)} أكتوبر ${year}`,
                `Through October ${n(18)}, ${year}`,
              ),
              filters,
            }
          : empty
            ? {
                range: t(`نوفمبر ${year}`, `November ${year}`),
                filters,
              }
            : undefined
      }
      thinking={{
        // Seconds, updated at most once a second.
        elapsed,
        searched: tables.slice(0, arrived),
        steps,
      }}
      chartTypes={["bar", "donut"]}
      onChartTypeChange={(next) => setType(next === "donut" ? "donut" : "bar")}
      // Pin the chart to your dashboard.
      onPin={() => {}}
      // Open the rows behind the chart in your table.
      onOpenTable={() => {}}
      onCopy={(text) => navigator.clipboard.writeText(text)}
      onRetry={() => move("thinking")}
      error={t(
        "انقطع الاتصال بتوقعات التدفق النقدي قبل اكتمال الإجابة.",
        "The connection to the cash flow forecast dropped before the answer was done.",
      )}
      appearance={appearance}
    />
  );
}
