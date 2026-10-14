import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Dashboard } from "./Dashboard";

async function setup() {
  render(<Dashboard />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "English" }));
  return user;
}
const customerTable = () =>
  screen.getByRole("table", { name: "Customer directory" });
async function select(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(screen.getByRole("option", { name: option }));
}

it("resets pagination for combined filters and distinguishes no results from an empty dataset", async () => {
  const user = await setup();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("7–12 of 18 customers")).toBeInTheDocument();
  await user.type(screen.getByRole("searchbox"), "madar");
  expect(customerTable()).toHaveTextContent("شركة مدار");
  await select(user, "Customer status", "Paused");
  expect(customerTable()).toHaveTextContent("No matching customers");
  await user.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByText("1–6 of 18 customers")).toBeInTheDocument();
  await select(user, "Preview state", "Empty dataset");
  expect(customerTable()).toHaveTextContent("No customers yet");
  expect(screen.getByTestId("customer-count")).toHaveTextContent("0");
});

it("validates, saves once, updates only customers, and reveals a customer hidden by filters", async () => {
  const user = await setup();
  const orderCount = screen.getByTestId("order-count").textContent;
  const revenue = screen.getByTestId("revenue").textContent;
  await user.type(screen.getByRole("searchbox"), "unmatched");
  await select(user, "Customer status", "Paused");
  const trigger = screen.getByRole("button", { name: "Create customer" });
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveFocus();
  await user.type(
    screen.getByRole("textbox", { name: "Customer name" }),
    "  مدار New  ",
  );
  await user.type(screen.getByLabelText("Email"), "invalid");
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  expect(screen.getByLabelText("Email")).toHaveFocus();
  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "new@madar.example");
  await user.dblClick(screen.getByRole("button", { name: "Save customer" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(trigger).toHaveFocus();
  expect(screen.getByTestId("customer-count")).toHaveTextContent("19");
  expect(screen.getByTestId("order-count").textContent).toBe(orderCount);
  expect(screen.getByTestId("revenue").textContent).toBe(revenue);
  expect(screen.getByText("Customer created")).toBeInTheDocument();
  expect(
    screen.getByText("Your filters hide the new customer."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Show customer" }));
  expect(customerTable()).toHaveTextContent("مدار New");
  expect(within(customerTable()).getAllByRole("row")).toHaveLength(2);
});

it("discards drafts and restores trigger focus after cancel, close and Escape", async () => {
  const user = await setup();
  const trigger = screen.getByRole("button", { name: "Create customer" });
  for (const dismiss of ["Cancel", "Close customer form", "Escape"]) {
    await user.click(trigger);
    await user.type(
      screen.getByRole("textbox", { name: "Customer name" }),
      "Unsaved",
    );
    if (dismiss === "Escape") await user.keyboard("{Escape}");
    else await user.click(screen.getByRole("button", { name: dismiss }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(screen.getByRole("textbox", { name: "Customer name" })).toHaveValue(
      "",
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  }
  expect(screen.getByTestId("customer-count")).toHaveTextContent("18");
});

it("changes order metrics with the shared period and restores sample data on Retry", async () => {
  const user = await setup();
  const count = screen.getByTestId("order-count").textContent;
  await select(user, "Period", "14 days");
  expect(screen.getByTestId("order-count").textContent).not.toBe(count);
  await select(user, "Preview state", "Loading");
  expect(customerTable()).toHaveAttribute("aria-busy", "true");
  expect(
    screen.getByText("Loading preview — no request is running."),
  ).toBeInTheDocument();
  await select(user, "Preview state", "Error");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(screen.getByTestId("customer-count")).toHaveTextContent("18");
  expect(customerTable()).toHaveTextContent("شركة مدار");
});

it("creates in the empty dataset without orders and keeps data through live language/theme changes", async () => {
  const user = await setup();
  await select(user, "Preview state", "Empty dataset");
  await user.click(screen.getByRole("button", { name: "Create customer" }));
  await user.type(
    screen.getByRole("textbox", { name: "Customer name" }),
    "First customer",
  );
  await user.click(screen.getByRole("button", { name: "Save customer" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByTestId("customer-count")).toHaveTextContent("1");
  expect(screen.getByTestId("order-count")).toHaveTextContent("0");
  expect(screen.getByTestId("revenue")).toHaveTextContent("0");
  await user.click(screen.getByRole("button", { name: "Dark mode" }));
  await user.click(screen.getByRole("button", { name: "العربية" }));
  expect(document.documentElement).toHaveAttribute("lang", "ar");
  expect(document.documentElement).toHaveAttribute("dir", "rtl");
  expect(document.querySelector(".tiraz-system")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  expect(screen.getByRole("table", { name: "دليل العملاء" })).toHaveTextContent(
    "First customer",
  );
});

it("hands mobile navigation focus to the destination after the Sheet restores its trigger", async () => {
  const user = await setup();
  const trigger = screen.getByRole("button", { name: "Open navigation" });
  for (const name of ["Customers", "Orders", "Overview"]) {
    await user.click(trigger);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("link", { name }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(document.getElementById(name.toLowerCase())).toHaveFocus(),
    );
  }
  await user.click(trigger);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(trigger).toHaveFocus();
});
