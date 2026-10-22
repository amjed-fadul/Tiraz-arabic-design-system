import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { DataTable, SystemProvider } from "./index";
const rows = Array.from({ length: 23 }, (_, i) => ({
  id: i,
  name: `Team ${23 - i}`,
}));
const columns = [
  {
    id: "name",
    header: "Name",
    cell: (row: (typeof rows)[number]) => row.name,
    sortValue: (row: (typeof rows)[number]) => row.name,
    rowHeader: true,
  },
];
const labels = {
  previous: "Previous",
  next: "Next",
  pagination: "Customer pages",
  sortAscending: (name: string) => `Sort ${name} ascending`,
  sortDescending: (name: string) => `Sort ${name} descending`,
  resultCount: (from: number, to: number, total: number) =>
    `${from}–${to} of ${total}`,
};
function demo(data = rows, resetKey = "") {
  return (
    <SystemProvider>
      <DataTable
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Customers"
        locale="en"
        labels={labels}
        emptyContent="Empty"
        resetKey={resetKey}
      />
    </SystemProvider>
  );
}
it("sorts naturally in both directions without mutating data and retains row identity and header focus", async () => {
  const user = userEvent.setup();
  render(demo([rows[0], rows[21], rows[22]]));
  const row = screen.getByRole("rowheader", { name: "Team 23" }).closest("tr");
  await user.click(screen.getByRole("button", { name: "Sort Name ascending" }));
  expect(screen.getAllByRole("rowheader")[0]).toHaveTextContent("Team 1");
  expect(screen.getByRole("columnheader")).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  expect(
    screen.getByRole("button", { name: "Sort Name descending" }),
  ).toHaveFocus();
  await user.click(
    screen.getByRole("button", { name: "Sort Name descending" }),
  );
  expect(screen.getAllByRole("rowheader")[0].closest("tr")).toBe(row);
  expect(rows[0].name).toBe("Team 23");
});
it("defaults to ten, resets on query/sort changes and clamps permanently when records shrink", async () => {
  const user = userEvent.setup();
  const { rerender } = render(demo());
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
    11,
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("status")).toHaveTextContent("21–23 of 23");
  rerender(demo(rows.slice(0, 11)));
  expect(screen.getByRole("status")).toHaveTextContent("11–11 of 11");
  rerender(demo());
  expect(screen.getByRole("status")).toHaveTextContent("11–20 of 23");
  rerender(demo(rows, "query"));
  expect(screen.getByRole("status")).toHaveTextContent("1–10 of 23");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Sort Name ascending" }));
  expect(screen.getByRole("status")).toHaveTextContent("1–10 of 23");
  rerender(demo([], "empty"));
  expect(screen.getByRole("status")).toHaveTextContent("0–0 of 0");
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

it("shows a page of skeleton rows while loading", () => {
  const { container } = render(
    <SystemProvider>
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Customers"
        locale="en"
        labels={labels}
        emptyContent="Empty"
        pageSize={3}
        loading
      />
    </SystemProvider>,
  );
  expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
  const body = container.querySelectorAll("tbody tr");
  expect(body).toHaveLength(3);
  for (const row of body) {
    expect(row).toHaveAttribute("aria-hidden", "true");
    expect(row.querySelectorAll(".tz-skeleton")).toHaveLength(columns.length);
  }
  expect(screen.queryByRole("rowheader")).toBeNull();
});
it("uses the caller locale, preserves equal-value order, and sorts Arabic text", async () => {
  const user = userEvent.setup();
  const data = [
    { id: 1, name: "ä" },
    { id: 2, name: "z" },
    { id: 3, name: "Ä" },
  ];
  const { rerender } = render(
    <SystemProvider>
      <DataTable
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Locale records"
        locale="en"
        labels={labels}
        emptyContent="Empty"
      />
    </SystemProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Sort Name ascending" }));
  expect(screen.getAllByRole("rowheader").map((el) => el.textContent)).toEqual([
    "ä",
    "Ä",
    "z",
  ]);
  rerender(
    <SystemProvider>
      <DataTable
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Locale records"
        locale="sv"
        labels={labels}
        emptyContent="Empty"
      />
    </SystemProvider>,
  );
  expect(screen.getAllByRole("rowheader").map((el) => el.textContent)).toEqual([
    "z",
    "ä",
    "Ä",
  ]);
  rerender(
    <SystemProvider>
      <DataTable
        data={[
          { id: 1, name: "يوسف" },
          { id: 2, name: "خالد" },
          { id: 3, name: "أحمد" },
        ]}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Locale records"
        locale="ar"
        labels={labels}
        emptyContent="Empty"
      />
    </SystemProvider>,
  );
  expect(screen.getAllByRole("rowheader").map((el) => el.textContent)).toEqual([
    "أحمد",
    "خالد",
    "يوسف",
  ]);
});

it("keeps counts and pagination visible when the host owns announcements", async () => {
  const user = userEvent.setup();
  render(
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      caption="Customers"
      locale="en"
      labels={labels}
      emptyContent="Empty"
      announcement="off"
    />,
  );
  expect(screen.queryByRole("status")).toBeNull();
  expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  expect(screen.getByText("1–10 of 23")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("11–20 of 23")).toBeVisible();
});
