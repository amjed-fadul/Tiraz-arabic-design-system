import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import {
  ChartExample,
  AnalyticsExample,
} from "../system/ai/examples/ChartExamples";
import { SystemProvider, defaultConfig } from "../system";

it("uses the plotted Cartesian data for the missing-values summary", () => {
  render(
    <SystemProvider>
      <ChartExample language="en" sample="gaps" kind="line" />
    </SystemProvider>,
  );
  expect(
    screen.getByText(/Sample data, October 2026: 1,642 orders/),
  ).toBeVisible();
});
it("changes both rows and total when the application selects a period", async () => {
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <AnalyticsExample language="en" />
    </SystemProvider>,
  );
  const user = userEvent.setup();
  expect(
    screen.getByText("1,790 orders in the selected period.", {
      selector: ".tz-analytics-total",
    }),
  ).toBeVisible();
  await user.click(screen.getByRole("combobox", { name: "Period" }));
  await user.click(screen.getByRole("option", { name: "October 4–6" }));
  expect(
    screen.getByText("1,052 orders in the selected period.", {
      selector: ".tz-analytics-total",
    }),
  ).toBeVisible();
  const trend = within(screen.getByRole("region", { name: "Daily orders" }));
  await user.click(trend.getByText("Show data table"));
  expect(trend.getAllByRole("row")).toHaveLength(4);
  expect(trend.queryByText("Oct 1")).not.toBeInTheDocument();
});
it("keeps chart inspectors compact and copied prompts consistent with the current examples", async () => {
  render(<Workbench />);
  const user = userEvent.setup(),
    write = vi.spyOn(navigator.clipboard, "writeText");
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  for (const name of [
    "الرسم الخطي",
    "الرسم المساحي",
    "الرسم العمودي",
    "الرسم الحلقي",
  ]) {
    await user.click(nav.getByRole("button", { name }));
    const rail = within(screen.getByRole("complementary", { name: "التخصيص" }));
    expect(rail.getByLabelText("بيانات المثال")).toBeVisible();
    expect(rail.queryByText("خطوط الشبكة") !== null).toBe(
      name !== "الرسم الحلقي",
    );
    await user.click(screen.getByRole("button", { name: "نسخ الكود" }));
    const code = write.mock.calls.at(-1)![0];
    await user.click(screen.getByRole("button", { name: "نسخ الطلب" }));
    expect(write.mock.calls.at(-1)![0]).toContain(code);
    expect(code).toContain("AnalyticsExample");
  }
});
