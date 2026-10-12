import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { SystemProvider, ToastProvider } from "../system";
import { CreateCustomer } from "../system/ai/examples/CreateCustomer";
function setup() {
  render(
    <SystemProvider>
      <ToastProvider label="Notifications" closeLabel="Dismiss notification">
        <CreateCustomer language="en" />
      </ToastProvider>
    </SystemProvider>,
  );
  return userEvent.setup();
}
it("validates, focuses the first invalid field, keeps corrections and saves once", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Create customer" }));
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveFocus();
  expect(
    screen.getByRole("textbox", { name: "Customer name" }),
  ).toHaveAccessibleDescription("Enter a customer name.");
  await user.type(
    screen.getByRole("textbox", { name: "Customer name" }),
    "مدار ACME",
  );
  await user.type(screen.getByLabelText("Email"), "invalid");
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  expect(screen.getByLabelText("Email")).toHaveFocus();
  expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveValue(
    "مدار ACME",
  );
  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "hello@acme.example");
  await user.dblClick(screen.getByRole("button", { name: "Save customer" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(
    Array.from(screen.getByRole("list", { name: "Customers" }).children),
  ).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Create customer" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Create customer" }));
  expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveValue(
    "",
  );
  expect(screen.getByLabelText("Email")).toHaveValue("");
});
it("discards drafts and errors on cancel and dismissal, permits repeat saves with optional email", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Create customer" }));
  await user.type(
    screen.getByRole("textbox", { name: "Customer name" }),
    "Discard me",
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole("button", { name: "Create customer" }));
  expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveValue(
    "",
  );
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  for (const name of ["First", "Second"]) {
    await user.click(screen.getByRole("button", { name: "Create customer" }));
    expect(
      screen.getByRole("textbox", { name: "Customer name" }),
    ).not.toHaveAttribute("aria-invalid", "true");
    await user.type(
      screen.getByRole("textbox", { name: "Customer name" }),
      name,
    );
    await user.click(screen.getByRole("button", { name: "Save customer" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  }
  expect(screen.getByRole("list", { name: "Customers" }).children).toHaveLength(
    2,
  );
});
