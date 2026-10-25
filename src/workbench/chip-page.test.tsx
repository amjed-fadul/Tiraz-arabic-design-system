import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { LibraryPage } from "./LibraryPage";
import { IllustrationsPage } from "./IllustrationsPage";
import { defaultConfig, SystemProvider } from "../system";
import { persist, storageKeys } from "./storage";
import { ChipExample } from "../system/ai/examples/ChipExamples";

it.each(["ar", "en"] as const)(
  "filters real example results and keeps focus in %s",
  async (language) => {
    render(
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: language === "ar" ? "rtl" : "ltr",
        }}
      >
        <ChipExample language={language} />
      </SystemProvider>,
    );
    const user = userEvent.setup();
    const design = screen.getByRole("button", {
      name: language === "ar" ? "التصميم" : "Design",
    });
    await user.click(design);
    expect(design).toHaveFocus();
    expect(design).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.queryByText(language === "ar" ? "إعداد المشروع" : "Project setup"),
    ).toBeNull();
  },
);

it("supports several active filters and clears with All", async () => {
  render(
    <SystemProvider>
      <ChipExample language="en" behavior="multiple" />
    </SystemProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Design" }));
  await user.click(screen.getByRole("button", { name: "Development" }));
  expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  await user.click(screen.getByRole("button", { name: "All" }));
  expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
});

it("customizes the Chip preview's label, disabled state and native navigation mode", async () => {
  persist(storageKeys.documentation, {
    language: "en",
    active: "chip",
    settingsOpen: true,
  });
  render(<Workbench />);
  const user = userEvent.setup();
  const settings = within(
    screen.getByRole("complementary", { name: "Customize the preview" }),
  );
  const preview = () =>
    within(screen.getByRole("region", { name: "Interactive playground" }));
  await user.clear(settings.getByRole("textbox", { name: "Label" }));
  await user.type(settings.getByRole("textbox", { name: "Label" }), "Brand");
  expect(preview().getByRole("button", { name: "Brand" })).toBeVisible();
  await user.click(settings.getByRole("switch", { name: "Disabled" }));
  expect(preview().getByRole("button", { name: "Brand" })).toBeDisabled();
  const modes = within(settings.getByRole("group", { name: "Behavior" }));
  await user.click(modes.getByRole("button", { name: "Navigation" }));
  expect(preview().getByRole("link", { name: "Brand" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await user.click(settings.getByRole("switch", { name: "Disabled" }));
  expect(preview().getByRole("link", { name: "Brand" })).toHaveAttribute(
    "href",
    expect.stringMatching(/^#/),
  );
});

it("uses the same Chip style for category links and illustration filters while preserving navigation", () => {
  const navigate = vi.fn();
  const { unmount } = render(
    <SystemProvider>
      <LibraryPage language="en" theme="light" navigate={navigate} />
    </SystemProvider>,
  );
  const forms = screen.getByRole("link", { name: "Forms" });
  expect(forms).toHaveClass("tz-chip");
  fireEvent.click(forms, { ctrlKey: true });
  expect(navigate).not.toHaveBeenCalled();
  fireEvent.click(forms);
  expect(navigate).toHaveBeenCalledWith({ kind: "library", category: "forms" });
  unmount();
  render(
    <SystemProvider>
      <IllustrationsPage language="en" navigate={vi.fn()} />
    </SystemProvider>,
  );
  expect(screen.getByRole("button", { name: "All" })).toHaveClass("tz-chip");
});

it("tracks the navigation example's current location when fragments change or history restores them", () => {
  const { rerender } = render(
    <ChipExample language="en" behavior="navigation" selected />,
  );
  const design = screen.getByRole("link", { name: "Design" });
  const development = screen.getByRole("link", { name: "Development" });
  const restore = (fragment: string) => {
    act(() => {
      window.history.replaceState(
        null,
        "",
        fragment || window.location.pathname,
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
  };
  try {
    expect(design).toHaveAttribute("aria-current", "location");
    restore(development.getAttribute("href")!);
    expect(development).toHaveAttribute("aria-current", "location");
    expect(design).not.toHaveAttribute("aria-current");
    restore(design.getAttribute("href")!);
    expect(design).toHaveAttribute("aria-current", "location");
    expect(development).not.toHaveAttribute("aria-current");
    // An existing fragment wins over the example's initial-selection setting.
    rerender(
      <ChipExample language="en" behavior="navigation" selected={false} />,
    );
    expect(design).toHaveAttribute("aria-current", "location");
    restore("");
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  } finally {
    restore("");
  }
});

it("restores the current link when a copied navigation example is opened at an existing fragment", () => {
  const first = render(<ChipExample language="en" behavior="navigation" />);
  const fragment = screen
    .getByRole("link", { name: "Design" })
    .getAttribute("href")!;
  first.unmount();
  window.history.replaceState(null, "", fragment);
  try {
    render(<ChipExample language="en" behavior="navigation" />);
    expect(screen.getByRole("link", { name: "Design" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  } finally {
    window.history.replaceState(null, "", window.location.pathname);
  }
});
