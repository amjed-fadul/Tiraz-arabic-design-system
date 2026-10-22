import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { PromptPanel } from "./PromptPanel";

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
    expect(copy).toHaveTextContent(
      language === "ar" ? "نسخ الطلب" : "Copy agent prompt",
    );
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
  expect(screen.getByRole("textbox")).toHaveValue("Exact fallback text");
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
