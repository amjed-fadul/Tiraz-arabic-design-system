import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SystemProvider, defaultConfig } from "../../system";
import type { SystemConfig } from "../../system";
import { Loom } from "./Loom";
import type { LoomController } from "./loom-renderer";

const controller = {
  setLayout: vi.fn(),
  setPalette: vi.fn(),
  setPointer: vi.fn(),
  setRunning: vi.fn(),
  dispose: vi.fn(),
} satisfies LoomController;
const mountLoom = vi.fn(() => controller as LoomController | undefined);
vi.mock("./loom-renderer", () => ({
  mountLoom: (...args: unknown[]) => mountLoom(...(args as [])),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  mountLoom.mockImplementation(() => controller);
});

function Hero({ config }: { config: Partial<SystemConfig> }) {
  const band = useRef<HTMLDivElement>(null);
  return (
    <SystemProvider config={{ ...defaultConfig, ...config }}>
      <section className="lp-hero">
        <Loom band={band} ar={false} />
        <div ref={band} />
      </section>
    </SystemProvider>
  );
}

function withWebGL(reduced = false) {
  vi.stubGlobal("WebGLRenderingContext", class {});
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce") ? reduced : false,
    addEventListener() {},
    removeEventListener() {},
  }));
  // jsdom has no 2D canvas; the inscription falls back to an empty band.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  // jsdom has no layout; give the hero and its band slot a real size.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top: 0,
    left: 0,
    width: 1440,
    height: 308,
  } as DOMRect);
}

describe("hero loom", () => {
  it("shows the static woven band without WebGL and offers no motion control", () => {
    const { container } = render(<Hero config={{ theme: "dark" }} />);
    const layer = container.querySelector(".lp-loom")!;
    expect(layer).toHaveAttribute("data-effect", "static");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(mountLoom).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /loom animation/ }),
    ).not.toBeInTheDocument();
  });

  it("weaves live, pauses on request and follows the accent and theme", async () => {
    withWebGL();
    const user = userEvent.setup();
    const { container, rerender, unmount } = render(
      <Hero config={{ theme: "dark", accent: "sage" }} />,
    );
    const pause = await screen.findByRole("button", {
      name: "Pause loom animation",
    });
    expect(container.querySelector(".lp-loom")).toHaveAttribute(
      "data-effect",
      "live",
    );
    expect(mountLoom).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({ still: false }),
    );
    expect(controller.setLayout).toHaveBeenCalled();
    expect(controller.setRunning).toHaveBeenLastCalledWith(true);
    await user.click(pause);
    expect(controller.setRunning).toHaveBeenLastCalledWith(false);
    expect(
      screen.getByRole("button", { name: "Play loom animation" }),
    ).toHaveAttribute("aria-pressed", "true");
    controller.setPalette.mockClear();
    rerender(<Hero config={{ theme: "light", accent: "plum" }} />);
    expect(controller.setPalette).toHaveBeenCalledWith(
      expect.objectContaining({ dark: false }),
    );
    unmount();
    expect(controller.dispose).toHaveBeenCalled();
  });

  it("draws one finished frame for reduced motion, without a pause control", async () => {
    withWebGL(true);
    const { container } = render(<Hero config={{ theme: "dark" }} />);
    await act(async () => {});
    expect(mountLoom).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({ still: true }),
    );
    expect(container.querySelector(".lp-loom")).toHaveAttribute(
      "data-effect",
      "live",
    );
    expect(
      screen.queryByRole("button", { name: /loom animation/ }),
    ).not.toBeInTheDocument();
  });

  it("returns to the static band when the GPU context cannot be created", async () => {
    withWebGL();
    mountLoom.mockImplementation(() => undefined);
    const { container } = render(<Hero config={{ theme: "dark" }} />);
    await act(async () => {});
    expect(container.querySelector(".lp-loom")).toHaveAttribute(
      "data-effect",
      "static",
    );
  });
});
