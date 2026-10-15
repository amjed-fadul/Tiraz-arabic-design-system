import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhyTiraz } from "./WhyTiraz";

afterEach(() => vi.unstubAllGlobals());

describe("Tiraz story", () => {
  it("activates the image for the visible chapter and cleans up observation", () => {
    let notify: IntersectionObserverCallback = () => {};
    const observed: Element[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        disconnect = disconnect;
      },
    );
    const { container, unmount } = render(<WhyTiraz ar={false} />);
    expect(observed).toHaveLength(3);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    act(() =>
      notify(
        [
          { target: observed[0], isIntersecting: false, intersectionRatio: 0 },
          { target: observed[1], isIntersecting: true, intersectionRatio: 1 },
        ] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      ),
    );
    expect(container.querySelector(".lp-story-visual")).toHaveAttribute(
      "data-active",
      "1",
    );
    expect(screen.getByRole("img")).toHaveAccessibleName(/modules/i);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("makes every chapter image accessible with reduced motion or no observer", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<WhyTiraz ar={false} />);
    expect(container.querySelector(".lp-story")).toHaveAttribute(
      "data-static",
      "true",
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Arabic first" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "One coherent system" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Built to work with AI" }),
    ).toBeVisible();
  });

  it("switches to the complete static story when motion preference changes", () => {
    let change = () => {};
    const media = {
      matches: false,
      addEventListener: (_: string, cb: () => void) => {
        change = cb;
      },
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("matchMedia", () => media);
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(<WhyTiraz ar={false} />);
    expect(container.querySelector(".lp-story")).toHaveAttribute(
      "data-static",
      "false",
    );
    act(() => {
      media.matches = true;
      change();
    });
    expect(container.querySelector(".lp-story")).toHaveAttribute(
      "data-static",
      "true",
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });
});
