import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import {
  SystemProvider,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./index";

it("renders a captioned native table with column and row headers in a keyboard scrolling region", () => {
  expect(Table).toBeTypeOf("function");
  render(
    <SystemProvider>
      <Table caption="Customers">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Madar</TableHead>
            <TableCell>hello@madar.example</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </SystemProvider>,
  );
  const table = screen.getByRole("table", { name: "Customers" });
  expect(table.tagName).toBe("TABLE");
  expect(
    within(table).getByRole("columnheader", { name: "Name" }),
  ).toHaveAttribute("scope", "col");
  expect(
    within(table).getByRole("rowheader", { name: "Madar" }),
  ).toHaveAttribute("scope", "row");
  expect(within(table).getByRole("cell")).toHaveTextContent(
    "hello@madar.example",
  );
  expect(screen.getByRole("region", { name: "Customers" })).toHaveAttribute(
    "tabindex",
    "0",
  );
});
it("keeps native table attributes and ref on the table, separate from the scroll container", () => {
  const tableRef = createRef<HTMLTableElement>(),
    containerRef = createRef<HTMLDivElement>(),
    headRef = createRef<HTMLTableCellElement>(),
    cellRef = createRef<HTMLTableCellElement>();
  render(
    <Table
      ref={tableRef}
      aria-label="Invoices"
      id="invoices"
      className="app-table"
      style={{ color: "red" }}
      data-report="monthly"
      containerProps={{
        ref: containerRef,
        id: "scroll",
        "aria-describedby": "scroll-help",
      }}
    >
      <TableHeader>
        <TableRow>
          <TableHead ref={headRef} abbr="ID">
            Invoice ID
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell ref={cellRef} colSpan={2} headers="id">
            No invoices
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  expect(tableRef.current).toBe(
    screen.getByRole("table", { name: "Invoices" }),
  );
  expect(tableRef.current).toHaveAttribute("id", "invoices");
  expect(tableRef.current).toHaveAttribute("data-report", "monthly");
  expect(tableRef.current).toHaveClass("app-table");
  expect(tableRef.current).toHaveStyle({ color: "rgb(255, 0, 0)" });
  expect(containerRef.current).toBe(
    screen.getByRole("region", { name: "Invoices" }),
  );
  expect(containerRef.current).toHaveAttribute(
    "aria-describedby",
    "scroll-help",
  );
  expect(headRef.current).toHaveAttribute("abbr", "ID");
  expect(cellRef.current).toHaveAttribute("colspan", "2");
  expect(cellRef.current).toHaveAttribute("headers", "id");
});
it("supports external table naming and empty content without inventing data semantics", () => {
  render(
    <>
      <h2 id="report-name">Invoices</h2>
      <Table aria-labelledby="report-name">
        <TableBody>
          <TableRow>
            <TableCell colSpan={3}>No invoices yet.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>,
  );
  expect(screen.getByRole("table", { name: "Invoices" })).toHaveTextContent(
    "No invoices yet.",
  );
  expect(screen.getByRole("region", { name: "Invoices" })).toHaveAttribute(
    "tabindex",
    "0",
  );
});
it("uses the native table naming priority for its scroll region when caption and ARIA coexist", () => {
  const { rerender } = render(
    <Table caption="Visible customers" aria-label="Overdue customers">
      <TableBody>
        <TableRow>
          <TableCell>No customers</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  expect(
    screen.getByRole("table", { name: "Overdue customers" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Overdue customers" }),
  ).toBeInTheDocument();
  rerender(
    <>
      <h2 id="external-name">External customers</h2>
      <Table
        caption="Visible customers"
        aria-label="Overdue customers"
        aria-labelledby="external-name"
      >
        <TableBody>
          <TableRow>
            <TableCell>No customers</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>,
  );
  expect(
    screen.getByRole("table", { name: "External customers" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "External customers" }),
  ).toBeInTheDocument();
});
