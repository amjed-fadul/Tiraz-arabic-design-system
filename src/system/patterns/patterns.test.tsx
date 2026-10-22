import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { expect, it } from "vitest";
import { SystemProvider } from "../Provider";
import { defaultConfig } from "../config";
import { CustomerEditSheet, InvoiceActions, PreferenceSettings } from "./index";
import type { ActionContext, CustomerData, InvoiceAction } from "./index";

const customer = { id: "c1", name: "Amal", email: "amal@example.com" };
const invoice = {
  id: "INV-1",
  fields: [{ id: "total", label: "Total", value: "AED 42" }],
};
const customerLabels = {
  edit: "Edit customer",
  title: "Customer",
  description: "Account details",
  close: "Close",
  name: "Name",
  email: "Email",
  save: "Save",
  saving: "Saving",
  saved: "Customer saved",
  cancel: "Cancel",
  error: "Unable to save",
};
const preferenceLabels = {
  title: "Preferences",
  save: "Save preferences",
  saving: "Saving preferences",
  cancel: "Cancel",
  saved: "Preferences saved",
  error: "Unable to save preferences",
};
const invoiceLabels = {
  actions: "Actions",
  details: "View details",
  title: "Invoice details",
  description: "Invoice summary",
  close: "Close",
  working: "Working",
  cancel: "Cancel action",
  success: "Action complete",
  error: "Action failed",
};
const remove: InvoiceAction = {
  id: "delete",
  label: "Delete invoice",
  destructive: true,
  confirmation: {
    title: "Delete this invoice?",
    description: "This permanently removes INV-1.",
    confirm: "Delete permanently",
    cancel: "Keep invoice",
    close: "Close confirmation",
  },
};
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function wrap(children: ReactNode, direction: "ltr" | "rtl" = "ltr") {
  return render(
    <SystemProvider config={{ ...defaultConfig, direction }}>
      {children}
    </SystemProvider>,
  );
}

it("keeps a customer draft on failure, blocks duplicate saves, and closes only on accepted retry", async () => {
  const first = deferred(),
    second = deferred();
  const submissions: CustomerData[] = [];
  wrap(
    <CustomerEditSheet
      customer={customer}
      labels={customerLabels}
      onSave={(value) => {
        submissions.push(value);
        return submissions.length === 1 ? first.promise : second.promise;
      }}
    />,
  );
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  const edit = screen.getByRole("button", { name: "Edit customer" });
  await userEvent.click(edit);
  await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "Name" }),
    "Amal Saleh",
  );
  const save = screen.getByRole("button", { name: "Save" });
  await userEvent.click(save);
  fireEvent.submit(save.closest("form")!);
  expect(submissions).toEqual([
    { id: "c1", name: "Amal Saleh", email: "amal@example.com" },
  ]);
  expect(save).toHaveFocus();
  expect(save).not.toBeDisabled();
  expect(save).toHaveAttribute("aria-disabled", "true");
  await act(async () => first.reject(new Error("secret backend message")));
  expect(save).toHaveAccessibleDescription("Unable to save");
  expect(screen.getByRole("status")).toHaveTextContent("Unable to save");
  expect(screen.queryByText("secret backend message")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
    "Amal Saleh",
  );
  await userEvent.click(save);
  await act(async () => second.resolve());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await waitFor(() => expect(edit).toHaveFocus());
  expect(screen.getByRole("status")).toHaveTextContent("Customer saved");
});

it("aborts a cancelled customer save and ignores its result in a reopened editor", async () => {
  const pending = deferred();
  let signal!: AbortSignal;
  wrap(
    <CustomerEditSheet
      customer={customer}
      labels={customerLabels}
      onSave={(_, context) => {
        signal = context.signal;
        return pending.promise;
      }}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Edit customer" }));
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(signal.aborted).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Edit customer" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Name" }), " new");
  await act(async () => pending.resolve());
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Amal new");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("invalidates customer saves when the entity changes or the editor unmounts", async () => {
  const pending = deferred();
  const signals: AbortSignal[] = [];
  const save = (_: CustomerData, context: ActionContext) => {
    signals.push(context.signal);
    return pending.promise;
  };
  const view = wrap(
    <CustomerEditSheet
      customer={customer}
      labels={customerLabels}
      onSave={save}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Edit customer" }));
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  view.rerender(
    <SystemProvider>
      <CustomerEditSheet
        customer={{ ...customer, id: "c2", name: "Noor" }}
        labels={customerLabels}
        onSave={save}
      />
    </SystemProvider>,
  );
  expect(signals[0].aborted).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Edit customer" }));
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Noor");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
  view.unmount();
  expect(signals[1].aborted).toBe(true);
  await act(async () => pending.resolve());
});

