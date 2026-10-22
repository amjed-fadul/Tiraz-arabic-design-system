import { useRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CustomizeHint } from "./CustomizeHint";
import { useCustomizeHint } from "./use-customize-hint";
import type { Language } from "./i18n";

afterEach(() => vi.restoreAllMocks());

function WorkbenchHint({
  enabled = true,
  language = "en",
}: {
  enabled?: boolean;
  language?: Language;
}) {
  const hint = useCustomizeHint(enabled);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  function openCustomize() {
    hint.dismiss();
    setOpen(true);
  }
  return (
    <>
      <button type="button">Another control</button>
      <span className="customize-hint-anchor">
        <button ref={trigger} type="button" onClick={openCustomize}>
          Customize
        </button>
        {hint.visible && !open && (
          <CustomizeHint
            language={language}
            onOpen={openCustomize}
            onDismiss={hint.dismiss}
            triggerRef={trigger}
          />
        )}
      </span>
      {open && <p>Customization is open</p>}
    </>
  );
}

it("waits for an eligible component without consuming the first visit", () => {
  const { rerender } = render(<WorkbenchHint enabled={false} />);
  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();
  rerender(<WorkbenchHint />);
  expect(screen.getByRole("button", { name: /Click me/ })).toBeVisible();
  expect(localStorage.getItem("tiraz.customize-hint.v1")).toBeNull();
});

it("opens Customize from the note and remembers the acknowledgement on later visits", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<WorkbenchHint />);
  await user.click(screen.getByRole("button", { name: /Click me/ }));
  expect(screen.getByText("Customization is open")).toBeVisible();
  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();
  unmount();
  render(<WorkbenchHint />);
  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();
});

it("also remembers opening from the original Customize control", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<WorkbenchHint />);
  await user.click(screen.getByRole("button", { name: "Customize" }));
  unmount();
  render(<WorkbenchHint />);
  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();
});

it("dismisses without opening and returns focus from its own dismiss button", async () => {
  const user = userEvent.setup();
  render(<WorkbenchHint />);
  await user.click(
    screen.getByRole("button", { name: "Dismiss customize hint" }),
  );
  expect(screen.getByRole("button", { name: "Customize" })).toHaveFocus();
  expect(screen.queryByText("Customization is open")).toBeNull();
  expect(localStorage.getItem("tiraz.customize-hint.v1")).toBe("seen");
});

it("never autofocuses or announces itself, and Escape preserves focus elsewhere", async () => {
  const user = userEvent.setup();
  const { container, rerender } = render(<WorkbenchHint enabled={false} />);
  const another = screen.getByRole("button", { name: "Another control" });
  another.focus();
  rerender(<WorkbenchHint />);
  expect(another).toHaveFocus();
  expect(
    container.querySelector("[aria-live], [role=status], [role=dialog]"),
  ).toBeNull();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: /Click me/ })).toBeNull();
  expect(another).toHaveFocus();
});

it("restores trigger focus when Escape dismisses the focused note", async () => {
  const user = userEvent.setup();
  render(<WorkbenchHint />);
  screen.getByRole("button", { name: /Click me/ }).focus();
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Customize" })).toHaveFocus();
});

it("lets another control consume Escape without dismissing the hint", () => {
  render(<WorkbenchHint />);
  const another = screen.getByRole("button", { name: "Another control" });
  another.addEventListener("keydown", (event) => event.preventDefault());
  fireEvent.keyDown(another, { key: "Escape" });
  expect(screen.getByRole("button", { name: /Click me/ })).toBeVisible();
});

it("uses Arabic copy and direction with a purely decorative arrow", () => {
  const { container } = render(<WorkbenchHint language="ar" />);
  expect(screen.getByRole("button", { name: "خصّص من هنا" })).toBeVisible();
  expect(
    screen.getByRole("button", { name: "إخفاء تلميح التخصيص" }),
  ).toBeVisible();
  expect(container.querySelector(".customize-hint")).toHaveAttribute(
    "dir",
    "rtl",
  );
  expect(container.querySelector(".customize-hint")).toHaveAttribute(
    "lang",
    "ar",
  );
  expect(container.querySelector(".first-visit-hint-arrow")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(screen.queryByRole("img")).toBeNull();
});

it("stays usable and dismissed during component navigation when browser storage is blocked", async () => {
  const user = userEvent.setup();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Storage is blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Storage is blocked");
  });
  const { rerender } = render(<WorkbenchHint />);
  await user.click(
    screen.getByRole("button", { name: "Dismiss customize hint" }),
  );
  rerender(<WorkbenchHint enabled={false} />);
  rerender(<WorkbenchHint language="ar" />);
  expect(screen.queryByRole("button", { name: "خصّص من هنا" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Customize" }));
  expect(screen.getByText("Customization is open")).toBeVisible();
});
