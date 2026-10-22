import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { PromptPanel } from "./PromptPanel";
import { SystemProvider } from "../system";

afterEach(() => vi.restoreAllMocks());

it.each(["ar", "en"] as const)(
  "reviews and copies the exact English prompt on a %s page",
  async (language) => {
    const user = userEvent.setup();
    const clipboard = vi.spyOn(navigator.clipboard, "writeText");
    const prompt = "First locate Tiraz.\n\n<Button>حفظ</Button>\n";
    render(<PromptPanel prompt={prompt} language={language} />);
    const review = screen.getByRole("button", {
      name: language === "ar" ? "راجع الطلب" : "Review prompt",
    });
    expect(review).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await user.click(review);
    const text = screen.getByRole("textbox");
    expect(text).toHaveValue(prompt);
    expect(text).toHaveAttribute("dir", "ltr");
    expect(text).toHaveAttribute("lang", "en");
    expect(text).toHaveAttribute("readonly");
    const copy = screen.getByRole("button", {
      name: language === "ar" ? "نسخ الطلب" : "Copy agent prompt",
    });
    await user.click(copy);
    expect(copy).toHaveFocus();
    expect(copy).toHaveAttribute("data-icon-only", "true");
    expect(copy.textContent).toBe("");
    expect(screen.getByRole("status")).toHaveClass("sr-only");
    expect(clipboard).toHaveBeenLastCalledWith(prompt);
    expect(screen.getByRole("status")).not.toBeEmptyDOMElement();
  },
);

it("opens the selectable fallback on copy failure without moving focus", async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("denied"),
  );
  render(<PromptPanel prompt="Exact fallback text" language="en" />);
  const copy = screen.getByRole("button", { name: "Copy agent prompt" });
  await user.click(copy);
  expect(copy).toHaveFocus();
  expect(copy).toHaveAccessibleDescription(/Copy failed/);
  expect(await screen.findByRole("textbox")).toHaveValue("Exact fallback text");
  expect(screen.getByRole("button", { name: "Review prompt" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

it("keeps focus while copying and discards stale feedback after settings change", async () => {
  const user = userEvent.setup();
  let finish!: () => void;
  const clipboard = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
  const { rerender } = render(
    <PromptPanel prompt="Original settings" language="en" />,
  );
  const copy = screen.getByRole("button", { name: "Copy agent prompt" });
  await user.click(copy);
  expect(copy).toHaveFocus();
  expect(copy).toHaveAttribute("aria-busy", "true");
  expect(copy).not.toBeDisabled();
  await user.click(copy);
  expect(clipboard).toHaveBeenCalledTimes(1);
  rerender(<PromptPanel prompt="Changed settings" language="en" />);
  await act(async () => finish());
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await user.click(copy);
  expect(clipboard).toHaveBeenLastCalledWith("Changed settings");
});

it.each(["ar", "en"] as const)(
  "labels the icon copy action with a dismissible tooltip in %s",
  async (language) => {
    const user = userEvent.setup();
    const caption = language === "ar" ? "نسخ الطلب" : "Copy agent prompt";
    render(
      <SystemProvider>
        <PromptPanel prompt="Copy these instructions" language={language} />
      </SystemProvider>,
    );
    const copy = screen.getByRole("button", { name: caption });
    await user.hover(copy);
    expect(
      await screen.findByRole("tooltip", { hidden: true }),
    ).toHaveTextContent(caption);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    await user.unhover(copy);
    await user.tab();
    expect(copy).toHaveFocus();
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      caption,
    );
    await user.keyboard("{Enter}");
    expect(copy).toHaveFocus();
    expect(copy).toHaveAccessibleName(caption);
    expect(screen.getByRole("status")).toHaveTextContent(
      language === "ar" ? "تم النسخ" : "Copied",
    );
  },
);
