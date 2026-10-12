import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { generatePrompt } from "./generate";
import { storageKeys, persist } from "./storage";
import { defaultPlaygrounds } from "./model";
import { accentColors, defaultConfig } from "../system";
function controls() {
  return within(screen.getByRole("complementary", { name: "التخصيص" }));
}
function navigation() {
  return within(screen.getByRole("navigation", { name: "المكوّنات" }));
}
function preview() {
  return within(screen.getByRole("region", { name: "المعاينة التفاعلية" }));
}
it("places only navigation in its sidebar and both customization sections in the separate rail", () => {
  const { container } = render(<Workbench />);
  const nav = screen.getByRole("complementary", { name: "تنقّل المكوّنات" });
  expect(within(nav).getAllByRole("button")).toHaveLength(6);
  expect(within(nav).queryByText("خصائص المكوّن")).not.toBeInTheDocument();
  expect(
    controls().getByRole("heading", { name: "تخصيص المكونات" }),
  ).toBeInTheDocument();
  expect(controls().getByText("خصائص المكوّن")).toBeInTheDocument();
  expect(
    container.querySelector(".customization-rail")?.parentElement,
  ).toHaveClass("docs-layout");
  expect(controls().queryByText("خصائص متقدمة")).not.toBeInTheDocument();
  expect(controls().queryByLabelText("مظهر المكونات")).not.toBeInTheDocument();
});
it("uses one shared theme everywhere and migrates conflicting legacy preferences", async () => {
  persist("tiraz.documentation.v1", { theme: "dark" });
  persist("tiraz.system.v2", { ...defaultConfig, theme: "light" });
  const { container } = render(<Workbench />);
  for (const provider of container.querySelectorAll(".tiraz-system"))
    expect(provider).toHaveAttribute("data-theme", "dark");
  await userEvent.click(screen.getByRole("button", { name: "تبديل المظهر" }));
  for (const provider of container.querySelectorAll(".tiraz-system"))
    expect(provider).toHaveAttribute("data-theme", "light");
  expect(JSON.parse(localStorage.getItem(storageKeys.theme)!)).toBe("light");
  expect(
    JSON.parse(localStorage.getItem(storageKeys.system)!),
  ).not.toHaveProperty("theme");
  expect(
    JSON.parse(localStorage.getItem(storageKeys.documentation)!),
  ).not.toHaveProperty("theme");
});
it("updates accent through successive selections, navigation and reset despite legacy overrides", async () => {
  persist("tiraz.playgrounds.v1", {
    ...defaultPlaygrounds("ar"),
    button: {
      ...defaultPlaygrounds("ar").button,
      previewAccent: "blue",
      previewTheme: "dark",
    },
  });
  const { container } = render(<Workbench />);
  for (const accent of ["blue", "plum", "clay"] as const) {
    await userEvent.selectOptions(
      controls().getByLabelText("اللون الأساسي"),
      accent,
    );
    for (const el of container.querySelectorAll(
      ".playground-region .tiraz-system,.examples-section .tiraz-system",
    ))
      expect((el as HTMLElement).style.getPropertyValue("--action")).toBe(
        accentColors[accent].light,
      );
    expect(
      screen.getByRole("region", { name: "مثال الاستخدام" }),
    ).toHaveTextContent(`accent: "${accent}"`);
  }
  await userEvent.click(
    navigation().getByRole("button", { name: "التبويبات" }),
  );
  expect(
    (
      container.querySelector(".playground-region .tiraz-system") as HTMLElement
    ).style.getPropertyValue("--action"),
  ).toBe(accentColors.clay.light);
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط المعاينة" }),
  );
  expect(JSON.parse(localStorage.getItem(storageKeys.system)!).accent).toBe(
    "clay",
  );
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط النظام" }),
  );
  expect(JSON.parse(localStorage.getItem(storageKeys.system)!).accent).toBe(
    "sage",
  );
  expect(
    JSON.parse(localStorage.getItem(storageKeys.playgrounds)!).button,
  ).not.toHaveProperty("previewAccent");
});
it("preserves per-component labels and properties while keeping resets separate", async () => {
  render(<Workbench />);
  await userEvent.clear(controls().getByLabelText("التسمية"));
  await userEvent.type(controls().getByLabelText("التسمية"), "اعتماد الطلب");
  await userEvent.selectOptions(controls().getByLabelText("الحجم"), "md");
  await userEvent.selectOptions(
    controls().getByLabelText("النوع"),
    "secondary",
  );
  await userEvent.click(
    navigation().getByRole("button", { name: "مفتاح التبديل" }),
  );
  await userEvent.click(controls().getByRole("switch", { name: "مفعّل" }));
  await userEvent.click(navigation().getByRole("button", { name: "الأزرار" }));
  expect(preview().getByRole("button")).toHaveTextContent("اعتماد الطلب");
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط النظام" }),
  );
  expect(preview().getByRole("button")).toHaveAttribute("data-size", "md");
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط المعاينة" }),
  );
  expect(preview().getByRole("button")).toHaveTextContent("حفظ الفاتورة");
  expect(preview().getByRole("button")).toHaveAttribute("data-size", "sm");
  await userEvent.click(
    navigation().getByRole("button", { name: "مفتاح التبديل" }),
  );
  expect(preview().getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "false",
  );
});
it("uses one state selector for Button disabled/loading demonstrations", async () => {
  render(<Workbench />);
  expect(
    controls().queryByRole("switch", { name: "معطّل" }),
  ).not.toBeInTheDocument();
  await userEvent.selectOptions(
    controls().getByLabelText("الحالة"),
    "disabled",
  );
  expect(preview().getByRole("button")).toBeDisabled();
  await userEvent.selectOptions(controls().getByLabelText("الحالة"), "loading");
  expect(preview().getByRole("button")).toHaveAttribute("aria-busy", "true");
  await userEvent.selectOptions(controls().getByLabelText("الحالة"), "idle");
  expect(preview().getByRole("button")).toBeEnabled();
});
it("retains continuous documentation, synchronized prompt content and API information on every page", async () => {
  render(<Workbench />);
  for (const name of [
    "الأزرار",
    "التبويبات",
    "مفتاح التبديل",
    "القائمة المنسدلة",
    "اللوحة الجانبية",
    "التنبيهات",
  ]) {
    await userEvent.click(navigation().getByRole("button", { name }));
    expect(screen.getByRole("heading", { name, level: 1 })).toBeInTheDocument();
    for (const title of [
      "استخدمه في تطبيقك",
      "المعاينة التفاعلية",
      "أمثلة",
      "مثال الاستخدام",
    ])
      expect(
        screen.getByRole("heading", { name: title, level: 2 }),
      ).toBeInTheDocument();
    expect(screen.queryByText("عرض الطلب كاملاً")).not.toBeInTheDocument();
    expect(screen.getByText("دليل الخصائص")).toBeInTheDocument();
  }
});
it("demonstrates both simulated outcomes", async () => {
  persist(storageKeys.playgrounds, {
    ...defaultPlaygrounds("ar"),
    button: { ...defaultPlaygrounds("ar").button, outcome: "error" },
  });
  render(<Workbench />);
  await userEvent.click(preview().getByRole("button"));
  expect(preview().getByRole("button")).toHaveAttribute("aria-busy", "true");
  await waitFor(
    () =>
      expect(preview().getByRole("button")).toHaveAttribute(
        "data-state",
        "error",
      ),
    { timeout: 2500 },
  );
  expect(screen.getByRole("status", { name: "آخر حدث" })).toHaveTextContent(
    "error",
  );
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط المعاينة" }),
  );
  await userEvent.click(preview().getByRole("button"));
  await waitFor(
    () =>
      expect(preview().getByRole("button")).toHaveAttribute(
        "data-state",
        "success",
      ),
    { timeout: 2500 },
  );
});
it("retains shared tokens in Sheet portals and restores trigger focus", async () => {
  render(<Workbench />);
  await userEvent.click(screen.getByRole("button", { name: "تبديل المظهر" }));
  await userEvent.selectOptions(
    controls().getByLabelText("اللون الأساسي"),
    "blue",
  );
  await userEvent.click(
    navigation().getByRole("button", { name: "اللوحة الجانبية" }),
  );
  const trigger = preview().getByRole("button");
  await userEvent.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "تفاصيل العميل" });
  expect(dialog.closest(".tiraz-system")).toHaveAttribute("data-theme", "dark");
  expect(
    (dialog.closest(".tiraz-system") as HTMLElement).style.getPropertyValue(
      "--action",
    ),
  ).toBe(accentColors.blue.dark);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(trigger).toHaveFocus());
});
it("changes language and direction together without losing custom labels", async () => {
  render(<Workbench />);
  await userEvent.clear(controls().getByLabelText("التسمية"));
  await userEvent.type(controls().getByLabelText("التسمية"), "حفظ خاص");
  await userEvent.selectOptions(screen.getByLabelText("لغة التوثيق"), "en");
  expect(document.documentElement.dir).toBe("ltr");
  expect(document.documentElement.lang).toBe("en");
  expect(
    screen.getByRole("heading", { level: 1, name: "Button" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Interactive playground" }),
  ).toHaveTextContent("حفظ خاص");
});

it("system reset restores the shared theme and documented configuration defaults", async () => {
  const { container } = render(<Workbench />);
  await userEvent.click(screen.getByRole("button", { name: "تبديل المظهر" }));
  await userEvent.selectOptions(
    controls().getByLabelText("اللون الأساسي"),
    "plum",
  );
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط النظام" }),
  );
  expect(container.querySelector(".docs-shell")).toHaveAttribute(
    "data-doc-theme",
    "light",
  );
  expect(JSON.parse(localStorage.getItem(storageKeys.theme)!)).toBe("light");
  expect(JSON.parse(localStorage.getItem(storageKeys.system)!)).toMatchObject({
    accent: "sage",
    density: "compact",
    typography: "standard",
    radius: 8,
    reducedMotion: false,
  });
});

it("copies the full current prompt despite its single-line presentation", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.clear(controls().getByLabelText("التسمية"));
  await user.type(controls().getByLabelText("التسمية"), "اعتماد الفاتورة");
  await user.selectOptions(controls().getByLabelText("اللون الأساسي"), "plum");
  await user.click(screen.getByRole("button", { name: "نسخ الطلب" }));
  const copied = await navigator.clipboard.readText();
  const savedProps = JSON.parse(
    localStorage.getItem(storageKeys.playgrounds)!,
  ).button;
  const savedSettings = JSON.parse(localStorage.getItem(storageKeys.system)!);
  const sharedTheme = JSON.parse(localStorage.getItem(storageKeys.theme)!);
  expect(copied).toBe(
    generatePrompt(
      "button",
      savedProps,
      { ...savedSettings, direction: "rtl", theme: sharedTheme },
      "ar",
    ),
  );
  expect(copied).not.toContain("/Users/");
  expect(copied).toContain("README.md");
  expect(copied).toContain(
    screen.getByRole("region", { name: "مثال الاستخدام" }).textContent!,
  );
  expect(copied).toContain("اعتماد الفاتورة");
  expect(copied).toContain('accent: "plum"');
  expect(copied).toContain("src/system/Button.tsx");
});
