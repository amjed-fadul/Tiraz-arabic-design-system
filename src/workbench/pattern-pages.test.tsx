import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";

function open(active: string) {
  persist(storageKeys.documentation, { language: "ar", active });
  return render(<Workbench />);
}
const main = () => screen.getByRole("main");
const nav = () => within(screen.getByRole("navigation", { name: "المكوّنات" }));
const sections = () =>
  within(main())
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);

it("shows a pattern page as its prompt, playground, usage guidelines and API reference, and nothing else", async () => {
  open("agent-task");
  // No Anatomy, Placements or Copy: the prompt, the demo and its guidelines,
  // and the API reference last.
  expect(sections()).toEqual([
    "استخدمه في تطبيقك",
    "المعاينة التفاعلية",
    "إرشادات الاستخدام",
    "دليل الخصائص",
  ]);
  const reference = main().lastElementChild as HTMLElement;
  expect(reference).toHaveClass("reference-section");
  // The page's own table alone: no table for each shared part.
  expect(within(reference).getAllByRole("table")).toHaveLength(1);
  expect(within(reference).queryByRole("heading", { level: 3 })).toBeNull();
  // A part has the same page.
  await userEvent.click(nav().getByRole("button", { name: "الأجزاء" }));
  await userEvent.click(nav().getByRole("button", { name: "صفوف المهام" }));
  expect(sections()).toEqual([
    "استخدمه في تطبيقك",
    "المعاينة التفاعلية",
    "إرشادات الاستخدام",
    "دليل الخصائص",
  ]);
});

it("says what a pattern replaces, with links", async () => {
  open("task-starter");
  const notes = () => document.querySelector(".tz-demo-notes") as HTMLElement;
  const columns = () =>
    within(notes())
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
  expect(columns()).toEqual(["استخدمه عندما", "يحل محل", "لاحظ"]);
  expect(
    within(notes())
      .getAllByRole("button")
      .map((link) => link.textContent),
  ).toEqual(["شريط الطلب", "محرر الرسائل", "اختيار النموذج", "مقياس السياق"]);
  await userEvent.click(
    within(notes()).getByRole("button", { name: "محرر الرسائل" }),
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "محرر الرسائل" }),
  ).toBeInTheDocument();
  // The part's page sits in the Parts section, which opened for it.
  expect(nav().getByRole("button", { name: "محرر الرسائل" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // A pattern that replaces nothing keeps its alternatives.
  await userEvent.click(nav().getByRole("button", { name: "طلب موافقة" }));
  expect(columns()).toEqual(["استخدمه عندما", "استخدم غيره عندما", "لاحظ"]);
});
