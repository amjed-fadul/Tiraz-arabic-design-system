import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Playground } from "./Playground";
import { defaultPlaygrounds } from "./model";
it("renders controlled Input without conflicting native defaults", () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    render(
      <Playground
        component="input"
        model={{ ...defaultPlaygrounds("en").input, value: "Controlled" }}
        language="en"
        onPatch={() => {}}
        onEvent={() => {}}
        onButtonAction={() => {}}
      />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("Controlled");
    expect(error.mock.calls.flat().join(" ")).not.toMatch(
      /both value and defaultValue/,
    );
  } finally {
    error.mockRestore();
  }
});
