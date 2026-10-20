import { useEffect, useRef, useState } from "react";
import { ChangeSummary, numberLocale, useSystem } from "../../index";
import type { ChangeSummaryProps, SourceReference } from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Status = ChangeSummaryProps["status"];

export function ChangeSummaryExample({
  language = "ar",
  appearance = "card",
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: "card" | "plain";
  /**
   * "updating", "ready" or "stale", held as given. Refresh moves the summary to
   * updating, and the host finishes it a moment later. Without a phase the
   * summary rests on ready.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem();
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

  const [local, setLocal] = useState<Status>("ready");
  const status = (phase as Status | undefined) ?? local;
  const finish = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(finish.current), []);
  function move(next: Status) {
    setLocal(next);
    onPhaseChange?.(next);
  }

  // The three reports the reason rests on, from the shared story.
  const [invoices, aging, statement] = [
    "customer-invoices",
    "aging-report",
    "al-ahli-statement",
  ].map((id) => story.sources.find((source) => source.id === id)!);
  const sources: SourceReference[] = [invoices, statement, aging].map(
    (source) => ({
      id: source.id,
      number: source.number,
      title: source.title[language],
      href: `#${source.id}`,
    }),
  );
  const rows: ChangeSummaryProps["rows"] = [
    {
      id: "cash-flow",
      metric: t("صافي التدفق النقدي", "Net cash flow"),
      change: t(
        `${percent(-story.cash.netFlowChange)} عن سبتمبر`,
        `${percent(-story.cash.netFlowChange)} below September`,
      ),
      direction: "down",
      tone: "bad",
      series: [100, 97, 95, 90, 82],
    },
    {
      id: "dso",
      metric: t("متوسط فترة التحصيل", "Days to collect"),
      change: t(
        `من ${n(story.dso.from)} إلى ${n(story.dso.to)} يومًا`,
        `from ${n(story.dso.from)} to ${n(story.dso.to)} days`,
      ),
      direction: "up",
      tone: "bad",
      series: [34, 35, 38, 43, 47],
    },
    {
      id: "overdue",
      metric: t("عدد الفواتير المتأخرة", "Overdue invoices"),
      change: t(
        `${n(story.overdue.invoices)} فاتورة · ${sar(story.overdue.amount)}`,
        `${n(story.overdue.invoices)} invoices · ${sar(story.overdue.amount)}`,
      ),
      direction: "up",
      tone: "bad",
      series: [4, 5, 7, 9, 12],
    },
    {
      id: "revenue",
      metric: t("إجمالي الإيرادات", "Total revenue"),
      change: t(
        `${percent(story.revenue.change)} ليبلغ ${sar(story.revenue.amount, true)}`,
        `${percent(story.revenue.change)} to ${sar(story.revenue.amount, true)}`,
      ),
      direction: "up",
      tone: "good",
      series: [1.12, 1.15, 1.17, 1.2, 1.24],
    },
  ];

  return (
    <ChangeSummary
      status={status}
      title={t(
        `ما الذي تغيّر · ${n(12)}–${n(18)} ${story.period.month.ar}`,
        `What changed · ${story.period.month.en} ${n(12)}–${n(18)}`,
      )}
      rows={rows}
      reason={t(
        `تأخّر ثلاثة عملاء كبار في السداد (${sar(story.overdue.largest.amount)}، أي ${percent(story.overdue.largest.share)} من المتأخرات)، ودُفعت ${sar(story.earlyPayment.amount)} إلى ${story.earlyPayment.supplier.ar} قبل موعدها بـ ${n(21)} يومًا.`,
        `Three large customers paid late (${sar(story.overdue.largest.amount)}, ${percent(story.overdue.largest.share)} of the overdue amount), and ${sar(story.earlyPayment.amount)} went to ${story.earlyPayment.supplier.en} ${n(21)} days before it was due.`,
      )}
      sources={sources}
      basedOn={t(`اعتمادًا على ${n(3)} تقارير`, `Based on ${n(3)} reports`)}
      updated={t(`حُدّث قبل ${n(5)} د`, `Updated ${n(5)} min ago`)}
      actions={[
        {
          id: "reminders",
          label: t("أرسل تذكيرات السداد", "Send payment reminders"),
          primary: true,
          // Start the reminders in your own flow.
          onSelect: () => {},
        },
        {
          id: "aging",
          label: t("افتح تقرير أعمار الديون", "Open the aging report"),
          // Open the report in your own view.
          onSelect: () => {},
        },
      ]}
      onRefresh={() => {
        move("updating");
        clearTimeout(finish.current);
        finish.current = setTimeout(() => move("ready"), 1400);
      }}
      appearance={appearance}
    />
  );
}
