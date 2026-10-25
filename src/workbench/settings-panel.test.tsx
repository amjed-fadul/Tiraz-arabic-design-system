import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { commonFields } from "./fields";
import { persist, readDocumentation, readSystem, storageKeys } from "./storage";

// The settings panel (playground layout spec §7b): closed until «تخصيص»
// opens it, docked from 1,024px and a modal Sheet below.
const customize = () => screen.getByRole("button", { name: "تخصيص" });
const panel = () =>
  screen.queryByRole("complementary", { name: "تخصيص المعاينة" });

it("is closed by default, and the old rail is gone", () => {
  const { container } = render(<Workbench />);
  expect(customize()).toHaveAttribute("aria-expanded", "false");
  expect(panel()).toBeNull();
  expect(screen.queryByRole("complementary", { name: "التخصيص" })).toBeNull();
  expect(container.querySelector(".customization-rail")).toBeNull();
  expect(screen.queryByText("خصائص المكوّن")).toBeNull();
});

it("toggles aria-expanded from «تخصيص» and remembers the open state", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<Workbench />);
  await user.click(customize());
  expect(customize()).toHaveAttribute("aria-expanded", "true");
  expect(customize()).toHaveAttribute("aria-controls", panel()!.id);
  expect(readDocumentation().settingsOpen).toBe(true);
  unmount();
  render(<Workbench />);
  expect(customize()).toHaveAttribute("aria-expanded", "true");
  expect(panel()).toBeInTheDocument();
  await user.click(customize());
  expect(customize()).toHaveAttribute("aria-expanded", "false");
  expect(panel()).toBeNull();
  expect(readDocumentation().settingsOpen).toBe(false);
});

it("closes on Escape inside the panel and returns focus to «تخصيص»", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(customize());
  // Opening moves focus to the panel's title.
  expect(
    within(panel()!).getByRole("heading", { name: "تخصيص المعاينة" }),
  ).toHaveFocus();
  await user.click(
    within(panel()!).getByRole("switch", { name: "تقليل الحركة" }),
  );
  await user.keyboard("{Escape}");
  expect(panel()).toBeNull();
  expect(customize()).toHaveFocus();
});

it("opens as a modal Sheet below 1,024px", async () => {
  const matchMedia = window.matchMedia;
  window.matchMedia = (query: string) => ({
    ...matchMedia(query),
    matches: query === "(width < 1024px)",
  });
  try {
    const user = userEvent.setup();
    const { container } = render(<Workbench />);
    await user.click(customize());
    const sheet = screen.getByRole("dialog", { name: "تخصيص المعاينة" });
    expect(container.querySelector("#settings-panel")).toBeNull();
    expect(
      within(sheet).getByRole("radiogroup", { name: "اللون الأساسي" }),
    ).toBeInTheDocument();
    // Modal: the page behind it is out of reach.
    expect(
      screen.queryByRole("region", { name: "المعاينة التفاعلية" }),
    ).toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(customize()).toHaveFocus();
  } finally {
    window.matchMedia = matchMedia;
  }
});

it("never opens the Sheet on load below 1,024px, even when remembered open", () => {
  const matchMedia = window.matchMedia;
  window.matchMedia = (query: string) => ({
    ...matchMedia(query),
    matches: query === "(width < 1024px)",
  });
  try {
    persist(storageKeys.documentation, { language: "ar", settingsOpen: true });
    render(<Workbench />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(customize()).toHaveAttribute("aria-expanded", "false");
  } finally {
    window.matchMedia = matchMedia;
  }
});

it("makes the accent swatches a named radiogroup", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(customize());
  const accents = within(
    within(panel()!).getByRole("radiogroup", { name: "اللون الأساسي" }),
  );
  expect(accents.getAllByRole("radio")).toHaveLength(12);
  const sage = accents.getByRole("radio", { name: "أخضر" });
  expect(sage).toHaveAttribute("aria-checked", "true");
  sage.focus();
  // Arabic reads right to left, so the next swatch is to the left.
  await user.keyboard("{ArrowLeft}");
  const blue = accents.getByRole("radio", { name: "أزرق" });
  expect(blue).toHaveAttribute("aria-checked", "true");
  expect(blue).toHaveFocus();
  expect(readSystem().accent).toBe("blue");
});

it("formats the radius readout using the chosen numerals", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(customize());
  const settings = within(panel()!);
  const radius = settings.getByRole("slider", { name: "استدارة الزوايا" });
  expect(radius).toHaveAttribute("aria-valuetext", "٨ بكسل");
  await user.click(settings.getByRole("button", { name: "غربية · 123" }));
  expect(radius).toHaveAttribute("aria-valuetext", "8 بكسل");
  expect(settings.getByText("8 بكسل")).toBeInTheDocument();
});

it("moves and wraps the accent choice in English reading order", async () => {
  const user = userEvent.setup();
  persist(storageKeys.documentation, { language: "en", settingsOpen: true });
  render(<Workbench />);
  const accents = within(screen.getByRole("radiogroup", { name: "Accent" }));
  accents.getByRole("radio", { name: "Green" }).focus();
  await user.keyboard("{ArrowRight}");
  expect(accents.getByRole("radio", { name: "Blue" })).toHaveFocus();
  expect(readSystem().accent).toBe("blue");
  await user.keyboard("{ArrowLeft}{ArrowLeft}");
  expect(accents.getByRole("radio", { name: "Ink" })).toHaveFocus();
  expect(readSystem().accent).toBe("ink");
});

it("shows system settings and theme export on a page with no props", () => {
  const tooltip = commonFields.tooltip;
  commonFields.tooltip = [];
  try {
    persist(storageKeys.documentation, {
      language: "ar",
      active: "tooltip",
      settingsOpen: true,
    });
    render(<Workbench />);
    expect(
      within(panel()!)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["إعدادات النظام", "ملف المظهر الخاص بك"]);
    expect(
      within(panel()!).queryByRole("button", { name: "إعادة ضبط المعاينة" }),
    ).toBeNull();
  } finally {
    commonFields.tooltip = tooltip;
  }
});
