import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AssistantControls } from "./index";
import type {
  AssistantControlsProps,
  AssistantMemoryItem,
  AssistantPermission,
} from "./index";

// Arabic and right-to-left are the defaults.
const permissions: AssistantPermission[] = [
  { id: "ledger", label: "قراءة دفتر الحسابات والفواتير", level: "auto" },
  {
    id: "accruals",
    label: "تسجيل قيود الاستحقاق",
    level: "sensitive",
    risks: ["sensitive"],
  },
  // The host asks for more than an irreversible action may have.
  {
    id: "messages",
    label: "إرسال رسائل للعملاء",
    level: "auto",
    risks: ["sensitive", "irreversible"],
  },
];
const memory: AssistantMemoryItem[] = [
  {
    id: "m1",
    text: "تفضّل شركة مدار التواصل مع سارة العتيبي",
    category: "العملاء",
    source: "من محادثة",
    date: "١٤ أكتوبر",
  },
  {
    id: "m3",
    text: "يريد المدير المالي ملخص الإقفال في صفحة واحدة",
    category: "الإقفال",
  },
  {
    id: "m2",
    text: "ترسل مؤسسة الندى دفعاتها في آخر الشهر",
    category: "العملاء",
    paused: true,
  },
];

it("locks irreversible actions to «اسأل دائمًا» whatever the host passes", async () => {
  const user = userEvent.setup(),
    onPermissionChange = vi.fn();
  render(
    <AssistantControls
      permissions={permissions}
      onPermissionChange={onPermissionChange}
    />,
  );
  const messages = screen.getByRole("group", { name: /^إرسال رسائل للعملاء/ });
  const always = within(messages).getByRole("radio", { name: "اسأل دائمًا" });
  expect(always).toBeChecked();
  for (const name of ["إن كان حساسًا", "تلقائي بالكامل"])
    expect(within(messages).getByRole("radio", { name })).toBeDisabled();
  expect(messages).toHaveAccessibleDescription(
    "لا يمكن التراجع عن هذا الإجراء، لذلك يسألك المساعد قبله دائمًا.",
  );
  expect(within(messages).getByText("حساس")).toBeVisible();
  expect(within(messages).getByText("لا يمكن التراجع")).toBeVisible();
  // Nothing the person does in a locked row reaches the host.
  await user.click(
    within(messages).getByRole("radio", { name: "تلقائي بالكامل" }),
  );
  await user.click(always);
  expect(onPermissionChange).not.toHaveBeenCalled();
  expect(always).toBeChecked();
  // An action that can be undone takes the person's choice to the host.
  const accruals = screen.getByRole("group", {
    name: /^تسجيل قيود الاستحقاق/,
  });
  expect(
    within(accruals).getByRole("radio", { name: "إن كان حساسًا" }),
  ).toBeChecked();
  await user.click(
    within(accruals).getByRole("radio", { name: "اسأل دائمًا" }),
  );
  expect(onPermissionChange).toHaveBeenCalledExactlyOnceWith(
    "accruals",
    "always",
  );
});

it("groups memory by category and pauses or deletes each item by name", async () => {
  const user = userEvent.setup(),
    onMemoryPauseChange = vi.fn(),
    onMemoryDelete = vi.fn(),
    onMemoryEnabledChange = vi.fn();
  const controls = (props: Partial<AssistantControlsProps> = {}) => (
    <AssistantControls
      memoryEnabled
      onMemoryEnabledChange={onMemoryEnabledChange}
      memory={memory}
      onMemoryPauseChange={onMemoryPauseChange}
      onMemoryDelete={onMemoryDelete}
      {...props}
    />
  );
  const view = render(controls());
  const section = screen.getByRole("region", { name: "إعدادات المساعد" });
  // The categories in the order they first appear, one level below «الذاكرة».
  expect(
    within(section)
      .getAllByRole("heading", { level: 5 })
      .map((heading) => heading.textContent),
  ).toEqual(["العملاء", "الإقفال"]);
  expect(screen.getByText("من محادثة · ١٤ أكتوبر")).toBeVisible();
  await user.click(
    screen.getByRole("button", {
      name: "إيقاف مؤقت تفضّل شركة مدار التواصل مع سارة العتيبي",
    }),
  );
  expect(onMemoryPauseChange).toHaveBeenCalledExactlyOnceWith("m1", true);
  expect(screen.getByText("متوقف مؤقتًا")).toBeVisible();
  await user.click(
    screen.getByRole("button", {
      name: "استئناف ترسل مؤسسة الندى دفعاتها في آخر الشهر",
    }),
  );
  expect(onMemoryPauseChange).toHaveBeenLastCalledWith("m2", false);
  // Delete asks the host, and the item stays until the host removes it.
  const remove = screen.getByRole("button", {
    name: "حذف تفضّل شركة مدار التواصل مع سارة العتيبي",
  });
  await user.click(remove);
  expect(onMemoryDelete).toHaveBeenCalledExactlyOnceWith("m1");
  expect(remove).toBeInTheDocument();
  const kept = memory.filter((item) => item.id !== "m1");
  view.rerender(controls({ memory: kept }));
  expect(remove).not.toBeInTheDocument();
  expect(section).toHaveFocus();
  // The switch asks too; with memory off, the note sits over the list.
  expect(screen.queryByText("لا يستخدم المساعد الذاكرة الآن.")).toBeNull();
  await user.click(screen.getByRole("switch", { name: "استخدم الذاكرة" }));
  expect(onMemoryEnabledChange).toHaveBeenCalledExactlyOnceWith(false);
  view.rerender(controls({ memory: kept, memoryEnabled: false }));
  expect(
    screen.getByRole("switch", { name: "استخدم الذاكرة" }),
  ).not.toBeChecked();
  expect(screen.getByText("لا يستخدم المساعد الذاكرة الآن.")).toBeVisible();
});
