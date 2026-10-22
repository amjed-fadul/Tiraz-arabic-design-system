import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { IllustrationsPage } from "./IllustrationsPage";
import source from "../system/EmptyStateIllustrations.tsx?raw";

afterEach(() => vi.restoreAllMocks());

it("filters the gallery and preserves the selected filter's focus", async () => {
  const user = userEvent.setup();
  render(<IllustrationsPage language="en" navigate={vi.fn()} />);
  const filters = screen.getByRole("group", { name: "Filter illustrations" });
  const emptyStates = within(filters).getByRole("button", {
    name: "Empty states",
  });
  await user.click(emptyStates);
  expect(emptyStates).toHaveFocus();
  expect(emptyStates).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(screen.queryByRole("link", { name: "Document vault" })).toBeNull();
});

it("exposes the exact source for manual copying after clipboard failure without moving focus", async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("denied"),
  );
  render(
    <IllustrationsPage id="no-records" language="en" navigate={vi.fn()} />,
  );
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  const copy = screen.getByRole("button", { name: "Copy source file" });
  await user.click(copy);
  expect(copy).toHaveFocus();
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("copy it manually"),
  );
  const fallback = screen.getByRole("region", {
    name: "Source file: EmptyStateIllustrations.tsx",
  });
  expect(fallback).toBeVisible();
  expect(fallback).toHaveAttribute("tabindex", "0");
  expect(fallback.textContent).toBe(source);
});

it("guards repeated copies and rejects feedback from the previous example language", async () => {
  const user = userEvent.setup();
  let resolveCopy!: () => void;
  const clipboard = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined)
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );
  const { rerender } = render(
    <IllustrationsPage id="document-vault" language="en" navigate={vi.fn()} />,
  );
  const copy = screen.getByRole("button", { name: "Copy example" });
  await user.click(copy);
  expect(copy).toHaveAttribute("aria-busy", "true");
  await user.click(copy);
  expect(clipboard).toHaveBeenCalledTimes(1);
  rerender(
    <IllustrationsPage id="document-vault" language="ar" navigate={vi.fn()} />,
  );
  await act(async () => resolveCopy());
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await user.click(screen.getByRole("button", { name: "نسخ المثال" }));
  expect(clipboard).toHaveBeenLastCalledWith(
    expect.stringContaining('language="ar"'),
  );
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("تم نسخ المثال"),
  );
});
