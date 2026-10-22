import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ChangeSummary } from "./index";
import type { ChangeSummaryProps, SourceReference } from "./index";

type Row = ChangeSummaryProps["rows"][number];
const rows: Row[] = [
  {
    id: "flow",
    metric: "صافي التدفق النقدي",
    change: "١٨٪ عن سبتمبر",
    direction: "down",
    tone: "bad",
    series: [100, 96, 94, 88, 82],
  },
  {
    id: "dso",
    metric: "متوسط فترة التحصيل",
    change: "من ٣٤ إلى ٤٧ يومًا",
    direction: "up",
    tone: "bad",
    series: [34, 35, 38, 43, 47],
  },
  {
    id: "revenue",
    metric: "إجمالي الإيرادات",
    change: "٦٫١٪",
    direction: "up",
    tone: "good",
  },
  {
    id: "staff",
    metric: "عدد الموظفين",
    change: "دون تغيير",
    direction: "flat",
    tone: "neutral",
  },
];
const sources: SourceReference[] = [
  { id: "aging", number: 4, title: "تقرير أعمار الديون" },
  { id: "bank", number: 3, title: "كشف البنك الأهلي" },
];
function summary(
  status: ChangeSummaryProps["status"],
  extra: Partial<ChangeSummaryProps> = {},
) {
  return (
    <ChangeSummary
      status={status}
      title="ما الذي تغيّر"
      rows={rows}
      reason="تأخّر ثلاثة عملاء في السداد."
      sources={sources}
      basedOn="اعتمادًا على ٣ تقارير"
      updated="حُدّث قبل ٥ د"
      {...extra}
    />
  );
}
const section = () => screen.getByRole("region", { name: "ما الذي تغيّر" });
const region = () =>
  document.querySelector(".tz-change-summary > [role='status']") as HTMLElement;

