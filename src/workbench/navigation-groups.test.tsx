import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { catalog } from "./catalog";
import { screens } from "../examples/frame/screen";
import { persist, storageKeys } from "./storage";

it("keeps every implemented documentation page reachable once in expanded Arabic groups", async () => {
  render(<Workbench />);
  const user = userEvent.setup();
  const nav = screen.getByRole("navigation", { name: "المكوّنات" });
  const groups = within(nav).getAllByRole("group");
  expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual([
    "شاشات",
    "اسأل",
    "فوّض",
    "أنشئ",
    "افهم وتحكّم",
    "الأجزاء",
    "النماذج",
    "الملفات",
    "التنقّل",
    "البيانات",
    "العرض والتنبيهات",
    "النوافذ",
    "الرسوم",
  ]);
  // The parts open from their disclosure; then every page, and every screen,
  // is listed once.
  await user.click(within(nav).getByRole("button", { name: "الأجزاء" }));
  const items = within(nav)
    .getAllByRole("button")
    .filter((item) => !item.hasAttribute("aria-expanded"));
  expect(items.map((item) => item.textContent).sort()).toEqual(
    [...catalog.filter((item) => item.id !== "field"), ...screens]
      .map((item) => item.name[0])
      .sort(),
  );
  for (const group of groups)
    expect(within(group).getAllByRole("button").length).toBeGreaterThan(0);
  expect(
    within(nav).queryByRole("group", { name: "الملفات" }),
  ).toBeInTheDocument();
  expect(
    within(nav).queryByText("أنماط الذكاء الاصطناعي"),
  ).not.toBeInTheDocument();
  await user.click(within(nav).getByRole("button", { name: "شريط التنقّل" }));
  expect(
    within(nav).getByRole("button", { name: "شريط التنقّل" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    screen.getByRole("heading", { level: 1, name: "شريط التنقّل" }),
  ).toBeInTheDocument();
});

it("translates groups and preserves the selected documentation page and URL", async () => {
  render(<Workbench />);
  const user = userEvent.setup();
  const initialUrl = window.location.href;
  await user.click(
    within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
      "button",
      { name: "الأزرار" },
    ),
  );
  await user.click(screen.getByRole("button", { name: "English" }));
  const nav = screen.getByRole("navigation", { name: "Components" });
  expect(
    within(nav)
      .getAllByRole("group")
      .map((group) => group.getAttribute("aria-label")),
  ).toEqual([
    "Screens",
    "Ask",
    "Delegate",
    "Create",
    "Understand and control",
    "Parts",
    "Forms",
    "Files",
    "Navigation",
    "Data",
    "Display & feedback",
    "Overlays",
    "Charts",
  ]);
  expect(within(nav).getByRole("button", { name: "Button" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(window.location.href).toBe(initialUrl);
  expect(
    within(nav).queryByRole("group", { name: "Files" }),
  ).toBeInTheDocument();
  expect(within(nav).queryByText("AI patterns")).not.toBeInTheDocument();
  const toggle = screen.getByRole("button", { name: "العربية" });
  expect(within(toggle).getByText("العربية")).toHaveAttribute("lang", "ar");
  expect(toggle).toHaveFocus();
  expect(
    screen.queryByRole("combobox", { name: "Documentation language" }),
  ).toBeNull();
  const header = document.querySelector(".docs-header")!;
  expect(header).not.toHaveTextContent("Component documentation");
  expect(header).not.toHaveTextContent("Dashboard example");
  await user.keyboard("{Enter}");
  expect(screen.getByRole("button", { name: "English" })).toHaveFocus();
  expect(document.documentElement).toHaveAttribute("lang", "ar");
  expect(
    JSON.parse(localStorage.getItem(storageKeys.documentation)!).language,
  ).toBe("ar");
  expect(
    screen.getByRole("heading", { level: 1, name: "الأزرار" }),
  ).toBeVisible();
});

it("starts with Screens, groups jobs without an umbrella label, and folds Parts", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  expect(
    nav
      .getAllByRole("heading", { level: 2 })
      .slice(0, 6)
      .map((heading) => heading.textContent),
  ).toEqual(["شاشات", "اسأل", "فوّض", "أنشئ", "افهم وتحكّم", "الأجزاء"]);
  expect(
    nav
      .getAllByRole("button")
      .slice(0, screens.length + 15)
      .map((button) => button.textContent),
  ).toEqual([
    "مساحة عمل المساعد",
    ...screens.map((item) => item.name[0]),
    "ابدأ مهمة",
    "إجابة موثّقة",
    "اسأل بياناتك",
    "مهمة الوكيل",
    "أسئلة قبل البدء",
    "طلب موافقة",
    "سلسلة موافقات",
    "صندوق القرارات",
    "تعديلات مقترحة",
    "توليد صورة",
    "مسودة للمراجعة",
    "ما الذي تغيّر",
    "إعدادات المساعد",
    "الأجزاء",
  ]);
  // The screens open as pages of the docs, never in a new tab.
  expect(nav.queryAllByRole("link")).toEqual([]);
  // The parts are folded, and not rendered until they open.
  const parts = nav.getByRole("button", { name: "الأجزاء" });
  expect(parts).toHaveAttribute("aria-expanded", "false");
  const region = document.getElementById(parts.getAttribute("aria-controls")!)!;
  expect(region).toBeEmptyDOMElement();
  await user.click(parts);
  expect(parts).toHaveAttribute("aria-expanded", "true");
  expect(
    within(region)
      .getAllByRole("button")
      .map((button) => button.textContent),
  ).toEqual([
    "إجراءات التحديد",
    "مقياس السياق",
    "اختيار النموذج",
    "نتيجة الصورة",
    "المصادر والاستشهادات",
    "بطاقات النتائج",
    "المحادثة",
    "محرر الرسائل",
    "شريط الطلب",
    "مؤشر النشاط",
    "حالة النشاط",
    "صفوف المهام",
    "استدعاء الأداة",
    "ملخص الأدوات",
    "النص المتتابع",
  ]);
  expect(
    within(nav.getByRole("group", { name: "العرض والتنبيهات" }))
      .getAllByRole("button")
      .map((button) => button.textContent)
      .slice(-4),
  ).toEqual(["حالة التحميل", "كتلة الكود", "ماركداون", "الطرفية"]);
});

it("remembers the Parts disclosure and opens it for a part page", async () => {
  const user = userEvent.setup();
  const nav = () =>
    within(screen.getByRole("navigation", { name: "المكوّنات" }));
  const parts = () => nav().getByRole("button", { name: "الأجزاء" });
  const saved = () =>
    JSON.parse(localStorage.getItem(storageKeys.documentation)!);
  let view = render(<Workbench />);
  expect(parts()).toHaveAttribute("aria-expanded", "false");
  expect(nav().queryByRole("button", { name: "صفوف المهام" })).toBeNull();
  await user.click(parts());
  expect(saved().aiPartsOpen).toBe(true);
  view.unmount();
  view = render(<Workbench />);
  expect(parts()).toHaveAttribute("aria-expanded", "true");
  await user.click(parts());
  expect(saved().aiPartsOpen).toBe(false);
  view.unmount();
  // A value that is not true or false reads as closed.
  persist(storageKeys.documentation, { active: "button", aiPartsOpen: "yes" });
  view = render(<Workbench />);
  expect(parts()).toHaveAttribute("aria-expanded", "false");
  view.unmount();
  // A part page opens it, in the sidebar and in the drawer that shares it.
  persist(storageKeys.documentation, {
    active: "task-rows",
    aiPartsOpen: false,
  });
  render(<Workbench />);
  expect(parts()).toHaveAttribute("aria-expanded", "true");
  expect(nav().getByRole("button", { name: "صفوف المهام" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await user.click(screen.getByRole("button", { name: "المكوّنات" }));
  const drawer = within(screen.getByRole("dialog", { name: "المكوّنات" }));
  expect(drawer.getByRole("button", { name: "الأجزاء" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(drawer.getByRole("button", { name: "صفوف المهام" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
