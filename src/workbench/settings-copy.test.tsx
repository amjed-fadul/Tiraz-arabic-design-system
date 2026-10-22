import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";

afterEach(() => vi.restoreAllMocks());

it.each([
  { language: "ar", mobile: false },
  { language: "en", mobile: true },
] as const)(
  "exposes exact settings JSON after copy failure in $language (mobile=$mobile)",
  async ({ language, mobile }) => {
    const matchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      ...matchMedia(query),
      matches: mobile && query === "(width < 1024px)",
    }));
    const user = userEvent.setup();
    const clipboard = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValueOnce(new Error("denied"));
    persist(storageKeys.documentation, { language });
    persist(storageKeys.system, {
      accent: "blue",
      density: "compact",
      typography: "standard",
      numerals: "latn",
      radius: 12,
      reducedMotion: true,
    });
    render(<Workbench />);
    await user.click(
      screen.getByRole("button", {
        name: language === "ar" ? "تخصيص" : "Customize",
      }),
    );
    const settings = within(
      screen.getByRole(mobile ? "dialog" : "complementary", {
        name: language === "ar" ? "تخصيص المعاينة" : "Customize the preview",
      }),
    );
    const copy = settings.getByRole("button", {
      name: language === "ar" ? "نسخ الإعدادات" : "Copy settings",
    });
    const fallbackName =
      language === "ar" ? "الإعدادات بصيغة JSON" : "Settings JSON";
    expect(settings.queryByRole("textbox", { name: fallbackName })).toBeNull();
    await user.click(copy);
    expect(copy).toHaveFocus();
    const fallback = await settings.findByRole("textbox", {
      name: fallbackName,
    });
    expect(fallback).toHaveAttribute("readonly");
    expect(fallback).toHaveAttribute("dir", "ltr");
    expect(fallback).toHaveValue(clipboard.mock.calls[0][0]);
    expect(JSON.parse((fallback as HTMLTextAreaElement).value)).toEqual({
      accent: "blue",
      density: "compact",
      typography: "standard",
      numerals: "latn",
      radius: 12,
      reducedMotion: true,
      direction: language === "ar" ? "rtl" : "ltr",
      theme: "light",
    });
    expect(fallback).toHaveAccessibleDescription(
      language === "ar"
        ? "تعذّر النسخ. حدّد النص وانسخه يدويًا."
        : "Copy failed. Select and copy the text manually.",
    );
    // The live status stays out of the header/footer layout; the fallback
    // carries the visible failure instructions beside the selectable text.
    expect(settings.getByRole("status")).toHaveClass("sr-only");
    await user.click(fallback);
    await user.keyboard("{Control>}a{/Control}");
    expect((fallback as HTMLTextAreaElement).selectionStart).toBe(0);
    expect((fallback as HTMLTextAreaElement).selectionEnd).toBe(
      (fallback as HTMLTextAreaElement).value.length,
    );
    await user.click(copy);
    expect(copy).toHaveFocus();
    expect(settings.queryByRole("textbox", { name: fallbackName })).toBeNull();
  },
);
