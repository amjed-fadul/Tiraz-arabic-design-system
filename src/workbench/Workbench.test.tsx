import { aiParts, navigationCatalog } from "./catalog";
import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { generatePrompt } from "./generate";
import { storageKeys, persist, readSystem } from "./storage";
import { defaultPlaygrounds } from "./model";
import { accentColors, defaultConfig } from "../system";
function controls() {
  return within(screen.getByRole("complementary", { name: "التخصيص" }));
}
function navigation() {
  return within(screen.getByRole("navigation", { name: "المكوّنات" }));
}
async function chooseAccent(accent: "blue" | "plum" | "clay") {
  await userEvent.click(controls().getByLabelText("اللون الأساسي"));
  await userEvent.click(
    screen.getByRole("option", {
      name: { blue: "أزرق", plum: "بنفسجي", clay: "بني" }[accent],
    }),
  );
}
function preview() {
  return within(screen.getByRole("region", { name: "المعاينة التفاعلية" }));
}
/** Opens the playground's Code view (if needed) and returns the shown source. */
async function shownCode() {
  const tab = screen.getByRole("tab", { name: "الكود" });
  if (tab.getAttribute("aria-selected") !== "true") await userEvent.click(tab);
  return screen
    .getByRole("region", { name: "الكود: src/Example.tsx" })
    .querySelector("pre")!.textContent!;
}
it("isolates portable library paths as complete LTR runs inside the Arabic prompt", () => {
  const { container } = render(<Workbench />);
  const paths = Array.from(container.querySelectorAll(".prompt-preview bdi"));
  for (const path of [
    "ai/README.md",
    "ai/registry.json",
    "ai/composition.md",
    "Button.tsx",
    "./system",
    "./system/tokens.css",
  ])
    expect(
      paths.some(
        (node) =>
          node.textContent === path && node.getAttribute("dir") === "ltr",
      ),
      path,
    ).toBe(true);
});
it("places only navigation in its sidebar and both customization sections in the separate rail", () => {
  const { container } = render(<Workbench />);
  const nav = screen.getByRole("complementary", { name: "تنقّل المكوّنات" });
  // Every page, less the fifteen folded AI parts, and their disclosure.
  expect(within(nav).getAllByRole("button")).toHaveLength(
    navigationCatalog.length - aiParts.length + 1,
  );
  fireEvent.click(within(nav).getByRole("button", { name: "الأجزاء" }));
  expect(within(nav).getAllByRole("button")).toHaveLength(
    navigationCatalog.length + 1,
  );
  expect(within(nav).queryByText("خصائص المكوّن")).not.toBeInTheDocument();
  expect(
    controls().getByRole("heading", { name: "تخصيص المكوّنات" }),
  ).toBeInTheDocument();
  expect(controls().getByText("خصائص المكوّن")).toBeInTheDocument();
  expect(
    container.querySelector(".customization-rail")?.parentElement,
  ).toHaveClass("docs-layout");
  expect(controls().queryByText("خصائص متقدمة")).not.toBeInTheDocument();
  expect(controls().queryByLabelText("مظهر المكوّنات")).not.toBeInTheDocument();
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
    await chooseAccent(accent);
    for (const el of container.querySelectorAll(
      ".playground-region .tiraz-system",
    ))
      expect((el as HTMLElement).style.getPropertyValue("--action")).toBe(
        accentColors[accent].light,
      );
    expect(await shownCode()).toContain(`accent: "${accent}"`);
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
  const { container } = render(<Workbench />);
  // The playground frame carries the code; no page keeps a separate usage
  // or Examples stage.
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
    for (const title of ["استخدمه في تطبيقك", "المعاينة التفاعلية"])
      expect(
        screen.getByRole("heading", { name: title, level: 2 }),
      ).toBeInTheDocument();
    for (const title of ["مثال الاستخدام", "أمثلة"])
      expect(screen.queryByRole("heading", { name: title })).toBeNull();
    expect(
      container.querySelector(".usage-section, .examples-section"),
    ).toBeNull();
    const views = screen.getByRole("tablist", { name: "طريقة العرض" });
    expect(
      within(views)
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["معاينة", "الكود"]);
    // Copy sits in the Code view's header.
    expect(screen.queryByRole("button", { name: "نسخ الكود" })).toBeNull();
    await userEvent.click(within(views).getByRole("tab", { name: "الكود" }));
    expect(screen.getByRole("button", { name: "نسخ الكود" })).toBeVisible();
    expect(screen.queryByText("عرض الطلب كاملًا")).not.toBeInTheDocument();
    expect(
      within(
        container.querySelector(".reference-section") as HTMLElement,
      ).getByText("دليل الخصائص"),
    ).toBeInTheDocument();
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
  await chooseAccent("blue");
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
  await chooseAccent("plum");
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط النظام" }),
  );
  // The chrome's provider carries the theme.
  expect(container.querySelector(".tiraz-system")).toHaveAttribute(
    "data-theme",
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

it("leaves no data-doc-theme on the docs shell", async () => {
  const { container } = render(<Workbench />);
  await userEvent.click(screen.getByRole("button", { name: "تبديل المظهر" }));
  expect(container.querySelector("[data-doc-theme]")).toBeNull();
});

it("copies the full current prompt despite its single-line presentation", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.clear(controls().getByLabelText("التسمية"));
  await user.type(controls().getByLabelText("التسمية"), "اعتماد الفاتورة");
  await chooseAccent("plum");
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
  expect(copied).toContain(await shownCode());
  expect(copied).toContain("اعتماد الفاتورة");
  expect(copied).toContain('accent: "plum"');
  expect(copied).toContain("src/system/Button.tsx");
});

it.each(["select", "radio-group"] as const)(
  "clears unapplied %s collection drafts and errors on reset without losing reset focus",
  async (active) => {
    persist(storageKeys.documentation, { language: "en", active });
    render(<Workbench />);
    const user = userEvent.setup();
    const rail = within(
      screen.getByRole("complementary", { name: "Customization" }),
    );
    const original = (
      rail.getByRole("textbox", { name: "Options" }) as HTMLTextAreaElement
    ).value;
    await user.clear(rail.getByRole("textbox", { name: "Options" }));
    await user.type(rail.getByRole("textbox", { name: "Options" }), "invalid");
    await user.click(rail.getByRole("button", { name: "Apply collection" }));
    expect(rail.getByRole("alert")).toBeVisible();
    const reset = rail.getByRole("button", { name: "Reset playground" });
    await user.click(reset);
    expect(rail.getByRole("textbox", { name: "Options" })).toHaveValue(
      original,
    );
    expect(rail.queryByRole("alert")).toBeNull();
    expect(reset).toHaveFocus();
    await user.clear(rail.getByRole("textbox", { name: "Options" }));
    await user.click(reset);
    expect(rail.getByRole("textbox", { name: "Options" })).toHaveValue(
      original,
    );
  },
);

it.each([
  ["ar", "light"],
  ["ar", "dark"],
  ["en", "light"],
  ["en", "dark"],
] as const)(
  "applies and copies the expanded accents in %s/%s",
  async (language, theme) => {
    persist(storageKeys.documentation, { language, active: "button" });
    persist(storageKeys.theme, theme);
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    const { container } = render(<Workbench />);
    const ar = language === "ar";
    const rail = within(
      screen.getByRole("complementary", {
        name: ar ? "التخصيص" : "Customization",
      }),
    );
    const accentControl = rail.getByRole("combobox", {
      name: ar ? "اللون الأساسي" : "Accent",
    });
    for (const [accent, arabic, english] of [
      ["lime", "ليموني", "Lime"],
      ["amber", "كهرماني", "Amber"],
      ["teal", "فيروزي", "Teal"],
      ["cyan", "سماوي", "Cyan"],
      ["indigo", "نيلي", "Indigo"],
      ["rose", "وردي", "Rose"],
      ["slate", "رمادي", "Slate"],
    ] as const) {
      await user.click(accentControl);
      const option = screen.getByRole("option", {
        name: ar ? arabic : english,
      });
      expect(option).toHaveAccessibleName(ar ? arabic : english);
      expect(option.querySelector(".accent-swatch")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(option.querySelector(".accent-swatch")).toHaveStyle({
        backgroundColor: accentColors[accent][theme],
      });
      await user.click(option);
      expect(accentControl).toHaveTextContent(ar ? arabic : english);
      expect(accentControl.querySelector(".accent-swatch")).toHaveStyle({
        backgroundColor: accentColors[accent][theme],
      });
      for (const provider of container.querySelectorAll<HTMLElement>(
        ".playground-region .tiraz-system",
      ))
        expect(provider.style.getPropertyValue("--action")).toBe(
          accentColors[accent][theme],
        );
      await user.click(
        screen.getByRole("button", {
          name: ar ? "نسخ الطلب" : "Copy agent prompt",
        }),
      );
      expect(String(copy.mock.calls.at(-1)?.[0])).toContain(
        `"accent":"${accent}"`,
      );
      expect(readSystem().accent).toBe(accent);
    }
    await user.click(
      rail.getByRole("button", {
        name: ar ? "إعادة ضبط النظام" : "Reset system",
      }),
    );
    expect(accentControl).toHaveTextContent(ar ? "أخضر" : "Green");
  },
);

it("selects an accent by keyboard, restores focus and preserves the choice on Escape", async () => {
  persist(storageKeys.documentation, { language: "en", active: "button" });
  const user = userEvent.setup();
  render(<Workbench />);
  const control = within(
    screen.getByRole("complementary", { name: "Customization" }),
  ).getByRole("combobox", { name: "Accent" });
  control.focus();
  await user.keyboard("{ArrowDown}{End}{Enter}");
  expect(control).toHaveTextContent("Ink");
  await waitFor(() => expect(control).toHaveFocus());
  expect(readSystem().accent).toBe("ink");
  await user.keyboard("{ArrowDown}{Home}{Escape}");
  expect(control).toHaveTextContent("Ink");
  expect(control).toHaveFocus();
});
it("keeps the accent popup inside the mobile settings dialog", async () => {
  persist(storageKeys.documentation, { language: "en", active: "button" });
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole("button", { name: "System settings" }));
  const dialog = screen.getByRole("dialog", { name: "Customization" });
  const control = within(dialog).getByRole("combobox", { name: "Accent" });
  await user.click(control);
  expect(dialog).toContainElement(screen.getByRole("listbox"));
  await user.click(screen.getByRole("option", { name: "Lime" }));
  expect(control).toHaveTextContent("Lime");
  expect(dialog).toBeVisible();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
it("switches playground digits with the numerals setting and emits it in copied code", async () => {
  persist(storageKeys.documentation, { language: "ar", active: "progress" });
  render(<Workbench />);
  const value = () =>
    preview().getByRole("progressbar").getAttribute("aria-valuetext");
  expect(controls().getByLabelText("الأرقام")).toHaveValue("arab");
  expect(value()).toContain("٦٤");
  await userEvent.selectOptions(controls().getByLabelText("الأرقام"), "latn");
  expect(value()).toContain("64");
  expect(value()).not.toMatch(/[٠-٩]/);
  expect(readSystem().numerals).toBe("latn");
  expect(await shownCode()).toContain('"numerals":"latn"');
  await userEvent.click(screen.getByRole("tab", { name: "معاينة" }));
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط النظام" }),
  );
  expect(controls().getByLabelText("الأرقام")).toHaveValue("arab");
  expect(value()).toContain("٦٤");
});
