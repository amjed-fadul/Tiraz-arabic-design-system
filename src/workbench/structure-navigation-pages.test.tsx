import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
it("documents four structure/navigation pages with working previews and complete copied prompts", async () => {
  render(<Workbench />);
  const user = userEvent.setup(),
    write = vi.spyOn(navigator.clipboard, "writeText");
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  for (const name of [
    "البطاقة",
    "الأكورديون",
    "مسار التنقل",
    "تقسيم الصفحات",
  ]) {
    await user.click(nav.getByRole("button", { name }));
    expect(
      screen.getByRole("region", { name: "المعاينة التفاعلية" }),
    ).not.toBeEmptyDOMElement();
    await user.click(screen.getByRole("button", { name: "نسخ الكود" }));
    const code = write.mock.calls.at(-1)![0];
    await user.click(screen.getByRole("button", { name: "نسخ الطلب" }));
    expect(write.mock.calls.at(-1)![0]).toContain(code);
    expect(code).toContain("SystemProvider");
    expect(code).not.toMatch(/setTimeout|fetch\(/);
  }
});
it("connects Card reveal, Accordion disclosure, Breadcrumb destinations and Pagination content", async () => {
  localStorage.setItem(
    "tiraz.documentation.v2",
    JSON.stringify({
      language: "en",
      active: "card",
      inspectorOpen: true,
      systemPanelOpen: true,
    }),
  );
  render(<Workbench />);
  const user = userEvent.setup(),
    preview = () =>
      within(screen.getByRole("region", { name: "Interactive playground" }));
  await user.click(preview().getByRole("button", { name: "Read notes" }));
  expect(
    preview().getByText("Use shared tokens for spacing and corners."),
  ).toBeVisible();
  const nav = within(screen.getByRole("navigation", { name: "Components" }));
  await user.click(nav.getByRole("button", { name: "Accordion" }));
  await user.click(preview().getByRole("button", { name: "Layout" }));
  expect(preview().getByRole("region", { name: "Layout" })).toHaveTextContent(
    "Content stays in reading order",
  );
  await user.click(nav.getByRole("button", { name: "Breadcrumbs" }));
  for (const link of preview().getAllByRole("link"))
    expect(
      document.getElementById(link.getAttribute("href")!.slice(1)),
    ).not.toBeNull();
  await user.click(nav.getByRole("button", { name: "Pagination" }));
  await user.click(preview().getByRole("button", { name: "Next" }));
  expect(preview().getByRole("button", { name: "Page 2" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    preview().getByRole("heading", { name: "Guide note 2" }),
  ).toBeVisible();
});
