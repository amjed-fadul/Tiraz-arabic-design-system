import type { CSSProperties } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { SystemProvider } from "./Provider";
import { Button } from "./Button";
import { Input } from "./Input";
import { defaultConfig } from "./config";
import { useSystem } from "./useSystem";

it("keeps the existing root and defaults when no root props are supplied", () => {
  const { container } = render(
    <SystemProvider>
      <Button>Continue</Button>
    </SystemProvider>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root.className).toBe("tiraz-system");
  expect(root).not.toHaveAttribute("lang");
  expect(root).toHaveAttribute("dir", "rtl");
  expect(root).toHaveAttribute("data-theme", "light");
  expect(root).toHaveAttribute("data-density", "compact");
  expect(root.style.getPropertyValue("--radius")).toBe(
    "var(--tiraz-radius, 8px)",
  );
  expect(screen.getByRole("button", { name: "Continue" }).parentElement).toBe(
    root,
  );
});

it("applies application layout and language to the existing provider root", () => {
  const rootProps = {
    className: "dashboard embedded",
    lang: "en",
    style: { height: "100%", minHeight: 480, width: "100%" },
  };
  const { container } = render(
    <SystemProvider {...rootProps}>
      <Input label="Name" />
    </SystemProvider>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root).toHaveClass("tiraz-system", "dashboard", "embedded");
  expect(root).toHaveAttribute("lang", "en");
  // Language does not override the caller's direction configuration.
  expect(root).toHaveAttribute("dir", "rtl");
  expect(root).toHaveStyle({
    height: "100%",
    minHeight: "480px",
    width: "100%",
  });
  expect(screen.getByRole("textbox", { name: "Name" }).closest("[lang]")).toBe(
    root,
  );
});

it("preserves configured variables while accepting supported theme overrides", () => {
  const style = {
    minHeight: 240,
    colorScheme: "light",
    "--action": "red",
    "--radius": "0px",
    "--tiraz-action": "#123456",
    "--tiraz-radius": "12px",
  } as CSSProperties;
  const { container } = render(
    <SystemProvider config={{ ...defaultConfig, theme: "dark" }} {...{ style }}>
      <Button>Continue</Button>
    </SystemProvider>,
  );
  const root = container.firstElementChild as HTMLElement;
  expect(root.style.minHeight).toBe("240px");
  expect(root.style.colorScheme).toBe("dark");
  expect(root.style.getPropertyValue("--action")).toBe(
    "var(--tiraz-action, #A5C9B4)",
  );
  expect(root.style.getPropertyValue("--radius")).toBe(
    "var(--tiraz-radius, 8px)",
  );
  expect(root.style.getPropertyValue("--tiraz-action")).toBe("#123456");
  expect(root.style.getPropertyValue("--tiraz-radius")).toBe("12px");
  expect(style.colorScheme).toBe("light");
});

it("updates root props and configuration without remounting a focused control", async () => {
  const view = (dark: boolean) => (
    <SystemProvider
      config={{
        ...defaultConfig,
        theme: dark ? "dark" : "light",
        reducedMotion: dark,
      }}
      {...{ className: dark ? "night" : "day", lang: dark ? "en" : "ar" }}
    >
      <Input label="Name" defaultValue="Amjed" />
    </SystemProvider>
  );
  const { container, rerender } = render(view(false));
  const input = screen.getByRole("textbox", { name: "Name" });
  await userEvent.setup().tab();
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: "أمجد" } });
  rerender(view(true));
  expect(screen.getByRole("textbox", { name: "Name" })).toBe(input);
  expect(input).toHaveFocus();
  expect(input).toHaveValue("أمجد");
  const root = container.firstElementChild;
  expect(root).toHaveClass("tiraz-system", "night");
  expect(root).not.toHaveClass("day");
  expect(root).toHaveAttribute("lang", "en");
  expect(root).toHaveAttribute("data-theme", "dark");
  expect(root).toHaveAttribute("data-reduced-motion", "true");
  expect(root).toHaveAttribute("data-modality", "keyboard");
});

it("keeps the nearest provider as the context container when roots are customized", () => {
  function Consumer() {
    const { container, config } = useSystem();
    return (
      <output>{`${container?.className ?? "pending"}:${config.direction}`}</output>
    );
  }
  render(
    <SystemProvider {...{ className: "outer", lang: "ar" }}>
      <SystemProvider
        config={{ ...defaultConfig, direction: "ltr" }}
        {...{ className: "inner", lang: "en" }}
      >
        <Consumer />
      </SystemProvider>
    </SystemProvider>,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "tiraz-system inner:ltr",
  );
});
