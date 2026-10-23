import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { QuickStart } from "./QuickStart";
import { npmRelease } from "./npm-release";

afterEach(() => vi.restoreAllMocks());

it("copies real versioned new and existing source-install commands", async () => {
  const user = userEvent.setup();
  const clipboard = vi.spyOn(navigator.clipboard, "writeText");
  render(<QuickStart language="en" />);
  await user.click(
    screen.getByRole("button", { name: "Copy install command" }),
  );
  expect(clipboard).toHaveBeenLastCalledWith(
    "npx @amjedfadul/tiraz@0.1.1 init --new my-app\ncd my-app\nnpm run dev",
  );
  await user.click(screen.getByRole("button", { name: "Existing project" }));
  await user.click(
    screen.getByRole("button", { name: "Copy install command" }),
  );
  expect(clipboard).toHaveBeenLastCalledWith(
    "npx @amjedfadul/tiraz@0.1.1 init",
  );
  expect(screen.queryByText(/<tiraz-package>/)).not.toBeInTheDocument();
});

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
  await user.click(screen.getByText("طلب الإعداد لأداة البرمجة"));
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
  await user.click(screen.getByText("Setup prompt for your coding tool"));
  await user.click(screen.getByRole("button", { name: "Copy setup prompt" }));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Select the text and copy it manually.",
    ),
  );
  expect(
    screen.getByRole("button", { name: "Copy setup prompt" }),
  ).toHaveFocus();
  expect(
    screen.getByRole("region", { name: "Setup prompt" }),
  ).toHaveTextContent("Read src/system/ai/README.md");
});

it("guards pending setup copies and ignores results for a replaced project prompt", async () => {
  const user = userEvent.setup();
  let resolveCopy!: () => void;
  const clipboard = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined)
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );
  render(<QuickStart language="en" />);
  await user.click(screen.getByText("Setup prompt for your coding tool"));
  const copy = screen.getByRole("button", { name: "Copy setup prompt" });
  await user.click(copy);
  expect(copy).toHaveAttribute("aria-busy", "true");
  expect(copy).toHaveFocus();
  await user.click(copy);
  expect(clipboard).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Existing project" }));
  await act(async () => resolveCopy());
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(copy).not.toHaveAttribute("aria-busy", "true");
  await user.click(copy);
  expect(clipboard).toHaveBeenLastCalledWith(
    expect.stringContaining("Preserve its routes, data, and toolchain."),
  );
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Copied"),
  );
});

it("fits a landing section without adding an h1 and keeps Arabic step numerals", () => {
  const { container } = render(<QuickStart language="ar" headingLevel={2} />);
  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  expect(
    screen.getByRole("heading", { level: 2, name: "ابدأ مع طِراز" }),
  ).toBeVisible();
  expect(
    within(screen.getByRole("region", { name: "ابدأ مع طِراز" })).getAllByRole(
      "heading",
      { level: 3 },
    ),
  ).toHaveLength(4);
  expect(
    [...container.querySelectorAll(".quick-start-number")].map(
      (el) => el.textContent,
    ),
  ).toEqual(["١", "٢"]);
});

it("keeps long instructions collapsed and reports the actual package release status", async () => {
  const user = userEvent.setup();
  const { container } = render(<QuickStart language="en" />);
  expect(container.querySelectorAll("details[open]")).toHaveLength(0);
  expect(
    screen.getByRole("button", { name: "Copy setup prompt" }),
  ).not.toBeVisible();
  expect(
    screen.queryByRole("link", {
      name: /Source on GitHub|Download source guide/,
    }),
  ).toBeNull();
  if (!npmRelease.published)
    expect(
      screen.getByText(/once package publication is complete/),
    ).toBeVisible();
  expect(
    screen.getByRole("region", { name: "Install command" }),
  ).toHaveTextContent("npx @amjedfadul/tiraz@0.1.1 init --new my-app");
  await user.click(screen.getByRole("button", { name: "Existing project" }));
  expect(screen.getByText("npx @amjedfadul/tiraz@0.1.1 init")).toBeVisible();
  await user.click(screen.getByText("Customer dashboard"));
  expect(
    screen.getByRole("button", { name: "Copy prompt: Customer dashboard" }),
  ).toBeVisible();
});
