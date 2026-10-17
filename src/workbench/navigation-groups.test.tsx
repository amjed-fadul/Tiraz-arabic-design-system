import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { catalog } from "./catalog";

it("keeps every implemented documentation page reachable once in expanded Arabic groups", async () => {
  render(<Workbench />);
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
  const items = within(nav).getAllByRole("button");
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
  expect(
    within(within(nav).getByRole("group", { name: "أنماط الذكاء الاصطناعي" }))
      .getAllByRole("button")
      .map((button) => button.textContent),
  ).toEqual([
    "أسئلة المستخدم",
    "بطاقة القرار",
    "تسلسل القرارات",
    "إجراءات التحديد",
    "مقياس السياق",
    "اختيار النموذج",
    "نتيجة الصورة",
    "المصادر والاستشهادات",
    "بطاقات النتائج",
    "المحادثة",
    "محرر الرسائل",
    "شريط الموجّه",
    "حالة التحميل",
    "مؤشر النشاط",
    "حالة النشاط",
    "صفوف المهام",
    "استدعاء الأداة",
    "ملخص الأدوات",
    "كتلة الشيفرة",
    "ماركداون",
    "النص المتدفق",
  ]);
  const user = userEvent.setup();
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
