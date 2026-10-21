import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { SystemProvider, TaskStarter, defaultConfig } from "./index";
import type { ContextItem, TaskStarterProps } from "./index";

// The menu and the picker open in the provider's layer, so every test sits in
// one. Arabic and right-to-left are the defaults.
const wrap = (node: React.ReactNode, config = {}) => (
  <SystemProvider config={{ ...defaultConfig, ...config }}>
    {node}
  </SystemProvider>
);
type HostProps = Partial<Omit<TaskStarterProps, "value">> & {
  initial?: string;
};
// The host owns the draft; a spy on onValueChange still sees every change.
function Host({ initial = "", onValueChange, ...props }: HostProps) {
  const [value, setValue] = useState(initial);
  return (
    <TaskStarter
      onSubmit={() => {}}
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
}
const options: ContextItem[] = [
  { id: "payments", label: "مدفوعات الموردين", kind: "تقرير" },
  { id: "madar", label: "شركة مدار", kind: "عميل" },
  { id: "al-nada", label: "مؤسسة الندى", kind: "عميل" },
];

it("hands the draft and its context to onSubmit and keeps it when the host rejects", async () => {
  const user = userEvent.setup();
  const context: ContextItem[] = [
    { id: "inv-1043", label: "INV-1043", kind: "فاتورة" },
    { id: "october", label: "تقرير أكتوبر", kind: "تقرير" },
  ];
  const submit = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(undefined);
  render(
    wrap(
      <Host initial="جهّز إقفال أكتوبر" context={context} onSubmit={submit} />,
    ),
  );
  const field = screen.getByRole("textbox", { name: "طلبك" });
  await user.click(field);
  await user.keyboard("{Enter}");
  expect(submit).toHaveBeenCalledExactlyOnceWith("جهّز إقفال أكتوبر", context);
  // The host turned it down: the draft stays, the reason is text, focus stays.
  expect(
    await screen.findByText("تعذّر الإرسال. مسودتك محفوظة، حاول مرة أخرى."),
  ).toBeVisible();
  expect(field).toHaveValue("جهّز إقفال أكتوبر");
  expect(field).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "إرسال" }));
  expect(submit).toHaveBeenCalledTimes(2);
  expect(submit).toHaveBeenLastCalledWith("جهّز إقفال أكتوبر", context);
});

it("opens the record picker on @ and chooses with the keyboard while the text area keeps focus", async () => {
  const user = userEvent.setup(),
    add = vi.fn(),
    change = vi.fn(),
    submit = vi.fn(),
    page = vi.fn();
  render(
    wrap(
      <div onKeyDown={page}>
        <Host
          mentionOptions={[
            ...options,
            { id: "october", label: "تقرير أكتوبر", kind: "تقرير" },
          ]}
          onAddContext={add}
          onValueChange={change}
          onSubmit={submit}
        />
      </div>,
    ),
  );
  const field = screen.getByRole("combobox", { name: "طلبك" });
  expect(field).toHaveAttribute("aria-expanded", "false");
  await user.click(field);
  await user.keyboard("@مد");
  // Only the records the query names, in the host's order.
  const list = screen.getByRole("listbox", { name: "إضافة سجل" });
  const [first, second] = within(list).getAllByRole("option");
  expect(within(list).getAllByRole("option")).toHaveLength(2);
  expect(second).toHaveAccessibleName(/شركة مدار/);
  expect(field).toHaveAttribute("aria-expanded", "true");
  expect(field).toHaveAttribute("aria-autocomplete", "list");
  expect(field).toHaveAttribute("aria-controls", list.id);
  expect(field).toHaveAttribute("aria-activedescendant", first.id);
  await user.keyboard("{ArrowDown}");
  expect(field).toHaveAttribute("aria-activedescendant", second.id);
  expect(second).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{Enter}");
  // Enter chose: the record joins, «@مد» goes, and nothing was sent.
  expect(add).toHaveBeenCalledExactlyOnceWith("madar");
  expect(change).toHaveBeenLastCalledWith("");
  expect(field).toHaveValue("");
  expect(field).toHaveFocus();
  expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole("listbox")).toBeNull();
  // Escape closes the picker and only the picker; with it shut, the page sees
  // the key again.
  await user.keyboard("@");
  expect(field).toHaveAttribute("aria-expanded", "true");
  page.mockClear();
  await user.keyboard("{Escape}");
  expect(field).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(page).not.toHaveBeenCalled();
  expect(field).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(page).toHaveBeenCalledTimes(1);
  // The search folds how Arabic is typed: «@اكتوبر» finds «تقرير أكتوبر».
  await user.keyboard("اكتوبر");
  expect(
    within(screen.getByRole("listbox", { name: "إضافة سجل" })).getByRole(
      "option",
      { name: /تقرير أكتوبر/ },
    ),
  ).toBeInTheDocument();
});

