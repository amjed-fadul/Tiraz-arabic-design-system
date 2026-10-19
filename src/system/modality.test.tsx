import { fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SystemProvider } from "./Provider";
import { useSystem } from "./useSystem";

// Input modality (Woven spec, section 15): keyboard actions never animate, so
// the Provider marks its root with the input the user is on.

afterEach(() => vi.restoreAllMocks());

it("starts in pointer modality", () => {
  const { container } = render(
    <SystemProvider>
      <p>x</p>
    </SystemProvider>,
  );
  expect(container.querySelector(".tiraz-system")).toHaveAttribute(
    "data-modality",
    "pointer",
  );
});
it("switches between keyboard and pointer", () => {
  const { container } = render(
    <SystemProvider>
      <p>x</p>
    </SystemProvider>,
  );
  const root = container.querySelector(".tiraz-system")!;
  fireEvent.keyDown(document, { key: "Tab" });
  expect(root).toHaveAttribute("data-modality", "keyboard");
  fireEvent.pointerDown(document.body);
  expect(root).toHaveAttribute("data-modality", "pointer");
  fireEvent.keyDown(document, { key: "ب" });
  expect(root).toHaveAttribute("data-modality", "keyboard");
});
it("ignores modifier and other non-navigation keys", () => {
  const { container } = render(
    <SystemProvider>
      <p>x</p>
    </SystemProvider>,
  );
  for (const key of [
    "Shift",
    "Control",
    "Alt",
    "Meta",
    "CapsLock",
    "Backspace",
  ])
    fireEvent.keyDown(document, { key });
  expect(container.querySelector(".tiraz-system")).toHaveAttribute(
    "data-modality",
    "pointer",
  );
});
it("shares one document listener across nested providers", () => {
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");
  const { container, unmount } = render(
    <SystemProvider>
      <SystemProvider>
        <p>x</p>
      </SystemProvider>
    </SystemProvider>,
  );
  expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(1);
  fireEvent.keyDown(document, { key: "Tab" });
  const roots = container.querySelectorAll(".tiraz-system");
  expect([...roots].map((r) => r.getAttribute("data-modality"))).toEqual([
    "keyboard",
    "keyboard",
  ]);
  unmount();
  expect(remove.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(
    1,
  );
});
it("does not re-render system consumers when modality changes", () => {
  const rendered = vi.fn();
  function Consumer() {
    useSystem();
    rendered();
    return null;
  }
  render(
    <SystemProvider>
      <Consumer />
    </SystemProvider>,
  );
  // Mounting renders a consumer twice: the second time when the root element,
  // which overlays portal into, reaches the context. Any later render would
  // come from a modality change.
  const mounted = rendered.mock.calls.length;
  fireEvent.keyDown(document, { key: "Tab" });
  fireEvent.pointerDown(document.body);
  expect(rendered).toHaveBeenCalledTimes(mounted);
});
