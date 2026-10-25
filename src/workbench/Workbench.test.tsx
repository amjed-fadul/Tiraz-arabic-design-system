import { navigationLink } from "./test-navigation";
import { sectionEntries } from "./navigation-model";
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
/** The settings panel, opened from «تخصيص» in the toolbar when it is closed. */
function controls(language: "ar" | "en" = "ar") {
  const name = language === "ar" ? "تخصيص المعاينة" : "Customize the preview";
  if (!screen.queryByRole("complementary", { name }))
    fireEvent.click(
      screen.getByRole("button", {
        name: language === "ar" ? "تخصيص" : "Customize",
      }),
    );
  return within(screen.getByRole("complementary", { name }));
}
async function openPage(name: string) {
  await userEvent.click(navigationLink(name));
}
async function chooseAccent(accent: "blue" | "plum" | "clay") {
  await userEvent.click(
    controls().getByRole("radio", {
      name: { blue: "أزرق", plum: "بنفسجي", clay: "بني" }[accent],
    }),
  );
}
/** Picks an option from one of the panel's Selects. */
async function choose(select: string, option: string) {
  await userEvent.click(controls().getByRole("combobox", { name: select }));
  await userEvent.click(screen.getByRole("option", { name: option }));
}
function preview() {
  return within(screen.getByRole("region", { name: "المعاينة التفاعلية" }));
}