it("never chooses or submits while composing", async () => {
  const user = userEvent.setup(),
    add = vi.fn(),
    submit = vi.fn();
  render(
    wrap(
      <Host mentionOptions={options} onAddContext={add} onSubmit={submit} />,
    ),
  );
  const field = screen.getByRole("combobox", { name: "طلبك" });
  await user.click(field);
  await user.keyboard("@مد");
  const active = field.getAttribute("aria-activedescendant");
  expect(active).toBeTruthy();
  fireEvent.compositionStart(field);
  fireEvent.keyDown(field, { key: "Enter", keyCode: 229 });
  fireEvent.keyDown(field, { key: "Enter" });
  fireEvent.keyDown(field, { key: "ArrowDown", keyCode: 229 });
  expect(add).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  expect(field).toHaveAttribute("aria-activedescendant", active);
  // The open picker keeps filtering what is composed, as keyboards that compose
  // every word need, and its keys still do nothing.
  fireEvent.change(field, { target: { value: "@مدا" } });
  expect(screen.getAllByRole("option")).toHaveLength(1);
  fireEvent.keyDown(field, { key: "Enter", keyCode: 229 });
  expect(add).not.toHaveBeenCalled();
  fireEvent.compositionEnd(field);
  fireEvent.keyDown(field, { key: "Enter", isComposing: true });
  fireEvent.keyDown(field, { key: "Enter", keyCode: 229 });
  expect(add).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
  // Text that is still being composed never opens the picker; it opens once the
  // composition has ended, on what was written.
  fireEvent.change(field, { target: { value: "" } });
  expect(field).toHaveAttribute("aria-expanded", "false");
  fireEvent.compositionStart(field);
  fireEvent.change(field, { target: { value: "@مد" } });
  expect(field).toHaveAttribute("aria-expanded", "false");
  fireEvent.compositionEnd(field);
  expect(field).toHaveAttribute("aria-expanded", "true");
});

it("asks the host to pick when it supplies no options", async () => {
  const user = userEvent.setup(),
    mention = vi.fn();
  render(wrap(<Host onMention={mention} />));
  const field = screen.getByRole("textbox", { name: "طلبك" });
  await user.click(field);
  await user.keyboard("@مد");
  // Each change to the @ token asks again, with what follows the @.
  expect(mention.mock.calls).toEqual([[""], ["م"], ["مد"]]);
  expect(screen.queryByRole("listbox")).toBeNull();
  // The button asks with nothing typed, and adds nothing to the draft.
  await user.click(screen.getByRole("button", { name: "إضافة سجل" }));
  expect(mention).toHaveBeenLastCalledWith("");
  expect(field).toHaveValue("@مد");
});

it("keeps suggestions while typing and disables them while submitting", async () => {
  const user = userEvent.setup(),
    pick = vi.fn();
  let finish!: () => void;
  const submit = vi.fn(
    () => new Promise<void>((resolve) => (finish = resolve)),
  );
  render(
    wrap(
      <Host
        initial="لخّص"
        suggestions={[
          {
            id: "week",
            label: "لخّص أداء الأسبوع",
            prompt: "لخّص أداء هذا الأسبوع",
          },
          { id: "late", label: "من العملاء الأكثر تأخرًا؟" },
        ]}
        onSuggestion={pick}
        onSubmit={submit}
      />,
    ),
  );
  const group = screen.getByRole("list", { name: "مقترحة من هذه الصفحة" });
  const buttons = within(group).getAllByRole("button");
  // They stay while there is text, and report which one was chosen.
  expect(buttons).toHaveLength(2);
  expect(buttons[0]).toBeEnabled();
  await user.click(buttons[1]);
  expect(pick).toHaveBeenCalledExactlyOnceWith("late");
  const field = screen.getByRole("textbox", { name: "طلبك" });
  await user.click(field);
  await user.keyboard("{Enter}");
  expect(submit).toHaveBeenCalledTimes(1);
  buttons.forEach((button) => expect(button).toBeDisabled());
  expect(field).toHaveAttribute("readonly");
  await act(async () => finish());
  buttons.forEach((button) => expect(button).toBeEnabled());
  expect(field).not.toHaveAttribute("readonly");
});

