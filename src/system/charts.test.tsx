import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { LineChart, AreaChart, BarChart, DonutChart } from "./Charts";
import { chartNumber, chartCategory, chartValue } from "./chart-format";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";

// JSDOM has no layout; deliver the measured size through Recharts' real observer API.
beforeAll(() =>
  vi.stubGlobal(
    "ResizeObserver",
    class {
      callback: (entries: unknown[]) => void;
      constructor(callback: (entries: unknown[]) => void) {
        this.callback = callback;
      }
      observe(target: Element) {
        this.callback([{ target, contentRect: { width: 600, height: 240 } }]);
      }
      unobserve() {}
      disconnect() {}
    },
  ),
);
afterAll(() => vi.unstubAllGlobals());

const series = [
  { key: "sales", label: "المبيعات" },
  { key: "returns", label: "Returns" },
];
const data = [
  { category: "2026-01-01", sales: 0, returns: 20 },
  { category: "2026-01-02", sales: null, returns: 30 },
];
describe("chart formatting", () => {
  it("formats Arabic and English numbers including zero, and never invents missing zeros", () => {
    expect(chartNumber(1234.5, "ar")).toBe(
      new Intl.NumberFormat("ar-u-nu-arab").format(1234.5),
    );
    expect(chartNumber(0, "en")).toBe("0");
    for (const value of [null, undefined, NaN, Infinity, "4"])
      expect(chartValue(value)).toBeNull();
    expect(chartValue(-4)).toBe(-4);
  });
  it("formats ISO dates in UTC and preserves text categories", () => {
    expect(chartCategory("2026-01-01", "en", "date")).toBe("Jan 1");
    expect(chartCategory("فئة طويلة ABC-24", "ar", "text")).toBe(
      "فئة طويلة ABC-24",
    );
    expect(chartCategory("invalid", "en", "date")).toBe("invalid");
  });
});
for (const Chart of [LineChart, AreaChart, BarChart]) {
  it(`${Chart.name} exposes name, summary, real zeros and missing cells in a semantic table`, async () => {
    render(
      <SystemProvider>
        <Chart
          label="الطلبات"
          summary="بيانات تجريبية، يومان."
          data={data}
          series={series}
          categoryFormat="date"
          dataTable
        />
      </SystemProvider>,
    );
    expect(
      screen.getByRole("region", { name: "الطلبات" }),
    ).toHaveAccessibleDescription("بيانات تجريبية، يومان.");
    await userEvent.click(screen.getByText("عرض جدول البيانات"));
    const table = screen.getByRole("table");
    expect(
      within(table).getByText(new Intl.NumberFormat("ar-u-nu-arab").format(0)),
    ).toBeVisible();
    expect(within(table).getByText("غير متاح")).toBeVisible();
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
  });
}
it("legend toggles with keyboard, handles all hidden and keeps the semantic data available", async () => {
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <LineChart
        label="Orders"
        summary="Two days"
        data={data}
        series={series}
        legend
        dataTable
      />
    </SystemProvider>,
  );
  const buttons = screen.getAllByRole("button", { pressed: true });
  buttons[0].focus();
  await userEvent.keyboard("{Enter}");
  expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
  buttons[1].focus();
  await userEvent.keyboard(" ");
  expect(
    screen.getByText(
      "All series are hidden. Select a legend item to show data.",
    ),
  ).toBeVisible();
  await userEvent.click(screen.getByText("Show data table"));
  expect(screen.getByRole("table")).toBeVisible();
  await userEvent.click(buttons[0]);
  expect(
    screen.queryByText(
      "All series are hidden. Select a legend item to show data.",
    ),
  ).not.toBeInTheDocument();
});
it("donut preserves zero/missing/negative values in the table and shows no fabricated segments", async () => {
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <DonutChart
        label="Channels"
        summary="No positive values"
        data={[
          { key: "web", label: "Web", value: 0 },
          { key: "store", label: "Store", value: null },
          { key: "refund", label: "Refund", value: -4 },
        ]}
        dataTable
      />
    </SystemProvider>,
  );
  expect(screen.getByText("No positive values to display.")).toBeVisible();
  await userEvent.click(screen.getByText("Show data table"));
  expect(within(screen.getByRole("table")).getByText("0")).toBeVisible();
  expect(within(screen.getByRole("table")).getByText("-4")).toBeVisible();
  expect(
    within(screen.getByRole("table")).getByText("Not available"),
  ).toBeVisible();
});
it("empty charts explain the absence of data", () => {
  render(
    <SystemProvider>
      <AreaChart
        label="زيارات"
        summary="لا توجد زيارات"
        data={[]}
        series={series}
      />
    </SystemProvider>,
  );
  expect(screen.getByText("لا توجد بيانات للعرض.")).toBeVisible();
});

it("keeps a Cartesian tooltip correct when application rows also contain key and label", async () => {
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <LineChart
        label="Trend"
        summary="One sample"
        data={[
          {
            category: "January",
            key: "record-1",
            label: "Application row",
            sales: 7,
          },
        ]}
        series={[{ key: "sales", label: "Sales" }]}
      />
    </SystemProvider>,
  );
  screen.getByRole("application").focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(
    await screen.findByText("January", { selector: ".tz-chart-tooltip bdi" }),
  ).toBeVisible();
  expect(
    screen.getByText("Sales", { selector: ".tz-chart-tooltip bdi" }),
  ).toBeVisible();
  expect(
    screen.getByText("7", { selector: ".tz-chart-tooltip bdi" }),
  ).toBeVisible();
});