it("gives each row a direction word and a tone, without signs", () => {
  const { container } = render(summary("ready"));
  const badges = Array.from(
    container.querySelectorAll<HTMLElement>(".tz-change-summary-badge"),
  );
  expect(
    badges.map((badge) => [
      badge.getAttribute("data-tone"),
      badge.getAttribute("data-direction"),
      badge.querySelector(".tz-visually-hidden")?.textContent,
    ]),
  ).toEqual([
    ["bad", "down", "انخفض"],
    ["bad", "up", "ارتفع"],
    ["good", "up", "ارتفع"],
    ["neutral", "flat", "ثابت"],
  ]);
  // The arrow says which way, the color what it means: no sign beside digits.
  for (const badge of badges) {
    expect(badge.textContent).not.toMatch(/[+−-]/);
    expect(badge.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  }
  expect(badges[1]).toHaveTextContent("ارتفع");
  expect(badges[1]).toHaveTextContent("من ٣٤ إلى ٤٧ يومًا");
});

it("draws sparklines left to right in RTL", () => {
  const { container } = render(summary("ready"));
  const sparks = container.querySelectorAll("svg.tz-change-summary-spark");
  // Only the rows with a series draw one, and the drawing is decoration.
  expect(sparks).toHaveLength(2);
  for (const spark of sparks)
    expect(spark).toHaveAttribute("aria-hidden", "true");
  const numbers = (spark: Element) =>
    (
      spark
        .querySelector("path")!
        .getAttribute("d")!
        .match(/-?\d+(?:\.\d+)?/g) ?? []
    ).map(Number);
  // The first point is at x = 0, each next one is further right, and the
  // emphasized endpoint sits on the last.
  const points = numbers(sparks[0]);
  const xs = points.filter((_, index) => index % 2 === 0),
    ys = points.filter((_, index) => index % 2 === 1);
  expect(xs[0]).toBe(0);
  expect(xs).toHaveLength(5);
  for (let index = 1; index < xs.length; index += 1)
    expect(xs[index]).toBeGreaterThan(xs[index - 1]);
  // series[0] is the highest value here, so its point is the highest drawn
  // (the smallest y), and the last is the lowest.
  expect(ys[0]).toBe(Math.min(...ys));
  expect(ys[4]).toBe(Math.max(...ys));
  const end = sparks[0].querySelector("circle")!;
  expect(Number(end.getAttribute("cx"))).toBe(xs[4]);
  expect(Number(end.getAttribute("cy"))).toBe(ys[4]);
});

it("shows updating, stale with Refresh, and failed, announcing each once", () => {
  const onRefresh = vi.fn();
  const view = render(summary("ready", { onRefresh }));
  // A summary that mounts ready is not news; «أعدّه المساعد» marks it.
  expect(region()).toBeEmptyDOMElement();
  expect(within(section()).getByText("أعدّه المساعد")).toBeVisible();
  expect(section().querySelector(".tz-status-pill")).toBeNull();
  expect(section().querySelectorAll("[role='status']")).toHaveLength(1);
  const seen = new MutationObserver(() => {});
  seen.observe(region(), {
    childList: true,
    characterData: true,
    subtree: true,
  });
  const heard = () => seen.takeRecords().length;
  // Updating: rows become skeleton lines, the pill says يحدّث and the footer
  // says so too.
  view.rerender(summary("updating", { onRefresh }));
  expect(region().textContent).toBe("يحدّث الملخص");
  expect(heard()).toBe(1);
  const pill = section().querySelector(".tz-status-pill")!;
  expect(pill).toHaveAttribute("data-state", "running");
  expect(pill).toHaveTextContent("يحدّث");
  expect(section()).toHaveTextContent("يحدّث الملخص…");
  expect(section().querySelectorAll(".tz-skeleton").length).toBeGreaterThan(0);
  expect(screen.queryByText("صافي التدفق النقدي")).toBeNull();
  expect(within(section()).queryByText("أعدّه المساعد")).toBeNull();
  // The same status again is not announced again.
  view.rerender(summary("updating", { onRefresh, updated: "حُدّث الآن" }));
  expect(heard()).toBe(0);
  view.rerender(summary("ready", { onRefresh }));
  expect(region().textContent).toBe("الملخص جاهز");
  expect(heard()).toBe(1);
  expect(screen.getByText("صافي التدفق النقدي")).toBeVisible();
  expect(section()).toHaveTextContent("اعتمادًا على ٣ تقارير");
  expect(section()).toHaveTextContent("حُدّث قبل ٥ د");
  // Stale: a neutral line and Refresh, which asks the host.
  view.rerender(summary("stale", { onRefresh }));
  expect(region().textContent).toBe("قد يكون الملخص قديمًا");
  expect(heard()).toBe(1);
  expect(within(section()).getByText("أعدّه المساعد")).toBeVisible();
  const refresh = screen.getByRole("button", { name: "تحديث" });
  refresh.focus();
  fireEvent.click(refresh);
  expect(onRefresh).toHaveBeenCalledTimes(1);
  // The host starts updating; the button that held focus is gone, so the
  // section takes it.
  view.rerender(summary("updating", { onRefresh }));
  expect(heard()).toBe(1);
  expect(section()).toHaveFocus();
  // Failed: the pill says تعثّر, the failure stays as text, and Try again
  // asks the host.
  view.rerender(summary("failed", { onRefresh }));
  expect(region().textContent).toBe("تعذّر تحديث الملخص");
  expect(heard()).toBe(1);
  expect(section().querySelector(".tz-status-pill")).toHaveTextContent("تعثّر");
  expect(section()).toHaveTextContent("تعذّر تحديث الملخص.");
  fireEvent.click(screen.getByRole("button", { name: "أعد المحاولة" }));
  expect(onRefresh).toHaveBeenCalledTimes(2);
  seen.disconnect();
});

it("shows at most six rows", () => {
  const many: Row[] = Array.from({ length: 8 }, (_, index) => ({
    id: `row-${index}`,
    metric: `المؤشر ${index + 1}`,
    change: "دون تغيير",
    direction: "flat",
    tone: "neutral",
  }));
  const { container } = render(summary("ready", { rows: many }));
  expect(container.querySelectorAll(".tz-change-summary-row")).toHaveLength(6);
  expect(screen.getByText("المؤشر 6")).toBeVisible();
  expect(screen.queryByText("المؤشر 7")).toBeNull();
});