it("dismisses the first-visit hint through the original Customize button and remembers it on reload", async () => {
  const user = userEvent.setup();
  const view = render(<Workbench />);
  expect(screen.getByRole("button", { name: "خصّص من هنا" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "تخصيص" }));
  expect(screen.queryByRole("button", { name: "خصّص من هنا" })).toBeNull();
  expect(screen.getByRole("heading", { name: "تخصيص المعاينة" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "إغلاق التخصيص" }));
  view.unmount();
  render(<Workbench />);
  expect(screen.getByRole("button", { name: "تخصيص" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(screen.queryByRole("button", { name: "خصّص من هنا" })).toBeNull();
});

it("waits through Start and screen pages, then opens Customize from the hint with normal panel focus", async () => {
  persist(storageKeys.documentation, { language: "en" });
  window.history.replaceState({}, "", "/start");
  const user = userEvent.setup();
  render(<Workbench />);
  const nav = () =>
    within(screen.getByRole("navigation", { name: "Components" }));
  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();
  await user.click(nav().getByRole("button", { name: "Screens" }));
  await user.click(navigationLink("Customer dashboard"));
  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();

  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();
  await user.click(navigationLink("Button"));
  expect(screen.getByRole("main")).toHaveFocus();
  await user.click(
    screen.getByRole("button", { name: "Click me to customize the preview" }),
  );
  expect(
    screen.getByRole("heading", { name: "Customize the preview" }),
  ).toHaveFocus();
  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Close customize" }));
  expect(screen.getByRole("button", { name: "Customize" })).toHaveFocus();
});
/** Opens the playground's Code view (if needed) and returns the shown source. */
async function shownCode() {
  const tab = screen.getByRole("tab", { name: "الكود" });
  if (tab.getAttribute("aria-selected") !== "true") await userEvent.click(tab);
  return screen
    .getByRole("region", { name: "الكود: src/Example.tsx" })
    .querySelector("pre")!.textContent!;
}
it("keeps the full prompt and portable paths in one English LTR field", async () => {
  render(<Workbench />);
  await userEvent.click(screen.getByRole("button", { name: "راجع الطلب" }));
  const prompt = screen.getByRole("textbox", {
    name: "الطلب الكامل للمساعد البرمجي",
  });
  expect(prompt).toHaveAttribute("dir", "ltr");
  expect(prompt).toHaveAttribute("lang", "en");
  for (const path of [
    "ai/README.md",
    "ai/registry.json",
    "ai/composition.md",
    "Button.tsx",
    "./system",
    "./system/tokens.css",
  ])
    expect((prompt as HTMLTextAreaElement).value).toContain(path);
});

it("places only navigation in its sidebar and customization with theme export in the panel", () => {
  const { container } = render(<Workbench />);
  const nav = screen.getByRole("complementary", { name: "تنقّل المكوّنات" });
  expect(
    within(nav)
      .getAllByRole("link")
      .filter((link) => link.hasAttribute("aria-label")),
  ).toHaveLength(sectionEntries("components", "ar").length);
  expect(within(nav).queryByText("خصائص الأزرار")).not.toBeInTheDocument();
  expect(
    controls()
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["خصائص الأزرار", "إعدادات النظام", "ملف المظهر الخاص بك"]);
  expect(container.querySelector(".settings-panel")?.parentElement).toHaveClass(
    "docs-layout",
  );
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
        `var(--tiraz-action, ${accentColors[accent].light})`,
      );
    expect(await shownCode()).toContain(`accent: "${accent}"`);
  }
  await openPage("التبويبات");
  expect(
    (
      container.querySelector(".playground-region .tiraz-system") as HTMLElement
    ).style.getPropertyValue("--action"),
  ).toBe(`var(--tiraz-action, ${accentColors.clay.light})`);
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
  await userEvent.click(controls().getByRole("button", { name: "عادي · md" }));
  await choose("النوع", "ثانوي");
  await userEvent.click(navigationLink("مفتاح التبديل"));
  await userEvent.click(controls().getByRole("switch", { name: "مفعّل" }));
  await userEvent.click(navigationLink("الأزرار"));
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
  await userEvent.click(navigationLink("مفتاح التبديل"));
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
  await choose("الحالة", "معطّل");
  expect(preview().getByRole("button")).toBeDisabled();
  await choose("الحالة", "تحميل");
  expect(preview().getByRole("button")).toHaveAttribute("aria-busy", "true");
  await choose("الحالة", "جاهز");
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
    await openPage(name);
    expect(screen.getByRole("heading", { name, level: 1 })).toBeInTheDocument();
    for (const title of ["استخدمه في تطبيقك", "إرشادات الاستخدام"])
      expect(
        screen.getByRole("heading", { name: title, level: 2 }),
      ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "المعاينة التفاعلية" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "المعاينة التفاعلية" }),
    ).toBeNull();
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
  await openPage("اللوحة الجانبية");
  const trigger = preview().getByRole("button");
  await userEvent.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "تفاصيل العميل" });
  expect(dialog.closest(".tiraz-system")).toHaveAttribute("data-theme", "dark");
  expect(
    (dialog.closest(".tiraz-system") as HTMLElement).style.getPropertyValue(
      "--action",
    ),
  ).toBe(`var(--tiraz-action, ${accentColors.blue.dark})`);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(trigger).toHaveFocus());
});
it("changes language and direction together without losing custom labels", async () => {
  render(<Workbench />);
  await userEvent.clear(controls().getByLabelText("التسمية"));
  await userEvent.type(controls().getByLabelText("التسمية"), "حفظ خاص");
  await userEvent.click(screen.getByRole("button", { name: "English" }));
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
    const rail = controls("en");
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
    const rail = controls(language);
    const accents = within(
      rail.getByRole("radiogroup", { name: ar ? "اللون الأساسي" : "Accent" }),
    );
    for (const [accent, arabic, english] of [
      ["lime", "ليموني", "Lime"],
      ["amber", "كهرماني", "Amber"],
      ["teal", "فيروزي", "Teal"],
      ["cyan", "سماوي", "Cyan"],
      ["indigo", "نيلي", "Indigo"],
      ["rose", "وردي", "Rose"],
      ["slate", "رمادي", "Slate"],
    ] as const) {
      const swatch = accents.getByRole("radio", {
        name: ar ? arabic : english,
      });
      expect(swatch.style.getPropertyValue("--swatch")).toBe(
        accentColors[accent][theme],
      );
      await user.click(swatch);
      expect(swatch).toHaveAttribute("aria-checked", "true");
      // The chosen accent's name shows beside the label.
      expect(rail.getByText(ar ? arabic : english)).toBeInTheDocument();
      for (const provider of container.querySelectorAll<HTMLElement>(
        ".playground-region .tiraz-system",
      ))
        expect(provider.style.getPropertyValue("--action")).toBe(
          `var(--tiraz-action, ${accentColors[accent][theme]})`,
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
    expect(
      accents.getByRole("radio", { name: ar ? "أخضر" : "Green" }),
    ).toHaveAttribute("aria-checked", "true");
  },
);

it("selects an accent by keyboard, left to right in English and wrapping at the ends", async () => {
  persist(storageKeys.documentation, { language: "en", active: "button" });
  const user = userEvent.setup();
  render(<Workbench />);
  const accents = within(
    controls("en").getByRole("radiogroup", { name: "Accent" }),
  );
  accents.getByRole("radio", { name: "Green" }).focus();
  await user.keyboard("{ArrowRight}");
  expect(accents.getByRole("radio", { name: "Blue" })).toHaveFocus();
  expect(readSystem().accent).toBe("blue");
  await user.keyboard("{ArrowLeft}{ArrowUp}");
  const ink = accents.getByRole("radio", { name: "Ink" });
  expect(ink).toHaveFocus();
  expect(ink).toHaveAttribute("aria-checked", "true");
  // Only the chosen swatch is in the tab order.
  expect(
    accents.getAllByRole("radio").filter((radio) => radio.tabIndex === 0),
  ).toEqual([ink]);
  expect(readSystem().accent).toBe("ink");
});
it("keeps a Select's popup inside the settings Sheet on a narrow screen", async () => {
  const matchMedia = window.matchMedia;
  window.matchMedia = (query: string) => ({
    ...matchMedia(query),
    matches: query === "(width < 1024px)",
  });
  try {
    persist(storageKeys.documentation, { language: "en", active: "button" });
    const user = userEvent.setup();
    render(<Workbench />);
    await user.click(screen.getByRole("button", { name: "Customize" }));
    const dialog = screen.getByRole("dialog", {
      name: "Customize the preview",
    });
    const control = within(dialog).getByRole("combobox", { name: "Variant" });
    await user.click(control);
    expect(dialog).toContainElement(screen.getByRole("listbox"));
    await user.click(screen.getByRole("option", { name: "Ghost" }));
    expect(control).toHaveTextContent("Ghost");
    expect(dialog).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  } finally {
    window.matchMedia = matchMedia;
  }
});
it("switches playground digits with the numerals setting and emits it in copied code", async () => {
  persist(storageKeys.documentation, { language: "ar", active: "progress" });
  render(<Workbench />);
  const value = () =>
    preview().getByRole("progressbar").getAttribute("aria-valuetext");
  const arabic = () => controls().getByRole("button", { name: "مشرقية · ١٢٣" });
  expect(arabic()).toHaveAttribute("aria-pressed", "true");
  expect(value()).toContain("٦٤");
  await userEvent.click(
    controls().getByRole("button", { name: "غربية · 123" }),
  );
  expect(value()).toContain("64");
  expect(value()).not.toMatch(/[٠-٩]/);
  expect(readSystem().numerals).toBe("latn");
  expect(await shownCode()).toContain('"numerals":"latn"');
  await userEvent.click(screen.getByRole("tab", { name: "معاينة" }));
  await userEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط النظام" }),
  );
  expect(arabic()).toHaveAttribute("aria-pressed", "true");
  expect(value()).toContain("٦٤");
});