it("keeps series colors stable while toggled and updates the default palette when accent changes", async () => {
  const props = {
    label: "Orders",
    summary: "Two days",
    data,
    series,
    legend: true,
  };
  const { container, rerender } = render(
    <SystemProvider>
      <LineChart {...props} />
    </SystemProvider>,
  );
  const color = () =>
    container
      .querySelectorAll(".recharts-line-curve")[1]
      .getAttribute("stroke");
  expect(color()).toBe("var(--chart-blue)");
  await userEvent.click(screen.getByRole("button", { name: "المبيعات" }));
  expect(
    container.querySelector(".recharts-line-curve")!.getAttribute("stroke"),
  ).toBe("var(--chart-blue)");
  rerender(
    <SystemProvider config={{ ...defaultConfig, accent: "plum" }}>
      <LineChart {...props} />
    </SystemProvider>,
  );
  expect(
    container.querySelector(".recharts-line-curve")!.getAttribute("stroke"),
  ).toBe("var(--chart-sage)");
  expect(screen.getByRole("button", { name: "المبيعات" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
it("keeps a single finite point visible and leaves gaps in a line", () => {
  const { container, rerender } = render(
    <SystemProvider>
      <LineChart
        label="Trend"
        summary="Gap"
        data={[
          { category: "a", sales: 10 },
          { category: "b", sales: null },
          { category: "c", sales: 20 },
        ]}
        series={[series[0]]}
      />
    </SystemProvider>,
  );
  expect(container.querySelectorAll(".recharts-line-dot")).toHaveLength(2);
  // Separate moves, with no fabricated connection across the null value.
  expect(
    container
      .querySelector(".recharts-line-curve")!
      .getAttribute("d")!
      .match(/M/g),
  ).toHaveLength(2);
  rerender(
    <SystemProvider>
      <LineChart
        label="Trend"
        summary="Point"
        data={[{ category: "a", sales: 0 }]}
        series={[series[0]]}
      />
    </SystemProvider>,
  );
  expect(container.querySelectorAll(".recharts-line-dot")).toHaveLength(1);
});
it("formats explicit locale independently of direction and supports value formatting options", async () => {
  render(
    <SystemProvider>
      <BarChart
        label="Revenue"
        summary="One day"
        locale="en"
        numberFormat={{ style: "currency", currency: "USD" }}
        data={[{ category: "Day", sales: 1234.5 }]}
        series={[series[0]]}
        dataTable
      />
    </SystemProvider>,
  );
  await userEvent.click(screen.getByText("Show data table"));
  expect(
    within(screen.getByRole("table")).getByText("$1,234.50"),
  ).toBeVisible();
});

it("renders an opaque accent marker for a single Area point", () => {
  const { container } = render(
    <SystemProvider>
      <AreaChart
        label="Point"
        summary="One value"
        data={[{ category: "a", sales: 0 }]}
        series={[series[0]]}
      />
    </SystemProvider>,
  );
  const dot = container.querySelector(".recharts-area-dot");
  expect(dot).not.toBeNull();
  expect(dot).toHaveAttribute("fill", "var(--action)");
  expect(dot).toHaveAttribute("fill-opacity", "1");
});

it("restores plot access when interactive legend controls are removed", async () => {
  const props = {
    label: "Orders",
    summary: "Two days",
    data,
    series,
    legend: true,
  };
  const { rerender } = render(
    <SystemProvider>
      <LineChart {...props} />
    </SystemProvider>,
  );
  for (const button of screen.getAllByRole("button", { pressed: true }))
    await userEvent.click(button);
  expect(screen.queryByRole("application")).not.toBeInTheDocument();
  rerender(
    <SystemProvider>
      <LineChart {...props} legend={false} />
    </SystemProvider>,
  );
  expect(screen.getByRole("application")).toBeInTheDocument();
  rerender(
    <SystemProvider>
      <LineChart {...props} interactiveLegend={false} />
    </SystemProvider>,
  );
  expect(screen.getByRole("application")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("explains a visible series with only missing values after filtering the legend", async () => {
  render(
    <SystemProvider>
      <LineChart
        label="Orders"
        summary="One category"
        data={[{ category: "a", sales: 5, returns: null }]}
        series={series}
        legend
      />
    </SystemProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "المبيعات" }));
  expect(screen.getByText("لا توجد بيانات للعرض.")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Returns" }));
  expect(
    screen.getByText("كل السلاسل مخفية. اختر عنصرًا من المفتاح لعرض البيانات."),
  ).toBeVisible();
});

it("renders positive donut segments without React key-spread warnings", () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const { container } = render(
      <SystemProvider>
        <DonutChart
          label="Channels"
          summary="Two values"
          data={[
            { key: "web", label: "Website", value: 4 },
            { key: "store", label: "Store", value: 6 },
          ]}
        />
      </SystemProvider>,
    );
    expect(container.querySelectorAll(".tz-chart-segment")).toHaveLength(2);
    expect(
      error.mock.calls.some((args) =>
        String(args[0]).includes('containing a "key" prop'),
      ),
    ).toBe(false);
  } finally {
    error.mockRestore();
  }
});
