import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { defaultConfig } from "../system";
import { defaultPlaygrounds } from "./model";
import { generateCode, generatePrompt } from "./generate";
import { persist, storageKeys } from "./storage";
for (const component of ["tag-input", "filter-bar", "input-copy"] as const) {
  it(`documents ${component} with working examples, minimal controls and complete copied source/prompt`, async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, "writeText");
    persist(storageKeys.documentation, { language: "en", active: component });
    render(<Workbench />);
    const nav = screen.getByRole("navigation", { name: "Components" });
    const name =
      component === "tag-input"
        ? "TagInput"
        : component === "filter-bar"
          ? "FilterBar"
          : "InputCopy";
    expect(within(nav).getByRole("button", { name })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).getByRole("group", {
        name: component === "filter-bar" ? "Data" : "Forms",
      }),
    ).toContainElement(within(nav).getByRole("button", { name }));
    expect(screen.getByRole("heading", { level: 1, name })).toBeInTheDocument();
    expect(document.querySelector(".docs-tabs")).toBeNull();
    const model = defaultPlaygrounds("en")[component];
    const config = {
      accent: defaultConfig.accent,
      density: defaultConfig.density,
      typography: defaultConfig.typography,
      radius: defaultConfig.radius,
      reducedMotion: defaultConfig.reducedMotion,
      direction: "ltr" as const,
      theme: defaultConfig.theme,
    };
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(write).toHaveBeenLastCalledWith(
      generateCode(component, model, config, "en"),
    );
    await user.click(screen.getByRole("button", { name: "Copy agent prompt" }));
    expect(write).toHaveBeenLastCalledWith(
      generatePrompt(component, model, config, "en"),
    );
    const preview = within(
      screen.getByRole("region", { name: "Interactive playground" }),
    );
    if (component === "tag-input") {
      await user.type(preview.getByRole("textbox"), "Local{Enter}draft");
      await user.click(
        preview.getByRole("button", { name: "Read form values" }),
      );
      expect(preview.getByText(/Local form values/)).toHaveTextContent(
        '["Design","Reading","Local"]',
      );
      await user.click(preview.getByRole("button", { name: "Reset tags" }));
      expect(
        preview.queryByRole("button", { name: "Remove Local" }),
      ).toBeNull();
    } else if (component === "filter-bar") {
      await user.type(preview.getByRole("searchbox"), "guide");
      expect(preview.getByRole("status")).toHaveTextContent("2 documents");
      await user.click(preview.getByRole("button", { name: "Clear all" }));
      expect(preview.getByRole("status")).toHaveTextContent("3 documents");
    } else {
      expect(
        within(
          screen.getByRole("complementary", { name: "Customization" }),
        ).getByLabelText("Value", { exact: true }),
      ).toHaveValue("src/system/TagInput.tsx");
      expect(preview.getByRole("textbox")).toHaveValue(
        "src/system/TagInput.tsx",
      );
      await user.click(
        preview.getByRole("button", { name: "Copy Source path" }),
      );
      expect(write).toHaveBeenLastCalledWith("src/system/TagInput.tsx");
    }
  });
}
