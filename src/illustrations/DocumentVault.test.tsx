import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { DocumentVault } from "./DocumentVault";

it("keeps gallery artwork decorative and free of nested controls", () => {
  const { container } = render(
    <a href="/illustrations/document-vault">
      <DocumentVault />
      Document vault
    </a>,
  );
  expect(screen.queryByRole("button")).toBeNull();
  expect(container.querySelector(".document-vault__art")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(container.querySelector("[aria-live], [role='status']")).toBeNull();
});

it("opens and closes from the same focused, localized button", () => {
  const { container, rerender } = render(<DocumentVault interactive />);
  const toggle = screen.getByRole("button", { name: "فتح المجلد" });
  toggle.focus();
  fireEvent.click(toggle);
  expect(toggle).toHaveFocus();
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "إغلاق المجلد" })).toBe(toggle);
  expect(container.querySelector(".document-vault")).toHaveAttribute(
    "data-open",
    "true",
  );
  fireEvent.click(toggle);
  expect(toggle).toHaveFocus();
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  rerender(<DocumentVault interactive language="en" />);
  expect(screen.getByRole("button", { name: "Open folder" })).toBe(toggle);
});

it("follows external preview state without forgetting a deliberate open toggle", () => {
  const { container, rerender } = render(<DocumentVault animated />);
  const root = container.querySelector(".document-vault");
  expect(root).toHaveAttribute("data-open", "true");
  rerender(<DocumentVault />);
  expect(root).toHaveAttribute("data-open", "false");
  rerender(<DocumentVault interactive language="en" />);
  fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
  rerender(<DocumentVault interactive animated language="en" />);
  rerender(<DocumentVault interactive language="en" />);
  expect(root).toHaveAttribute("data-open", "true");
  rerender(<DocumentVault />);
  expect(root).toHaveAttribute("data-open", "false");
});
