import { useState } from "react";
import { LineChart, AreaChart, BarChart, DonutChart } from "../../Charts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../Card";
import { Field } from "../../Field";
import { Select } from "../../Select";
import { numberLocale } from "../../config";
import { useSystem } from "../../useSystem";
import type { ChartDatum, ChartSeries, DonutDatum } from "../../Charts";
type Language = "ar" | "en";
export type ChartKind = "line" | "area" | "bar" | "donut";
export type ChartSample =
  "single" | "multi" | "gaps" | "point" | "zero" | "empty" | "long";

function chartSample(language: Language, sample: ChartSample) {
  const ar = language === "ar";
  const labels = [ar ? "الموقع" : "Website", ar ? "المتجر" : "Store"];
  const series: ChartSeries[] = [{ key: "web", label: labels[0] }];
  if (sample !== "single" && sample !== "point")
    series.push({ key: "store", label: labels[1] });
  const source: ChartDatum[] = [
    { category: "2026-10-01", web: 120, store: 84 },
    { category: "2026-10-02", web: 184, store: 96 },
    { category: "2026-10-03", web: sample === "gaps" ? null : 148, store: 106 },
    { category: "2026-10-04", web: 220, store: 112 },
    { category: "2026-10-05", web: 192, store: 140 },
    { category: "2026-10-06", web: 260, store: 128 },
  ];
  const data: ChartDatum[] =
    sample === "empty"
      ? []
      : sample === "point"
        ? source.slice(0, 1)
        : source.map((row, index) => ({
            ...row,
            ...(sample === "zero" ? { web: 0, store: 0 } : {}),
            ...(sample === "long"
              ? {
                  category: ar
                    ? `قناة الطلبات الرقمية — الفرع المركزي RUH-${index + 1}`
                    : `Digital orders — central branch RUH-${index + 1}`,
                }
              : {}),
          }));
  const donut: DonutDatum[] =
    sample === "empty"
      ? []
      : series.map((entry, index) => ({
          ...entry,
          label:
            sample === "long"
              ? ar
                ? `طلبات ${entry.label} — الفرع المركزي RUH-${index + 1}`
                : `${entry.label} orders — central branch RUH-${index + 1}`
              : entry.label,
          value:
            sample === "gaps" && index === 1
              ? null
              : sample === "zero"
                ? 0
                : data.reduce(
                    (sum, row) =>
                      sum +
                      (typeof row[entry.key] === "number"
                        ? (row[entry.key] as number)
                        : 0),
                    0,
                  ),
        }));
  return {
    data,
    series,
    donut,
    categoryFormat: sample === "long" ? ("text" as const) : ("date" as const),
  };
}
export function ChartExample({
  language = "ar",
  kind = "line",
  sample = "multi",
  legend = true,
  grid = true,
}: {
  language?: Language;
  kind?: ChartKind;
  sample?: ChartSample;
  legend?: boolean;
  grid?: boolean;
}) {
  const ar = language === "ar",
    values = chartSample(language, sample);
  const locale = numberLocale(useSystem().config, language),
    number = new Intl.NumberFormat(locale);
  const label = ar ? "الطلبات حسب القناة" : "Orders by channel";
  const count = number.format(values.data.length);
  const total = number.format(
    kind === "donut"
      ? values.donut.reduce((sum, entry) => sum + (entry.value ?? 0), 0)
      : values.data.reduce(
          (sum, row) =>
            sum +
            values.series.reduce(
              (subtotal, entry) =>
                subtotal +
                (typeof row[entry.key] === "number"
                  ? (row[entry.key] as number)
                  : 0),
              0,
            ),
          0,
        ),
  );
  const gaps =
    sample === "gaps"
      ? ar
        ? " لم نحسب الأيام التي بلا بيانات."
        : " Days without data are excluded."
      : "";
  const summary = ar
    ? `أكتوبر ${new Intl.NumberFormat(locale, { useGrouping: false }).format(2026)}: ${total} طلبًا خلال ${values.data.length === 1 ? "يوم واحد" : `${count} أيام`}.${gaps}`
    : `October 2026: ${total} orders across ${count} ${values.data.length === 1 ? "day" : "days"}.${gaps}`;
  const props = { label, summary, locale: language, legend, dataTable: true };
  const Renderer =
    kind === "line" ? LineChart : kind === "area" ? AreaChart : BarChart;
  return kind === "donut" ? (
    <DonutChart {...props} data={values.donut} />
  ) : (
    <Renderer
      {...props}
      data={values.data}
      series={values.series}
      categoryFormat={values.categoryFormat}
      grid={grid}
    />
  );
}

/** The selected period changes the plotted rows and the total. */
export function AnalyticsExample({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar",
    [period, setPeriod] = useState("week");
  const number = new Intl.NumberFormat(
    numberLocale(useSystem().config, language),
  );
  const all = chartSample(language, "multi");
  const data = period === "week" ? all.data : all.data.slice(-3);
  const total = data.reduce(
    (sum, row) => sum + (row.web as number) + (row.store as number),
    0,
  );
  const summary = ar
    ? `${number.format(total)} طلبًا في الفترة التي اخترتها.`
    : `${number.format(total)} orders in the selected period.`;
  const donut = all.series.map((entry) => ({
    ...entry,
    value: data.reduce((sum, row) => sum + (row[entry.key] as number), 0),
  }));
  return (
    <Card className="tz-analytics-example">
      <CardHeader>
        <CardTitle>{ar ? "نظرة على الطلبات" : "Orders overview"}</CardTitle>
        <CardDescription>
          {ar ? "متجر مدار · أكتوبر ٢٠٢٦" : "Madar store · October 2026"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="tz-analytics-period">
          <Field label={ar ? "الفترة" : "Period"}>
            {(field) => (
              <Select
                field={field}
                value={period}
                onValueChange={setPeriod}
                options={[
                  { value: "week", label: ar ? "١–٦ أكتوبر" : "October 1–6" },
                  { value: "recent", label: ar ? "٤–٦ أكتوبر" : "October 4–6" },
                ]}
              />
            )}
          </Field>
        </div>
        <p className="tz-analytics-total" role="status" aria-live="polite">
          {summary}
        </p>
        <LineChart
          label={ar ? "الطلبات اليومية" : "Daily orders"}
          summary={summary}
          locale={language}
          data={data}
          series={all.series}
          categoryFormat="date"
          legend
          dataTable
        />
        <DonutChart
          label={ar ? "توزيع القنوات" : "Channel distribution"}
          summary={
            ar
              ? "مجموع الطلبات لكل قناة في الفترة التي اخترتها."
              : "Orders per channel for the selected period."
          }
          locale={language}
          data={donut}
          legend
          dataTable
          height={200}
        />
      </CardContent>
    </Card>
  );
}
