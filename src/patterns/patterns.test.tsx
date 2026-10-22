import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useState, type ReactNode } from "react";
import { SystemProvider, defaultConfig } from "../system";
import {
  CustomerEditSheet,
  PreferenceSettings,
  InvoiceActions,
  TextField,
} from "./index";

const customer = { id: "c1", name: "Amal", email: "amal@example.com" };
const customerLabels = {
  edit: "Edit customer",
  title: "Customer",
  description: "Account details",
  close: "Close",
  name: "Name",
  email: "Email",
  save: "Save",
  saving: "Saving",
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
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function wrap(children: ReactNode, direction: "ltr" | "rtl" = "rtl") {
  return render(
    <SystemProvider config={{ ...defaultConfig, direction }}>
      {children}
    </SystemProvider>,
  );
}

describe("reusable business patterns", () => {
  it("retains a failed customer draft and closes only after a successful retry", async () => {
    const first = deferred();
    const second = deferred();
    const submissions: (typeof customer)[] = [];
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
    await userEvent.click(
      screen.getByRole("button", { name: "Edit customer" }),
    );
    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "Amal Saleh");
    const save = screen.getByRole("button", { name: "Save" });
    fireEvent.submit(save.closest("form")!);
    fireEvent.submit(save.closest("form")!);
    expect(submissions).toEqual([
      { id: "c1", name: "Amal Saleh", email: "amal@example.com" },
    ]);
    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
    await act(async () =>
      first.reject(new Error("server details must not leak")),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save");
    expect(screen.getByLabelText("Name")).toHaveValue("Amal Saleh");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await act(async () => second.resolve());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("aborts a cancelled customer save and ignores its result after reopening", async () => {
    const pending = deferred();
    let signal: AbortSignal | undefined;
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
    await userEvent.click(
      screen.getByRole("button", { name: "Edit customer" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(signal?.aborted).toBe(true);
    await userEvent.click(
      screen.getByRole("button", { name: "Edit customer" }),
    );
    await userEvent.type(screen.getByLabelText("Name"), " new session");
    await act(async () => pending.resolve());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Amal new session");
  });

  it("gives repeated labeled fields unique IDs and associates help and error", () => {
    wrap(
      <>
        <TextField label="First" description="Help" error="Required" />
        <TextField label="Second" />
      </>,
    );
    const first = screen.getByLabelText("First");
    expect(first.id).not.toBe(screen.getByLabelText("Second").id);
    expect(first).toHaveAccessibleDescription("Help Required");
    expect(first).toHaveAttribute("aria-invalid", "true");
  });

  it("preserves failed preference edits and resets cancellation to supplied saved values", async () => {
    const pending = deferred();
    const submissions: Record<string, boolean>[] = [];
    wrap(
      <PreferenceSettings
        value={{ email: false }}
        items={[{ id: "email", label: "Email notifications" }]}
        labels={preferenceLabels}
        onSave={(value) => {
          submissions.push(value);
          return pending.promise;
        }}
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Email notifications" });
    await userEvent.click(toggle);
    await userEvent.click(
      screen.getByRole("button", { name: "Save preferences" }),
    );
    expect(submissions).toEqual([{ email: true }]);
    expect(toggle).toBeDisabled();
    await act(async () => pending.reject(new Error("offline")));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to save preferences",
    );
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("cancels pending preference saves and ignores late completion", async () => {
    const pending = deferred();
    let signal: AbortSignal | undefined;
    wrap(
      <PreferenceSettings
        value={{ email: false }}
        items={[{ id: "email", label: "Email notifications" }]}
        labels={preferenceLabels}
        onSave={(_, context) => {
          signal = context.signal;
          return pending.promise;
        }}
      />,
    );
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(
      screen.getByRole("button", { name: "Save preferences" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await act(async () => pending.resolve());
    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByText("Preferences saved")).not.toBeInTheDocument();
  });

  it("acknowledges a successful save when the caller updates its persisted preference values", async () => {
    function SavedPreferences() {
      const [value, setValue] = useState({ email: false });
      return (
        <PreferenceSettings
          value={value}
          items={[{ id: "email", label: "Email notifications" }]}
          labels={preferenceLabels}
          onSave={async (next) => {
            setValue({ email: next.email });
          }}
        />
      );
    }
    wrap(<SavedPreferences />);
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(
      screen.getByRole("button", { name: "Save preferences" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Preferences saved");
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("cancels invoice actions, ignores late failures and aborts work on unmount", async () => {
    const first = deferred();
    const second = deferred();
    const signals: AbortSignal[] = [];
    const view = wrap(
      <InvoiceActions
        invoice={{ id: "INV-1", fields: [] }}
        actions={[{ id: "send", label: "Send" }]}
        labels={invoiceLabels}
        onAction={(_, __, context) => {
          signals.push(context.signal);
          return signals.length === 1 ? first.promise : second.promise;
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Send" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Cancel action" }),
    );
    expect(signals[0].aborted).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Send" }));
    await act(async () => first.reject(new Error("late failure")));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Working" })).toBeDisabled();
    view.unmount();
    expect(signals[1].aborted).toBe(true);
    await act(async () => second.resolve());
  });

  it.each(["rtl", "ltr"] as const)(
    "shows caller-formatted invoice details and action failure in %s",
    async (direction) => {
      const pending = deferred();
      const invoice = {
        id: "INV-42",
        fields: [
          { id: "amount", label: "Total", value: "AED 123.45" },
          { id: "date", label: "Date", value: "22 October 2026" },
        ],
      };
      const actions: string[] = [];
      wrap(
        <InvoiceActions
          invoice={invoice}
          labels={invoiceLabels}
          actions={[{ id: "send", label: "Send invoice" }]}
          onAction={(action, value) => {
            actions.push(`${action}:${value.id}`);
            return pending.promise;
          }}
        />,
        direction,
      );
      await userEvent.click(
        screen.getByRole("button", { name: "View details" }),
      );
      expect(
        within(screen.getByRole("dialog")).getByText("AED 123.45"),
      ).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveAttribute("dir", direction);
      await userEvent.click(screen.getByRole("button", { name: "Close" }));
      await userEvent.click(screen.getByRole("button", { name: "Actions" }));
      await userEvent.click(
        screen.getByRole("menuitem", { name: "Send invoice" }),
      );
      expect(actions).toEqual(["send:INV-42"]);
      expect(screen.getByRole("button", { name: "Working" })).toBeDisabled();
      await act(async () => pending.reject(new Error("service failed")));
      expect(screen.getByRole("alert")).toHaveTextContent("Action failed");
      expect(screen.getByRole("button", { name: "Actions" })).toBeEnabled();
    },
  );
  it("shares invoice actions and persistent feedback inside the details Sheet", async () => {
    const first = deferred();
    const second = deferred();
    const signals: AbortSignal[] = [];
    const submissions: string[] = [];
    const props = {
      invoice: {
        id: "INV-42",
        fields: [{ id: "amount", label: "Total", value: "AED 42" }],
      },
      actions: [
        { id: "pay", label: "Mark as paid" },
        { id: "export", label: "Export", disabled: true },
      ],
      labels: invoiceLabels,
      actionsInDetails: true,
      onAction: (
        id: string,
        _: unknown,
        { signal }: { signal: AbortSignal },
      ) => {
        submissions.push(id);
        signals.push(signal);
        return submissions.length === 1 ? first.promise : second.promise;
      },
    };
    wrap(<InvoiceActions {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "View details" }));
    const dialog = within(screen.getByRole("dialog"));
    await userEvent.click(dialog.getByRole("button", { name: "Actions" }));
    expect(dialog.getByRole("menuitem", { name: "Export" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Actions" })).toHaveFocus();
    await userEvent.click(dialog.getByRole("button", { name: "Actions" }));
    await userEvent.click(
      dialog.getByRole("menuitem", { name: "Mark as paid" }),
    );
    expect(dialog.getByRole("button", { name: "Working" })).toBeDisabled();
    expect(submissions).toEqual(["pay"]);
    await act(async () => first.reject(new Error("service failed")));
    expect(dialog.getByRole("alert")).toHaveTextContent("Action failed");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    await userEvent.click(dialog.getByRole("button", { name: "Actions" }));
    await userEvent.click(
      dialog.getByRole("menuitem", { name: "Mark as paid" }),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Cancel action" }),
    );
    expect(signals[1].aborted).toBe(true);
    await act(async () => second.resolve());
    expect(screen.queryByText("Action complete")).not.toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Close" }));
    expect(screen.getByRole("button", { name: "View details" })).toHaveFocus();
  });
});
