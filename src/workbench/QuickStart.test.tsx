import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { QuickStart } from "./QuickStart";

it("copies the chosen setup and English starter prompt with one initially empty announcement", async () => {
  const user = userEvent.setup();
  const clipboard = vi.spyOn(navigator.clipboard, "writeText");
  render(<QuickStart language="ar" />);
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  const existing = screen.getByRole("button", { name: "مشروع قائم" });
  await user.click(existing);
  expect(existing).toHaveFocus();
  expect(existing).toHaveAttribute("aria-pressed", "true");
  const copy = screen.getByRole("button", { name: "نسخ طلب الإعداد" });
  await user.click(copy);
  expect(copy).toHaveFocus();
  expect(clipboard).toHaveBeenLastCalledWith(
    expect.stringContaining("Preserve its routes, data, and toolchain."),
  );
  expect(clipboard.mock.lastCall?.[0]).not.toMatch(/[\u0600-\u06ff]/);
  await user.click(screen.getByText("مراجعة الفواتير"));
  await user.click(
    screen.getByRole("button", { name: "نسخ طلب مراجعة الفواتير" }),
  );
  expect(clipboard).toHaveBeenLastCalledWith(
    expect.stringContaining("Closing or cancelling must record nothing"),
  );
  expect(screen.getByRole("status")).not.toBeEmptyDOMElement();
});

it("provides a selectable fallback when clipboard access fails", async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("denied"),
  );
  render(<QuickStart language="en" />);
  await user.click(screen.getByRole("button", { name: "Copy setup prompt" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Select the text and copy it manually.",
  );
  expect(
    screen.getByRole("button", { name: "Copy setup prompt" }),
  ).toHaveFocus();
});

it("fits a landing section without adding an h1 and keeps Arabic step numerals", () => {
  const { container } = render(<QuickStart language="ar" headingLevel={2} />);
  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  expect(
    screen.getByRole("heading", { level: 2, name: "ابدأ من المصدر" }),
  ).toBeVisible();
  expect(
    within(screen.getByRole("region", { name: "ابدأ من المصدر" })).getAllByRole(
      "heading",
      { level: 3 },
    ),
  ).toHaveLength(3);
  expect(
    [...container.querySelectorAll(".quick-start-number")].map(
      (el) => el.textContent,
    ),
  ).toEqual(["١", "٢", "٣"]);
});
