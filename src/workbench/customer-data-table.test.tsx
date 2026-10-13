import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { SystemProvider, ToastProvider } from "../system";
import { CustomerDataTable } from "../system/ai/examples/CustomerDataTable";
function setup(
  preset: "populated" | "empty" | "loading" | "error" = "populated",
) {
  render(
    <SystemProvider>
      <ToastProvider label="Notifications" closeLabel="Dismiss notification">
        <CustomerDataTable language="en" preset={preset} />
      </ToastProvider>
    </SystemProvider>,
  );
  return userEvent.setup();
}
it("combines name/email search, status, sorting and pagination resets while keeping focus", async () => {
  const user = setup();
  const search = screen.getByRole("searchbox", {
    name: "Search customers by name or email",
  });
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(search, "example");
  expect(search).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("1–10 of 26");
  await user.click(screen.getByRole("combobox", { name: "Customer status" }));
  await user.click(screen.getByRole("option", { name: "Paused" }));
  expect(screen.getByRole("status")).toHaveTextContent("of 9");
  expect(
    within(screen.getByRole("table"))
      .getAllByRole("cell")
      .filter((c) => c.textContent === "Active"),
  ).toHaveLength(0);
  await user.clear(search);
  await user.type(search, "Nadia");
  expect(screen.getByRole("table")).toHaveTextContent("No matching results.");
  await user.clear(search);
  await user.click(screen.getByRole("button", { name: "Sort Name ascending" }));
  expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
});
it("creates once under active filters, retains filters and opens the correct details with focus restoration", async () => {
  const user = setup("empty");
  const search = screen.getByRole("searchbox");
  await user.type(search, "Nadia");
  await user.click(screen.getByRole("button", { name: "Create customer" }));
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveFocus();
  await user.type(
    screen.getByRole("textbox", { name: "Customer name" }),
    "Nadia ACME",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Email" }),
    "nadia@example.com",
  );
  await user.dblClick(screen.getByRole("button", { name: "Save customer" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(search).toHaveValue("Nadia");
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
  expect(screen.getByText("Customer created")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Create customer" })).toHaveFocus();
  await user.click(
    screen.getByRole("button", { name: "Dismiss notification" }),
  );
  const action = screen.getByRole("button", { name: "Actions for Nadia ACME" });
  await user.click(action);
  await user.click(screen.getByRole("menuitem", { name: "View details" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Customer details",
  });
  expect(dialog).toHaveTextContent("nadia@example.com");
  expect(dialog).toHaveTextContent("Nadia ACME");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(action).toHaveFocus());
});
it("demonstrates explicit loading/error and Retry without a service", async () => {
  const user = setup("error");
  expect(screen.getByRole("table")).toHaveTextContent(
    "Unable to show customers.",
  );
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(screen.getByRole("status")).toHaveTextContent("of 26");
});
