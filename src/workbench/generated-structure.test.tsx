import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as ts from "typescript";
import * as system from "../system";
import { generateCode } from "./generate";
import { defaultPlaygrounds } from "./model";
import type { PlaygroundModel } from "./model";
type Structure = "card" | "accordion" | "breadcrumbs" | "pagination";
function copiedExample(
  component: Structure,
  model: PlaygroundModel,
  language: "ar" | "en",
) {
  const code = generateCode(
    component,
    model,
    { ...system.defaultConfig, direction: language === "ar" ? "rtl" : "ltr" },
    language,
  );
  const javascript = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports: { default?: React.ComponentType } = {};
  const modules: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsx,
    "./system": system,
  };
  new Function("require", "exports", javascript)(
    (name: string) => (name.endsWith(".css") ? {} : modules[name]),
    exports,
  );
  return exports.default!;
}
it.each(["ar", "en"] as const)(
  "runs copied %s Card, Breadcrumbs and Pagination outcomes independently of the workbench",
  async (language) => {
    const ar = language === "ar",
      p = defaultPlaygrounds(language),
      user = userEvent.setup();
    const Card = copiedExample("card", p.card, language);
    const card = render(<Card />);
    await user.click(
      screen.getByRole("button", {
        name: ar ? "قراءة الملاحظات" : "Read notes",
      }),
    );
    expect(
      screen.getByText(
        ar
          ? "استخدم الرموز المشتركة للمسافات والزوايا."
          : "Use shared tokens for spacing and corners.",
      ),
    ).toBeVisible();
    card.unmount();
    const Breadcrumbs = copiedExample("breadcrumbs", p.breadcrumbs, language);
    const breadcrumbs = render(<Breadcrumbs />);
    for (const link of screen.getAllByRole("link"))
      expect(
        document.getElementById(link.getAttribute("href")!.slice(1)),
      ).toBeInTheDocument();
    expect(document.querySelector('[aria-current="page"]')).toHaveTextContent(
      p.breadcrumbs.current,
    );
    breadcrumbs.unmount();
    const Pagination = copiedExample(
      "pagination",
      { page: 11, totalPages: 12 },
      language,
    );
    render(<Pagination />);
    await user.click(
      screen.getByRole("button", { name: ar ? "التالي" : "Next" }),
    );
    expect(
      screen.getByRole("heading", {
        name: ar ? "ملاحظة الدليل ١٢" : "Guide note 12",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: ar ? "التالي" : "Next" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: ar ? "السابق" : "Previous" }),
    );
    expect(
      screen.getByRole("heading", {
        name: ar ? "ملاحظة الدليل ١١" : "Guide note 11",
      }),
    ).toBeVisible();
  },
);
it.each(["controlled", "uncontrolled"] as const)(
  "runs copied Accordion in %s mode with optional collapse",
  async (mode) => {
    const Example = copiedExample(
        "accordion",
        { mode, collapsible: true },
        "en",
      ),
      user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Layout" }));
    expect(screen.getByRole("region", { name: "Layout" })).toHaveTextContent(
      "Content stays in reading order",
    );
    await user.click(screen.getByRole("button", { name: "Layout" }));
    expect(screen.queryByRole("region")).toBeNull();
  },
);
