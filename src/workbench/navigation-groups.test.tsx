import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { catalog } from "./catalog";
import { persist, storageKeys } from "./storage";

it("keeps every implemented documentation page reachable once in expanded Arabic groups", async () => {
  render(<Workbench />);
  const user = userEvent.setup();
  const nav = screen.getByRole("navigation", { name: "المكوّنات" });
  const groups = within(nav).getAllByRole("group");
  expect(groups.map((group) => group.getAttribute("aria-label"))).toEqual([
    "أنماط الذكاء الاصطناعي",
    "النماذج",
    "الملفات",
    "التنقّل",
    "البيانات",
    "العرض والتنبيهات",
    "النوافذ",
    "الرسوم",
  ]);
  // The parts open from their disclosure; then every page is listed once.
  await user.click(within(nav).getByRole("button", { name: "الأجزاء" }));
  const items = within(nav)
    .getAllByRole("button")
    .filter((item) => !item.hasAttribute("aria-expanded"));
  expect(items.map((item) => item.textContent).sort()).toEqual(
    catalog
      .filter((item) => item.id !== "field")
      .map((item) => item.name[0])
      .sort(),
  );
  for (const group of groups)
    expect(within(group).getAllByRole("button").length).toBeGreaterThan(0);
  expect(
    within(nav).queryByRole("group", { name: "الملفات" }),
  ).toBeInTheDocument();
  expect(
    within(nav).getByRole("group", { name: "أنماط الذكاء الاصطناعي" }),
  ).toBeInTheDocument();
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
  await user.selectOptions(
    screen.getByRole("combobox", { name: "لغة التوثيق" }),
    "en",
  );
  const nav = screen.getByRole("navigation", { name: "Components" });
  expect(
    within(nav)
      .getAllByRole("group")
      .map((group) => group.getAttribute("aria-label")),
  ).toEqual([
    "AI patterns",
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
  expect(
    within(nav).getByRole("group", { name: "AI patterns" }),
  ).toBeInTheDocument();
});

it("groups AI patterns by job, folds the parts and ends Display with content blocks", async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  const ai = within(nav.getByRole("group", { name: "أنماط الذكاء الاصطناعي" }));
  expect(
    ai
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["اسأل", "فوّض", "أنشئ", "افهم وتحكّم", "شاشات", "الأجزاء"]);
  expect(ai.getAllByRole("button").map((button) => button.textContent)).toEqual(
    [
      "ابدأ مهمة",
      "إجابة موثّقة",
      "مهمة الوكيل",
      "أسئلة قبل البدء",
      "طلب موافقة",
      "سلسلة موافقات",
      "تعديلات مقترحة",
      "توليد صورة",
      "ما الذي تغيّر",
      "تطبيق المحادثة",
      "الأجزاء",
    ],
  );
  expect(ai.getByRole("link", { name: "لوحة بمساعد" })).toHaveAttribute(
    "href",
    "/examples/dashboard",
  );
  // The parts are folded, and not rendered until they open.
  const parts = ai.getByRole("button", { name: "الأجزاء" });
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
