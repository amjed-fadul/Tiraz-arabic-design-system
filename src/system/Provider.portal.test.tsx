import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SystemProvider } from "./Provider";
import { defaultConfig } from "./config";
import { SystemContext, useSystem } from "./useSystem";
import { Modal } from "./Modal";
import { Sheet } from "./Sheet";
import { Tooltip } from "./Tooltip";

const hosts: HTMLElement[] = [];
function host() {
  const node = document.createElement("section");
  document.body.append(node);
  hosts.push(node);
  return node;
}
afterEach(() => {
  hosts.splice(0).forEach((node) => node.remove());
  vi.restoreAllMocks();
});

// An existing source consumer needs only the original context contract.
function PortalConsumer({ onRender }: { onRender?: () => void }) {
  const { container } = useSystem();
  onRender?.();
  return container
    ? createPortal(
        <span data-testid="portal-child">Portal child</span>,
        container,
      )
    : null;
}

describe("SystemProvider portal destination", () => {
  it("keeps the original root and direct children when the destination is omitted", () => {
    const view = render(
      <SystemProvider>
        <p>Ordinary child</p>
        <PortalConsumer />
      </SystemProvider>,
    );
    const root = view.container.firstElementChild!;
    expect(root).toHaveClass("tiraz-system", { exact: true });
    expect(view.container.querySelectorAll(".tiraz-system")).toHaveLength(1);
    expect(screen.getByText("Ordinary child").parentElement).toBe(root);
    expect(screen.getByTestId("portal-child").parentElement).toBe(root);
  });

  it("withholds only portals while pending, replaces destinations, and cleans up owned scope", () => {
    const first = host();
    const second = host();
    const foreignChild = document.createElement("p");
    foreignChild.textContent = "Host-owned content";
    first.append(foreignChild);
    const tree = (portalContainer: HTMLElement | null) => (
      <SystemProvider {...{ portalContainer }}>
        <input aria-label="Draft" defaultValue="Keep this draft" />
        <PortalConsumer />
      </SystemProvider>
    );
    const view = render(tree(null));
    const input = screen.getByRole("textbox", { name: "Draft" });
    input.focus();
    expect(input).toHaveFocus();
    expect(screen.queryByTestId("portal-child")).not.toBeInTheDocument();
    view.rerender(tree(first));
    const firstScope = first.querySelector(".tiraz-system")!;
    expect(firstScope).toContainElement(screen.getByTestId("portal-child"));
    expect(input).toHaveFocus();
    expect(input).toHaveValue("Keep this draft");
    view.rerender(tree(second));
    expect(firstScope).not.toBeInTheDocument();
    expect(first.children).toHaveLength(1);
    expect(first).toContainElement(foreignChild);
    expect(second.querySelector(".tiraz-system")).toContainElement(
      screen.getByTestId("portal-child"),
    );
    view.rerender(tree(null));
    expect(second).toBeEmptyDOMElement();
    expect(screen.queryByTestId("portal-child")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Draft" })).toBe(input);
    view.rerender(tree(first));
    expect(first.querySelectorAll(".tiraz-system")).toHaveLength(1);
    view.unmount();
    expect(first.children).toHaveLength(1);
    expect(first).toContainElement(foreignChild);
  });

  it("copies explicit scope and custom properties without duplicating root layout", () => {
    const destination = host();
    const config = {
      ...defaultConfig,
      theme: "dark" as const,
      direction: "ltr" as const,
      density: "standard" as const,
      typography: "large" as const,
      numerals: "latn" as const,
      reducedMotion: true,
      accent: "blue" as const,
      radius: 12,
    };
    const style = {
      width: 480,
      height: 320,
      transform: "scale(0.8)",
      color: "red",
      "--tiraz-action": "#123456",
      "--tiraz-radius": "16px",
      "--surface": "#222222",
      "--action": "red",
      "--radius": "0px",
      colorScheme: "light",
    } as CSSProperties;
    const view = render(
      <SystemProvider
        {...{ portalContainer: destination }}
        config={config}
        lang="en"
        className="application-layout"
        style={style}
      >
        <PortalConsumer />
      </SystemProvider>,
    );
    const root = view.container.firstElementChild as HTMLElement;
    const scope = destination.querySelector<HTMLElement>(".tiraz-system")!;
    expect(scope).not.toBeNull();
    for (const [name, value] of Object.entries({
      lang: "en",
      dir: "ltr",
      "data-theme": "dark",
      "data-density": "standard",
      "data-typography": "large",
      "data-numerals": "latn",
      "data-reduced-motion": "true",
    }))
      expect(scope).toHaveAttribute(name, value);
    expect(scope).toHaveClass("tiraz-system", { exact: true });
    expect(scope.style.display).toBe("contents");
    for (const property of ["width", "height", "transform", "color"])
      expect(scope.style.getPropertyValue(property)).toBe("");
    expect(root.style.width).toBe("480px");
    for (const [name, value] of Object.entries({
      "--tiraz-action": "#123456",
      "--tiraz-radius": "16px",
      "--surface": "#222222",
      "--action": "var(--tiraz-action, #A8C6EF)",
      "--radius": "var(--tiraz-radius, 12px)",
    }))
      expect(scope.style.getPropertyValue(name)).toBe(value);
    expect(scope.style.colorScheme).toBe("dark");
    view.rerender(
      <SystemProvider {...{ portalContainer: destination }} lang="ar">
        <PortalConsumer />
      </SystemProvider>,
    );
    const updated = destination.querySelector<HTMLElement>(".tiraz-system")!;
    expect(updated).toHaveAttribute("lang", "ar");
    expect(updated).toHaveAttribute("dir", "rtl");
    expect(updated).toHaveAttribute("data-theme", "light");
    expect(updated.style.getPropertyValue("--surface")).toBe("");
    expect(updated.style.getPropertyValue("--tiraz-action")).toBe("");
  });

  it("updates root and external modality without rerendering context consumers", () => {
    const destination = host();
    const onRender = vi.fn();
    const view = render(
      <SystemProvider {...{ portalContainer: destination }}>
        <PortalConsumer onRender={onRender} />
      </SystemProvider>,
    );
    const root = view.container.firstElementChild!;
    const scope = destination.querySelector(".tiraz-system")!;
    const count = onRender.mock.calls.length;
    fireEvent.keyDown(document, { key: "Tab" });
    expect(root).toHaveAttribute("data-modality", "keyboard");
    expect(scope).toHaveAttribute("data-modality", "keyboard");
    fireEvent.pointerDown(document.body);
    expect(root).toHaveAttribute("data-modality", "pointer");
    expect(scope).toHaveAttribute("data-modality", "pointer");
    expect(onRender).toHaveBeenCalledTimes(count);
  });

  it("continues to accept source consumers supplying the original context literal", async () => {
    const destination = document.createElement("div");
    document.body.append(destination);
    hosts.push(destination);
    render(
      <SystemContext.Provider
        value={{ config: defaultConfig, container: destination }}
      >
        <Tooltip
          trigger={<button>Legacy help</button>}
          content="Legacy explanation"
        />
      </SystemContext.Provider>,
    );
    const user = userEvent.setup();
    await user.tab();
    const tip = await screen.findByRole("tooltip", { hidden: true });
    expect(destination).toContainElement(tip);
    expect(tip).toHaveTextContent("Legacy explanation");
  });

  it.each([Modal, Sheet])(
    "keeps nested %s content as the nearest portal and focus boundary",
    async (Dialog) => {
      const destination = host();
      const user = userEvent.setup();
      render(
        <SystemProvider {...{ portalContainer: destination }} lang="en">
          <Dialog
            trigger={<button>Open details</button>}
            title="Details"
            description="Details description"
            closeLabel="Close details"
          >
            <Tooltip
              trigger={<button>Nested help</button>}
              content="Nested explanation"
            />
          </Dialog>
        </SystemProvider>,
      );
      const trigger = screen.getByRole("button", { name: "Open details" });
      await user.click(trigger);
      const dialog = await screen.findByRole("dialog");
      expect(destination).toContainElement(dialog);
      fireEvent.focus(screen.getByRole("button", { name: "Nested help" }));
      const tip = await screen.findByRole("tooltip", { hidden: true });
      expect(dialog).toContainElement(tip);
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(
          screen.queryByRole("tooltip", { hidden: true }),
        ).not.toBeInTheDocument(),
      );
      expect(dialog).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(trigger).toHaveFocus();
    },
  );
});