it("retains failed preferences, preserves edits across equivalent parent values and resets cancellation", async () => {
  const pending = deferred();
  const submissions: Record<string, boolean>[] = [];
  const props = {
    value: { email: false },
    items: [{ id: "email", label: "Email notifications" }],
    labels: preferenceLabels,
    onSave: (next: Record<string, boolean>) => {
      submissions.push(next);
      return pending.promise;
    },
  };
  const view = wrap(<PreferenceSettings {...props} />);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await userEvent.click(screen.getByRole("switch"));
  view.rerender(
    <SystemProvider>
      <PreferenceSettings {...props} value={{ email: false }} />
    </SystemProvider>,
  );
  const save = screen.getByRole("button", { name: "Save preferences" });
  await userEvent.click(save);
  fireEvent.submit(save.closest("form")!);
  expect(submissions).toEqual([{ email: true }]);
  expect(save).toHaveFocus();
  expect(save).not.toBeDisabled();
  await act(async () => pending.reject(new Error("offline")));
  expect(save).toHaveAccessibleDescription("Unable to save preferences");
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("aborts preferences on cancel and unmount without showing a late receipt", async () => {
  const pending = deferred(),
    second = deferred();
  const signals: AbortSignal[] = [];
  const view = wrap(
    <PreferenceSettings
      value={{ email: false }}
      items={[{ id: "email", label: "Email" }]}
      labels={preferenceLabels}
      onSave={(_, context) => {
        signals.push(context.signal);
        return signals.length === 1 ? pending.promise : second.promise;
      }}
    />,
  );
  await userEvent.click(screen.getByRole("switch"));
  await userEvent.click(
    screen.getByRole("button", { name: "Save preferences" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(signals[0].aborted).toBe(true);
  await act(async () => pending.resolve());
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await userEvent.click(
    screen.getByRole("button", { name: "Save preferences" }),
  );
  view.unmount();
  expect(signals[1].aborted).toBe(true);
  await act(async () => second.resolve());
});

it("announces preference acceptance when the caller updates persisted values", async () => {
  function Host() {
    const [value, setValue] = useState<Record<string, boolean>>({
      email: false,
    });
    return (
      <PreferenceSettings
        value={value}
        items={[{ id: "email", label: "Email" }]}
        labels={preferenceLabels}
        onSave={async (next) => setValue(next)}
      />
    );
  }
  wrap(<Host />);
  await userEvent.click(screen.getByRole("switch"));
  await userEvent.click(
    screen.getByRole("button", { name: "Save preferences" }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Preferences saved");
  await userEvent.click(screen.getByRole("switch"));
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
});

it.each([false, true])(
  "requires destructive confirmation and restores menu focus (details=%s)",
  async (details) => {
    const pending = deferred();
    const calls: string[] = [];
    wrap(
      <InvoiceActions
        invoice={invoice}
        actions={[remove]}
        labels={invoiceLabels}
        actionsInDetails={details}
        onAction={(id, record) => {
          calls.push(`${id}:${record.id}`);
          return pending.promise;
        }}
      />,
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    if (details)
      await userEvent.click(
        screen.getByRole("button", { name: "View details" }),
      );
    const menu = screen.getByRole("button", { name: "Actions" });
    await userEvent.click(menu);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Delete invoice" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Delete this invoice?" });
    expect(dialog).toHaveAccessibleDescription(
      "This permanently removes INV-1.",
    );
    expect(calls).toEqual([]);
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).not.toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(menu).toHaveFocus());
    expect(calls).toEqual([]);
    await userEvent.click(menu);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Delete invoice" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );
    expect(calls).toEqual(["delete:INV-1"]);
    expect(
      screen.queryByRole("dialog", { name: "Delete this invoice?" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(menu).toHaveFocus());
    expect(menu).toHaveAttribute("aria-busy", "true");
    expect(menu).not.toBeDisabled();
    await act(async () => pending.resolve());
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Action complete");
  },
);

it("returns focus to invoice Actions when cancellation removes its button and ignores late failures", async () => {
  const pending = deferred();
  let signal!: AbortSignal;
  wrap(
    <InvoiceActions
      invoice={invoice}
      actions={[{ id: "send", label: "Send" }]}
      labels={invoiceLabels}
      onAction={(_, __, context) => {
        signal = context.signal;
        return pending.promise;
      }}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Actions" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Send" }));
  await userEvent.click(screen.getByRole("button", { name: "Cancel action" }));
  expect(signal.aborted).toBe(true);
  expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  await act(async () => pending.reject(new Error("late")));
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("aborts an invoice action on details close and keeps nested menu Escape inside the Sheet", async () => {
  const pending = deferred();
  let signal!: AbortSignal;
  wrap(
    <InvoiceActions
      invoice={invoice}
      actions={[{ id: "send", label: "Send" }]}
      labels={invoiceLabels}
      actionsInDetails
      onAction={(_, __, context) => {
        signal = context.signal;
        return pending.promise;
      }}
    />,
  );
  const details = screen.getByRole("button", { name: "View details" });
  await userEvent.click(details);
  const dialog = within(screen.getByRole("dialog"));
  const actions = dialog.getByRole("button", { name: "Actions" });
  await userEvent.click(actions);
  await userEvent.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(actions).toHaveFocus();
  await userEvent.click(actions);
  await userEvent.click(dialog.getByRole("menuitem", { name: "Send" }));
  await userEvent.click(dialog.getByRole("button", { name: "Close" }));
  expect(signal.aborted).toBe(true);
  await waitFor(() => expect(details).toHaveFocus());
  await act(async () => pending.resolve());
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("invalidates pending invoice work on entity replacement and unmount", async () => {
  const pending = deferred();
  const signals: AbortSignal[] = [];
  const props = {
    invoice,
    actions: [{ id: "send", label: "Send" }],
    labels: invoiceLabels,
    onAction: (_: string, __: unknown, context: ActionContext) => {
      signals.push(context.signal);
      return pending.promise;
    },
  };
  const view = wrap(<InvoiceActions {...props} />);
  await userEvent.click(screen.getByRole("button", { name: "Actions" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Send" }));
  view.rerender(
    <SystemProvider>
      <InvoiceActions {...props} invoice={{ ...invoice, id: "INV-2" }} />
    </SystemProvider>,
  );
  expect(signals[0].aborted).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Actions" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Send" }));
  view.unmount();
  expect(signals[1].aborted).toBe(true);
  await act(async () => pending.resolve());
});

it("keeps the busy invoice menu closed and permits retry after an accessible failure", async () => {
  const first = deferred(),
    second = deferred();
  const calls: string[] = [];
  wrap(
    <InvoiceActions
      invoice={invoice}
      labels={invoiceLabels}
      actions={[
        { id: "send", label: "Send" },
        { id: "export", label: "Export", disabled: true },
      ]}
      onAction={(id) => {
        calls.push(id);
        return calls.length === 1 ? first.promise : second.promise;
      }}
    />,
  );
  const menu = screen.getByRole("button", { name: "Actions" });
  await userEvent.click(menu);
  await userEvent.click(screen.getByRole("menuitem", { name: "Export" }));
  expect(calls).toEqual([]);
  await userEvent.click(screen.getByRole("menuitem", { name: "Send" }));
  await userEvent.click(menu);
  await userEvent.keyboard("{ArrowDown}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(calls).toEqual(["send"]);
  await act(async () => first.reject(new Error("private server details")));
  expect(menu).toHaveAccessibleDescription("Action failed");
  expect(screen.getByRole("status")).toHaveTextContent("Action failed");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  await userEvent.click(menu);
  await userEvent.click(screen.getByRole("menuitem", { name: "Send" }));
  expect(calls).toEqual(["send", "send"]);
  await act(async () => second.resolve());
  expect(screen.getByRole("status")).toHaveTextContent("Action complete");
});

it("keeps equivalent confirmation content open but never reopens a withdrawn confirmation", async () => {
  const calls: string[] = [];
  const props = {
    invoice,
    labels: invoiceLabels,
    onAction: async (id: string) => {
      calls.push(id);
    },
  };
  const view = wrap(<InvoiceActions {...props} actions={[remove]} />);
  await userEvent.click(screen.getByRole("button", { name: "Actions" }));
  await userEvent.click(
    screen.getByRole("menuitem", { name: "Delete invoice" }),
  );
  view.rerender(
    <SystemProvider>
      <InvoiceActions
        {...props}
        actions={[{ ...remove, confirmation: { ...remove.confirmation } }]}
      />
    </SystemProvider>,
  );
  expect(
    screen.getByRole("dialog", { name: "Delete this invoice?" }),
  ).toBeInTheDocument();
  view.rerender(
    <SystemProvider>
      <InvoiceActions {...props} actions={[{ ...remove, disabled: true }]} />
    </SystemProvider>,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  view.rerender(
    <SystemProvider>
      <InvoiceActions {...props} actions={[remove]} />
    </SystemProvider>,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(calls).toEqual([]);
});

it.each(["ar", "en"] as const)(
  "uses caller-supplied %s labels, direction and exact invoice formatting",
  async (locale) => {
    const ar = locale === "ar";
    const editLabels = ar
      ? {
          edit: "تعديل العميل",
          title: "العميل",
          description: "تفاصيل الحساب",
          close: "إغلاق",
          name: "الاسم",
          email: "البريد الإلكتروني",
          save: "حفظ",
          saving: "جارٍ الحفظ",
          saved: "تم حفظ العميل",
          cancel: "إلغاء",
          error: "تعذر الحفظ",
        }
      : customerLabels;
    const labels = ar
      ? {
          actions: "الإجراءات",
          details: "عرض التفاصيل",
          title: "تفاصيل الفاتورة",
          description: "ملخص الفاتورة",
          close: "إغلاق",
          working: "جارٍ التنفيذ",
          cancel: "إلغاء العملية",
          success: "اكتملت العملية",
          error: "تعذرت العملية",
        }
      : invoiceLabels;
    const prefs = ar
      ? {
          title: "التفضيلات",
          save: "حفظ التفضيلات",
          saving: "جارٍ حفظ التفضيلات",
          cancel: "إلغاء",
          saved: "حُفظت التفضيلات",
          error: "تعذر حفظ التفضيلات",
        }
      : preferenceLabels;
    wrap(
      <>
        <CustomerEditSheet
          customer={customer}
          labels={editLabels}
          onSave={async () => {}}
        />
        <PreferenceSettings
          value={{ email: true }}
          items={[
            { id: "email", label: ar ? "إشعارات البريد" : "Email alerts" },
          ]}
          labels={prefs}
          onSave={async () => {}}
        />
        <InvoiceActions
          invoice={invoice}
          actions={[]}
          labels={labels}
          onAction={async () => {}}
        />
      </>,
      ar ? "rtl" : "ltr",
    );
    expect(screen.getAllByRole("status")).toHaveLength(3);
    for (const status of screen.getAllByRole("status"))
      expect(status).toBeEmptyDOMElement();
    await userEvent.click(
      screen.getByRole("button", { name: editLabels.edit }),
    );
    expect(
      screen.getByRole("textbox", { name: editLabels.email }),
    ).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "dir",
      ar ? "rtl" : "ltr",
    );
    await userEvent.click(
      screen.getByRole("button", { name: editLabels.close }),
    );
    expect(
      screen.getByRole("switch", {
        name: ar ? "إشعارات البريد" : "Email alerts",
      }),
    ).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("button", { name: labels.details }));
    expect(screen.getByRole("dialog", { name: labels.title })).toHaveAttribute(
      "dir",
      ar ? "rtl" : "ltr",
    );
    expect(screen.getByText("AED 42")).toBeInTheDocument();
  },
);
