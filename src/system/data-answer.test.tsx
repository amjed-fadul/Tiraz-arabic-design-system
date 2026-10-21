import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DataAnswer } from "./index";
import type {
  DataAnswerChart,
  DataAnswerProps,
  SourceReference,
} from "./index";

const question = "كيف يتوزّع المبلغ المتأخر على العملاء؟";
// The two tables the answer rests on, numbered as the explanation cites them.
const tables: SourceReference[] = [
  {
    id: "aging-report",
    number: 4,
    title: "تقرير أعمار الديون",
    description: "الفواتير المتأخرة لكل عميل.",
  },
  { id: "cash-forecast", number: 5, title: "توقعات التدفق النقدي" },
];
const explanation =
  "مدار والندى والرواد وحدهم يمثّلون ٧٢٪ من المتأخرات البالغة ٤٨٬٣٠٠ ر.س [4]. وإذا سدّدوا فقد يعود النقد إلى نحو ٧٤٠ ألف ر.س بحلول ١٥ نوفمبر [5].";
const method = {
  range: "حتى ١٨ أكتوبر ٢٠٢٦",
  filters: "الفواتير المتأخرة فقط",
};
const customers = [
  { key: "madar", label: "مدار", value: 15600 },
  { key: "al-nada", label: "الندى", value: 11200 },
  { key: "al-rowad", label: "الرواد", value: 8000 },
  { key: "others", label: "عملاء آخرون", value: 13500 },
];
// Each type has its own data and name, as a host reshapes them.
const bar: DataAnswerChart = {
  type: "bar",
  props: {
    label: "المبلغ المتأخر لكل عميل",
    summary: "مدار ١٥٬٦٠٠ ر.س، الندى ١١٬٢٠٠ ر.س، الرواد ٨٬٠٠٠ ر.س.",
    data: customers.map(({ label, value }) => ({
      category: label,
      overdue: value,
    })),
    series: [{ key: "overdue", label: "المبلغ المتأخر" }],
  },
};
const donut: DataAnswerChart = {
  type: "donut",
  props: {
    label: "حصة كل عميل من المبلغ المتأخر",
    summary: "مدار ١٥٬٦٠٠ ر.س، الندى ١١٬٢٠٠ ر.س، الرواد ٨٬٠٠٠ ر.س.",
    data: customers,
  },
};
const thinking = {
  elapsed: 3,
  searched: tables,
  steps: [
    { id: "read", label: "قراءة تقرير أعمار الديون", state: "completed" },
    { id: "group", label: "تجميع المتأخرات حسب العميل", state: "running" },
  ] as const,
};
function answer(
  status: DataAnswerProps["status"],
  extra: Partial<DataAnswerProps> = {},
) {
  return (
    <DataAnswer
      status={status}
      question={question}
      chart={bar}
      explanation={explanation}
      sources={tables}
      method={method}
      {...extra}
    />
  );
}
const section = () => screen.getByRole("region", { name: question });
const region = () =>
  document.querySelector(".tz-data-answer > [role='status']") as HTMLElement;

it("announces each status once and shows the empty and failed states", async () => {
  const user = userEvent.setup(),
    onRetry = vi.fn();
  // Only the pattern's own region speaks: the panel and the chart are silent.
  const quiet = () =>
    expect(section().querySelectorAll("[role='status']")).toHaveLength(1);
  // An answer that mounts finished is not news.
  const view = render(answer("completed"));
  expect(region()).toBeEmptyDOMElement();
  quiet();
  view.rerender(answer("thinking", { thinking }));
  expect(region().textContent).toBe("يفكّر");
  quiet();
  view.rerender(answer("completed", { thinking }));
  expect(region().textContent).toBe("اكتملت الإجابة");
  quiet();
  // A status that holds is never said again.
  region().textContent = "";
  view.rerender(answer("completed", { thinking: { ...thinking, elapsed: 4 } }));
  expect(region()).toBeEmptyDOMElement();
  view.rerender(
    answer("failed", {
      thinking,
      error: "انقطع الاتصال بتوقعات التدفق النقدي.",
      onRetry,
    }),
  );
  expect(region().textContent).toBe("تعذّر إكمال الإجابة");
  quiet();
  // The error stays as text, with the retry beside it.
  expect(
    screen.getByText("انقطع الاتصال بتوقعات التدفق النقدي."),
  ).toBeVisible();
  const retry = screen.getByRole("button", { name: "أعد المحاولة" });
  retry.focus();
  await user.keyboard("{Enter}");
  expect(onRetry).toHaveBeenCalledTimes(1);
  // The host starts over; the button that held focus is gone, so the section
  // takes it.
  view.rerender(answer("thinking", { thinking }));
  expect(region().textContent).toBe("يفكّر");
  expect(section()).toHaveFocus();
  view.rerender(answer("empty", { thinking }));
  expect(region().textContent).toBe("لا توجد بيانات لهذه الفترة");
  quiet();
  // The sentence is also the empty state's text, and no chart stands in for it.
  expect(
    screen.getByText("لا توجد بيانات لهذه الفترة", { selector: "p" }),
  ).toBeVisible();
  expect(screen.queryByRole("region", { name: bar.props.label })).toBeNull();
});

