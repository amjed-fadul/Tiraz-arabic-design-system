import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { FilterBar } from "./FilterBar";
import { Input } from "./Input";
import { defaultConfig } from "./config";
import { SystemProvider } from "./Provider";
it("composes combined caller-owned filters, individual removal and Clear all", async () => {
  function Example() {
    const [query, setQuery] = useState("Ada"),
      [active, setActive] = useState(true);
    const people = [
      { name: "Ada", active: true },
      { name: "Ada Lovelace", active: false },
      { name: "Omar", active: true },
    ];
    const results = people.filter(
      (p) => p.name.includes(query) && (!active || p.active),
    );
    return (
      <>
        <FilterBar
          label="Customer filters"
          search={
            <Input
              aria-label="Search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
          }
          filters={[
            ...(query
              ? [
                  {
                    id: "query",
                    label: query,
                    removeLabel: "Remove search",
                    onRemove: () => setQuery(""),
                  },
                ]
              : []),
            ...(active
              ? [
                  {
                    id: "status",
                    label: "Active",
                    removeLabel: "Remove status",
                    onRemove: () => setActive(false),
                  },
                ]
              : []),
          ]}
          onClearAll={() => {
            setQuery("");
            setActive(false);
          }}
          clearLabel="Clear all"
        />
        <output aria-label="Results">{results.length}</output>
      </>
    );
  }
  const user = userEvent.setup();
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <Example />
    </SystemProvider>,
  );
  expect(
    screen.getByRole("group", { name: "Customer filters" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Results")).toHaveTextContent("1");
  await user.click(screen.getByRole("button", { name: "Remove status" }));
  expect(screen.getByLabelText("Results")).toHaveTextContent("2");
  expect(screen.getByRole("textbox")).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Clear all" }));
  expect(screen.getByLabelText("Results")).toHaveTextContent("3");
  expect(
    screen.queryByRole("button", { name: "Clear all" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveFocus();
});

it("returns focus to the named group when no control remains, and honors disabled removal", async () => {
  const user = userEvent.setup();
  function Example() {
    const [active, setActive] = useState(true);
    return (
      <FilterBar
        label="Filters"
        filters={
          active
            ? [
                {
                  id: "one",
                  label: "One",
                  removeLabel: "Remove one",
                  onRemove: () => setActive(false),
                },
              ]
            : []
        }
      />
    );
  }
  const { rerender } = render(<Example />);
  await user.click(screen.getByRole("button", { name: "Remove one" }));
  expect(screen.getByRole("group", { name: "Filters" })).toHaveFocus();
  rerender(
    <FilterBar
      label="Filters"
      disabled
      filters={[
        {
          id: "one",
          label: "One",
          removeLabel: "Remove one",
          onRemove: () => {
            throw new Error("disabled action");
          },
        },
      ]}
      onClearAll={() => {
        throw new Error("disabled action");
      }}
    />,
  );
  expect(screen.getByRole("button", { name: "Remove one" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "مسح الكل" })).toBeDisabled();
});
