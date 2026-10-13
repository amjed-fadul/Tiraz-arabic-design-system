import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as dialog from "@radix-ui/react-dialog";
import * as system from "../system";
import * as ts from "typescript";
import { saraPortrait, omarPortrait } from "../system/ai/examples/portraits";
import type { ComponentId } from "./catalog";
import type { PlaygroundModel } from "./model";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
function copiedExample(component: "modal" | "tooltip", controlled = true) {
  const defaults = defaultPlaygrounds("en");
  const model =
    component === "modal"
      ? {
          ...defaults.modal,
          mode: controlled
            ? ("controlled" as const)
            : ("uncontrolled" as const),
        }
      : defaults.tooltip;
  const code = generateCode(
    component,
    model,
    { ...system.defaultConfig, direction: "ltr" },
    "en",
  );
  const js = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports: { default?: React.ComponentType } = {};
  const modules: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsx,
    "@radix-ui/react-dialog": dialog,
    "./system": system,
  };
  new Function("require", "exports", js)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    exports,
  );
  return exports.default!;
}
it("runs the copied Tooltip details action without workbench dependencies", async () => {
  const Example = copiedExample("tooltip");
  render(<Example />);
  await userEvent.click(screen.getByRole("button", { name: "Show details" }));
  expect(
    screen.getByText("This is a local component preview."),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Hide details" }));
  expect(screen.queryByText("This is a local component preview.")).toBeNull();
});
it.each([true, false])(
  "runs copied Modal controlled=%s preview, nested reset and footer dismissal",
  async (controlled) => {
    const Example = copiedExample("modal", controlled),
      user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "View options" });
    await user.click(trigger);
    const select = screen.getByRole("combobox", { name: "Layout" });
    await waitFor(() => expect(select).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    await user.click(screen.getByRole("option", { name: "Cards" }));
    expect(select).toHaveTextContent("Cards");
    await user.click(screen.getByRole("button", { name: "Preview actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Reset to list" }));
    expect(select).toHaveTextContent("List");
    await user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent("Layout: List");
  },
);

function feedbackCopy(
  component: ComponentId,
  model: PlaygroundModel,
  language: "ar" | "en" = "en",
) {
  const code = generateCode(
    component,
    model,
    { ...system.defaultConfig, direction: language === "ar" ? "rtl" : "ltr" },
    language,
  );
  const js = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports: { default?: React.ComponentType } = {};
  const modules: Record<string, unknown> = {
    "react/jsx-runtime": jsx,
    "./system": system,
    "./system/ai/assets/sara.jpg": saraPortrait,
    "./system/ai/assets/omar.jpg": omarPortrait,
  };
  new Function("require", "exports", js)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    exports,
  );
  return exports.default!;
}
it("runs copied feedback modes and photo compositions without workbench imports", () => {
  const p = defaultPlaygrounds("en");
  for (const [id, model] of [
    ["alert", p.alert],
    ["skeleton", p.skeleton],
    ["progress", p.progress],
    ["progress", { ...p.progress, indeterminate: true }],
    ["spinner", p.spinner],
    ["spinner", { ...p.spinner, decorative: true }],
    ["avatar", { ...p.avatar, appearance: "photo" }],
    ["avatar-group", p["avatar-group"]],
  ] as Array<[ComponentId, PlaygroundModel]>) {
    const Example = feedbackCopy(id, model);
    const { container, unmount } = render(<Example />);
    if (id === "alert") {
      expect(screen.getByText(p.alert.title)).toBeInTheDocument();
      expect(screen.queryByRole("alert")).toBeNull();
    }
    if (id === "skeleton")
      expect(container.querySelector(".tz-skeleton")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    if (id === "progress") {
      const bar = screen.getByRole("progressbar", { name: p.progress.label });
      if ((model as { indeterminate: boolean }).indeterminate)
        expect(bar).not.toHaveAttribute("aria-valuenow");
      else expect(bar).toHaveAttribute("aria-valuenow", "64");
    }
    if (id === "spinner") expect(screen.getAllByRole("status")).toHaveLength(1);
    if (id === "avatar")
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        saraPortrait,
      );
    if (id === "avatar-group") {
      expect(container.querySelectorAll("img")).toHaveLength(2);
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        saraPortrait,
      );
    }
    unmount();
  }
});
it("copies a custom photo URL exactly and ignores it in initials mode", () => {
  const p = defaultPlaygrounds("en").avatar;
  const url = "/my-profile.jpg";
  expect(
    generateCode(
      "avatar",
      { ...p, appearance: "photo", src: url },
      system.defaultConfig,
      "en",
    ),
  ).toContain(`src={"${url}"}`);
  expect(
    generateCode("avatar", { ...p, src: url }, system.defaultConfig, "en"),
  ).not.toContain(url);
});