it("offers modes as radio items with usage and returns focus to the trigger on Escape", async () => {
  const user = userEvent.setup(),
    change = vi.fn(),
    modelChange = vi.fn();
  render(
    wrap(
      <Host
        modes={[
          {
            id: "auto",
            label: "تلقائي",
            description: "يختار النموذج الأنسب لكل طلب",
          },
          {
            id: "fast",
            label: "سريع",
            description: "للأسئلة القصيرة والردود الفورية",
          },
          {
            id: "deep",
            label: "معمّق",
            description: "للتحليل والتقارير، أبطأ وأدق",
          },
        ]}
        mode="auto"
        onModeChange={change}
        models={[
          { id: "swift", name: "Swift" },
          { id: "steady", name: "Steady" },
          { id: "offline", name: "Offline", disabled: true },
        ]}
        model="swift"
        onModelChange={modelChange}
        contextUsage={{ used: 32, capacity: 100 }}
        context={[
          { id: "inv-1043", label: "INV-1043" },
          { id: "october", label: "تقرير أكتوبر" },
        ]}
      />,
    ),
  );
  const trigger = screen.getByRole("button", { name: /^الوضع: تلقائي/ });
  await user.click(trigger);
  const modes = screen.getAllByRole("menuitemradio");
  // Three modes with their descriptions, then the models as a second section.
  expect(modes).toHaveLength(6);
  expect(modes[0]).toHaveAttribute("aria-checked", "true");
  expect(modes[2]).toHaveAccessibleName("معمّق");
  expect(modes[2]).toHaveAccessibleDescription("للتحليل والتقارير، أبطأ وأدق");
  expect(modes[3]).toHaveAttribute("aria-checked", "true");
  expect(modes[5]).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByText("السياق المستخدم ٣٢٪ · سجلّان مرفقان")).toBeVisible();
  await user.click(modes[2]);
  expect(change).toHaveBeenCalledExactlyOnceWith("deep");
  // The host changes the mode; choosing one closes the menu.
  expect(screen.queryByRole("menu")).toBeNull();
  await user.click(trigger);
  await user.click(screen.getByRole("menuitemradio", { name: "Steady" }));
  expect(modelChange).toHaveBeenCalledExactlyOnceWith("steady");
  await user.click(trigger);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();
  expect(trigger).toHaveFocus();
});

it("keeps context chips on Backspace in an empty text area", async () => {
  const user = userEvent.setup(),
    remove = vi.fn();
  render(
    wrap(
      <Host
        context={[{ id: "inv-1043", label: "INV-1043" }]}
        onRemoveContext={remove}
      />,
    ),
  );
  await user.click(screen.getByRole("textbox", { name: "طلبك" }));
  await user.keyboard("{Backspace}{Backspace}");
  expect(remove).not.toHaveBeenCalled();
  expect(screen.getByText("INV-1043")).toBeVisible();
  // Only its own button removes it.
  await user.click(screen.getByRole("button", { name: "إزالة INV-1043" }));
  expect(remove).toHaveBeenCalledExactlyOnceWith("inv-1043");
});

it("says a context crossing in its own region", () => {
  const starter = (used: number) =>
    wrap(
      <Host
        modes={[{ id: "auto", label: "تلقائي" }]}
        mode="auto"
        contextUsage={{ used, capacity: 128_000 }}
      />,
    );
  const view = render(starter(64_000));
  const region = document.querySelector(
    ".tz-task-starter > [role='status']",
  ) as HTMLElement;
  expect(region).toBeEmptyDOMElement();
  view.rerender(starter(104_000));
  expect(region.textContent).toBe("السياق: يقترب من الامتلاء");
});

it("lets a host announce context changes without replaying muted additions", () => {
  const start = (context: ContextItem[], announcement: "off" | "polite") =>
    wrap(<Host context={context} announcement={announcement} />);
  const view = render(start([], "off"));
  view.rerender(start([options[0]], "off"));
  expect(
    document.querySelector(
      '.tz-task-starter [role="status"], .tz-task-starter [aria-live="polite"]',
    ),
  ).toBeNull();
  view.rerender(start([options[0]], "polite"));
  expect(
    document.querySelector('.tz-task-starter > [role="status"]'),
  ).toBeEmptyDOMElement();
  view.rerender(start([options[0], options[1]], "polite"));
  expect(
    document.querySelector('.tz-task-starter > [role="status"]'),
  ).toHaveTextContent(options[1].label);
});

it("keeps submission errors accessible without live announcements when the host owns them", async () => {
  const user = userEvent.setup();
  render(
    wrap(
      <Host
        initial="Prepare the launch plan."
        announcement="off"
        onSubmit={async () => {
          throw new Error("offline");
        }}
      />,
    ),
  );
  const field = screen.getByRole("textbox", { name: "طلبك" });
  await user.click(field);
  await user.keyboard("{Enter}");
  const error = await screen.findByText(
    "تعذّر الإرسال. مسودتك محفوظة، حاول مرة أخرى.",
  );
  expect(error).toBeVisible();
  expect(field).toHaveAccessibleDescription(error.textContent!);
  expect(field).toHaveFocus();
  expect(screen.queryByRole("status")).toBeNull();
});