it("switches chart type only through the host", async () => {
  const user = userEvent.setup(),
    onChartTypeChange = vi.fn(),
    onPin = vi.fn(),
    onOpenTable = vi.fn();
  const picking = (
    current: DataAnswerChart,
    extra: Partial<DataAnswerProps> = {},
  ) =>
    answer("completed", {
      chart: current,
      chartTypes: ["bar", "donut"],
      onChartTypeChange,
      ...extra,
    });
  const radio = (name: string) => screen.getByRole("radio", { name });
  const view = render(picking(bar));
  const group = screen.getByRole("radiogroup", { name: "نوع الرسم" });
  expect(within(group).getAllByRole("radio")).toHaveLength(2);
  expect(radio("أعمدة")).toBeChecked();
  expect(radio("حلقي")).not.toBeChecked();
  await user.click(radio("حلقي"));
  expect(onChartTypeChange).toHaveBeenCalledTimes(1);
  expect(onChartTypeChange).toHaveBeenLastCalledWith("donut");
  // The pattern changes nothing itself: the bar stays until the host says.
  expect(radio("أعمدة")).toBeChecked();
  expect(radio("حلقي")).not.toBeChecked();
  expect(screen.getByRole("region", { name: bar.props.label })).toBeVisible();
  view.rerender(picking(donut));
  expect(radio("حلقي")).toBeChecked();
  expect(radio("أعمدة")).not.toBeChecked();
  expect(screen.getByRole("region", { name: donut.props.label })).toBeVisible();
  expect(screen.queryByRole("region", { name: bar.props.label })).toBeNull();
  // One type has nothing to switch to, and without a handler nothing could.
  view.rerender(picking(bar, { chartTypes: ["bar"] }));
  expect(screen.queryByRole("radiogroup")).toBeNull();
  view.rerender(picking(bar, { onChartTypeChange: undefined }));
  expect(screen.queryByRole("radiogroup")).toBeNull();
  // Pin and Open in a table each need their own handler.
  const pin = () => screen.queryByRole("button", { name: "ثبّت في اللوحة" });
  const open = () => screen.queryByRole("button", { name: "افتح في جدول" });
  expect(pin()).toBeNull();
  expect(open()).toBeNull();
  view.rerender(answer("completed", { onPin, onOpenTable }));
  await user.click(open()!);
  expect(onOpenTable).toHaveBeenCalledTimes(1);
  await user.click(pin()!);
  expect(onPin).toHaveBeenCalledTimes(1);
});

it("folds how it was calculated into a definition list", async () => {
  const user = userEvent.setup();
  const view = render(answer("completed"));
  const trigger = () => screen.getByRole("button", { name: "كيف حُسب هذا؟" });
  expect(trigger()).toHaveAttribute("aria-expanded", "false");
  const panel = document.getElementById(
    trigger().getAttribute("aria-controls")!,
  )!;
  expect(panel).toHaveAttribute("hidden");
  expect(panel).toHaveAttribute("inert");
  await user.click(trigger());
  expect(trigger()).toHaveAttribute("aria-expanded", "true");
  const entries = () => [
    within(panel)
      .getAllByRole("term")
      .map((term) => term.textContent),
    within(panel).getAllByRole("definition"),
  ];
  let [terms, definitions] = entries();
  expect(terms).toEqual(["الفترة", "التصفية", "الجداول"]);
  expect(definitions[0]).toHaveTextContent("حتى ١٨ أكتوبر ٢٠٢٦");
  expect(definitions[1]).toHaveTextContent("الفواتير المتأخرة فقط");
  expect(definitions[2]).toHaveTextContent("تقرير أعمار الديون");
  expect(definitions[2]).toHaveTextContent("توقعات التدفق النقدي");
  // No filters says so in words.
  view.rerender(answer("completed", { method: { range: method.range } }));
  [terms, definitions] = entries();
  expect(terms).toEqual(["الفترة", "التصفية", "الجداول"]);
  expect(definitions[1]).toHaveTextContent("بلا تصفية");
  // It explains a finished answer, an empty period included, and nothing else.
  view.rerender(answer("empty"));
  expect(trigger()).toBeVisible();
  for (const status of ["thinking", "failed"] as const) {
    view.rerender(answer(status, { thinking }));
    expect(screen.queryByRole("button", { name: "كيف حُسب هذا؟" })).toBeNull();
  }
});

it("copies the explanation with its method and numbered tables", async () => {
  const user = userEvent.setup(),
    onCopy = vi.fn();
  render(answer("completed", { onCopy }));
  await user.click(screen.getByRole("button", { name: "نسخ الإجابة" }));
  // The text as written, how it was calculated, then each table by its number.
  expect(onCopy).toHaveBeenCalledTimes(1);
  expect(onCopy).toHaveBeenLastCalledWith(
    `${explanation}\n\nكيف حُسب هذا؟\nالفترة: حتى ١٨ أكتوبر ٢٠٢٦\nالتصفية: الفواتير المتأخرة فقط\n\nالمصادر\n٤. تقرير أعمار الديون\n٥. توقعات التدفق النقدي`,
  );
});
