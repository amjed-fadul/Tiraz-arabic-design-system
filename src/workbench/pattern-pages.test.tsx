import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
import { agentTaskCopy } from "../system/agent-task-copy";

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

it("orders a pattern page job first and code last", async () => {
  open("agent-task");
  // The heading says the job; the demo, its anatomy, placements and copy
  // follow, and the code comes last.
  expect(sections()).toEqual([
    "المعاينة التفاعلية",
    "تشريح النمط",
    "أين يوضع",
    "نصوص كل حالة",
    "استخدمه في تطبيقك",
  ]);
  expect(main().lastElementChild).toHaveClass("reference-section");
  // A part keeps the page it had.
  await userEvent.click(nav().getByRole("button", { name: "الأجزاء" }));
  await userEvent.click(nav().getByRole("button", { name: "صفوف المهام" }));
  expect(sections()).toEqual(["المعاينة التفاعلية", "استخدمه في تطبيقك"]);
});

it("pins the five zones and links the legend to parts", async () => {
  open("agent-task");
  const anatomy = screen.getByRole("region", { name: "تشريح النمط" });
  // One pin per zone, in the shared order, digits through numberLocale.
  const pins = Array.from(anatomy.querySelectorAll(".pattern-pin"));
  expect(pins.map((pin) => pin.textContent)).toEqual(["١", "٢", "٣", "٤", "٥"]);
  // The pins are a picture; the legend says the same in words.
  for (const pin of pins)
    expect(pin.closest('[aria-hidden="true"]')).not.toBeNull();
  const legend = within(anatomy).getByRole("list");
  expect(
    within(legend)
      .getAllByRole("listitem")
      .map((item) => item.querySelector(".pattern-legend-zone")?.textContent),
  ).toEqual(["الرأس", "الورقة", "الأدلة", "القرار", "المعلومات"]);
  // A new shared part opens the API reference at its table.
  await userEvent.click(
    within(legend).getByRole("button", { name: "StatusPill" }),
  );
  expect(
    (document.querySelector(".api-reference") as HTMLDetailsElement).open,
  ).toBe(true);
  expect(
    screen.getByRole("heading", { level: 3, name: "StatusPill" }),
  ).toHaveFocus();
  // An existing part opens its page.
  await userEvent.click(
    within(legend).getByRole("button", { name: "صفوف المهام" }),
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "صفوف المهام" }),
  ).toBeInTheDocument();
});

it("shows three inert placements", () => {
  open("agent-task");
  const placements = screen.getByRole("region", { name: "أين يوضع" });
  const stills = Array.from(placements.querySelectorAll(".pattern-still"));
  expect(stills).toHaveLength(3);
  for (const still of stills) {
    expect(still).toHaveAttribute("aria-hidden", "true");
    expect(still).toHaveAttribute("inert");
    // Its own provider, so its live region and portals stay inside.
    expect(still.querySelector(".tiraz-system")).not.toBeNull();
    expect(still.querySelector('[role="status"]')).not.toBeNull();
  }
  // A card, then plain inside a conversation and in a side panel.
  expect(
    stills.map((still) =>
      still.querySelector("[data-appearance]")?.getAttribute("data-appearance"),
    ),
  ).toEqual(["card", "plain", "plain"]);
  expect(stills[1].querySelector(".tz-chat-thread")).not.toBeNull();
  // Nothing in the section takes focus: every control sits in a still.
  for (const control of placements.querySelectorAll(
    "a[href], button, input, select, textarea, [tabindex]",
  ))
    expect(control.closest("[inert]")).not.toBeNull();
  expect(within(placements).queryAllByRole("button")).toEqual([]);
});

it("lists every default label in both languages and copies the current language", async () => {
  const user = userEvent.setup();
  open("agent-task");
  const section = () =>
    screen.getByRole("region", {
      name: /^(نصوص كل حالة|Copy for every state)$/,
    });
  const keys = Object.entries(agentTaskCopy.ar).flatMap(([key, value]) =>
    typeof value === "object"
      ? Object.keys(value).map((inner) => `${key}.${inner}`)
      : [typeof value === "function" ? `${key}()` : key],
  );
  const rows = within(within(section()).getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      Array.from(row.querySelectorAll("th, td"), (cell) => cell.textContent),
    );
  expect(rows.map(([key]) => key)).toEqual(keys);
  expect(rows).toContainEqual(["plan", "خطة مقترحة", "Proposed plan"]);
  expect(rows).toContainEqual(["stepStates.skipped", "تُخطّيت", "Skipped"]);
  // A count shows 3 and a time 72 seconds, each in its language's digits.
  expect(rows).toContainEqual([
    "waiting()",
    "متوقفة عند الخطوة ٣ حتى تقرّر",
    "Waiting at step 3 for your decision",
  ]);
  expect(rows).toContainEqual([
    "autoStart()",
    "تبدأ تلقائيًا خلال ١د ١٢ث",
    "Starts on its own in 1m 12s",
  ]);
  await user.click(
    within(section()).getByRole("button", { name: "نسخ النصوص العربية" }),
  );
  const arabic = JSON.parse(await navigator.clipboard.readText());
  expect(arabic).toMatchObject({
    plan: "خطة مقترحة",
    stepStates: { skipped: "تُخطّيت" },
  });
  expect(arabic).not.toHaveProperty("autoStart");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "لغة التوثيق" }),
    "en",
  );
  await user.click(
    within(section()).getByRole("button", { name: "Copy English labels" }),
  );
  expect(JSON.parse(await navigator.clipboard.readText())).toMatchObject({
    plan: "Proposed plan",
  });
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

it("names the job in the kicker", async () => {
  open("agent-task");
  const kicker = () => document.querySelector(".component-kicker")!.textContent;
  expect(kicker()).toBe("أنماط الذكاء الاصطناعي · فوّض");
  await userEvent.click(nav().getByRole("button", { name: "ما الذي تغيّر" }));
  expect(kicker()).toBe("أنماط الذكاء الاصطناعي · افهم وتحكّم");
  // A part names its group alone.
  await userEvent.click(nav().getByRole("button", { name: "الأجزاء" }));
  await userEvent.click(nav().getByRole("button", { name: "مقياس السياق" }));
  expect(kicker()).toBe("أنماط الذكاء الاصطناعي");
});
