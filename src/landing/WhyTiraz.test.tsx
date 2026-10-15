import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhyTiraz } from "./WhyTiraz";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function setup() {
  let change = () => {};
  let scrollFrame: FrameRequestCallback = () => {};
  const media = {
    matches: false,
    addEventListener: (_: string, cb: () => void) => {
      change = cb;
    },
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", () => media);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    scrollFrame = cb;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
    1200,
  );
  const result = render(<WhyTiraz ar={false} />);
  const section = result.container.querySelector<HTMLElement>(".lp-story")!;
  const scene = result.container.querySelector<HTMLElement>(".lp-story-scene")!;
  let progress = 0;
  vi.spyOn(section, "getBoundingClientRect").mockImplementation(
    () => ({ top: -progress * 3000, height: 4000 }) as DOMRect,
  );
  if (scene)
    vi.spyOn(scene, "getBoundingClientRect").mockReturnValue({
      height: 1000,
    } as DOMRect);
  const scroll = (next: number) => {
    progress = next;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      scrollFrame(0);
    });
  };
  return { ...result, section, scroll, media, change: () => act(change) };
}

describe("Tiraz pinned story", () => {
  it("derives matching image and text progress from document scroll in both directions", () => {
    const { container, section, scroll, unmount } = setup();
    expect(container.querySelector(".lp-story-scene")).toBeInTheDocument();
    expect(section).toHaveAttribute("data-static", "false");
    scroll(0.5);
    expect(section).toHaveAttribute("data-active", "1");
    const copies = container.querySelectorAll<HTMLElement>(".lp-story-copy");
    const images = container.querySelectorAll<HTMLElement>(
      ".lp-story-visual img",
    );
    expect(copies[1].style.getPropertyValue("--story-opacity")).toBe("1");
    expect(copies[0].style.getPropertyValue("--story-opacity")).toBe("0");
    expect(images[1].style.getPropertyValue("--story-reveal")).toBe("1");
    scroll(0.9);
    expect(section).toHaveAttribute("data-active", "2");
    expect(screen.getByRole("link")).toHaveAttribute("tabindex", "0");
    scroll(0.3);
    const forwardReveal = images[1].style.getPropertyValue("--story-reveal");
    scroll(0.6);
    scroll(0.3);
    expect(images[1].style.getPropertyValue("--story-reveal")).toBe(
      forwardReveal,
    );
    scroll(-0.2);
    expect(section).toHaveAttribute("data-active", "0");
    expect(screen.getByRole("link")).toHaveAttribute("tabindex", "-1");
    scroll(1.2);
    expect(section).toHaveAttribute("data-active", "2");
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("does not oscillate between pinned and stacked widths when copy cannot fit", () => {
    let notify = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container, section } = setup();
    const copy = container.querySelector<HTMLElement>(".lp-story-copy")!;
    const height = vi.spyOn(copy, "scrollHeight", "get").mockReturnValue(1200);
    act(notify);
    expect(section).toHaveAttribute("data-static", "true");
    // Expanding the static layout makes the same copy shorter. It must not repin itself.
    height.mockReturnValue(100);
    act(notify);
    expect(section).toHaveAttribute("data-static", "true");
    act(() => window.dispatchEvent(new Event("resize")));
    expect(section).toHaveAttribute("data-static", "false");
  });

  it("keeps all three chapters available to assistive technology and eagerly loads their images", () => {
    const { container } = setup();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(container.querySelector("[aria-live]")).not.toBeInTheDocument();
    screen
      .getAllByRole("img")
      .forEach((image) => expect(image).toHaveAttribute("loading", "eager"));
  });

  it("switches to all three stacked pairs when motion preference or available height changes", () => {
    const { section, media, change } = setup();
    media.matches = true;
    change();
    expect(section).toHaveAttribute("data-static", "true");
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getByRole("link")).toHaveAttribute("tabindex", "0");
    media.matches = false;
    change();
    expect(section).toHaveAttribute("data-static", "false");
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });
});
