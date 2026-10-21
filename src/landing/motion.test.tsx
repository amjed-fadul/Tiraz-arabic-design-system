import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSmoothScroll } from "./motion";

const lenis = vi.hoisted(() => ({ create: vi.fn(), scrollTo: vi.fn() }));
vi.mock("lenis", () => ({
  default: class {
    constructor() {
      lenis.create();
    }
    scrollTo = lenis.scrollTo;
    raf() {}
    destroy() {}
  },
}));

function Page() {
  useSmoothScroll();
  return (
    <>
      <a href="#start">Get started</a>
      <a href="#explore">Browse components</a>
      <section id="start" tabIndex={-1} aria-labelledby="start-title">
        <h2 id="start-title">Start from source</h2>
        <button>Copy setup prompt</button>
      </section>
      <section id="explore" aria-labelledby="explore-title">
        <h2 id="explore-title">Components</h2>
        <button>Try a component</button>
      </section>
    </>
  );
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(pointer: fine)",
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("landing anchor navigation", () => {
  it("moves keyboard focus into setup so the next Tab reaches its first action", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await waitFor(() => expect(lenis.create).toHaveBeenCalled());
    await user.tab();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveFocus();
    await user.keyboard("{Enter}");
    const start = screen.getByRole("region", { name: "Start from source" });
    expect(start).toHaveFocus();
    expect(window.location.hash).toBe("#start");
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Copy setup prompt" }),
    ).toHaveFocus();
    expect(start).toHaveAttribute("tabindex", "-1");
  });

  it("focuses other section targets without leaving them in the tab order", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await waitFor(() => expect(lenis.create).toHaveBeenCalled());
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    const explore = screen.getByRole("region", { name: "Components" });
    expect(explore).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Try a component" }),
    ).toHaveFocus();
    expect(explore).not.toHaveAttribute("tabindex");
  });
});
