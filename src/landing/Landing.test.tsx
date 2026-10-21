import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Landing } from "./Landing";
import {
  persist,
  readDocumentation,
  readTheme,
  storageKeys,
} from "../workbench/storage";

describe("landing behavior", () => {
  it("shares saved language and theme with the library and preserves its last page", async () => {
    const user = userEvent.setup();
    persist(storageKeys.documentation, {
      language: "en",
      active: "date-picker",
      screen: "dashboard",
      settingsOpen: true,
      aiPartsOpen: true,
    });
    persist(storageKeys.theme, "light");
    const first = render(<Landing />);
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(first.container.querySelector(".tiraz-system")).toHaveAttribute(
      "data-theme",
      "light",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Arabic interfaces",
    );
    await user.click(screen.getByRole("button", { name: "Use dark theme" }));
    await user.click(screen.getByRole("button", { name: "العربية" }));
    expect(readTheme()).toBe("dark");
    expect(readDocumentation()).toEqual({
      language: "ar",
      active: "date-picker",
      screen: "dashboard",
      settingsOpen: true,
      aiPartsOpen: true,
    });
    first.unmount();
    const returned = render(<Landing />);
    expect(document.documentElement.lang).toBe("ar");
    expect(returned.container.querySelector(".tiraz-system")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
  });

  it("keeps Arabic and the night loom when saved preferences are invalid", () => {
    localStorage.setItem(storageKeys.documentation, "invalid JSON");
    persist(storageKeys.theme, "unsupported");
    const { container } = render(<Landing />);
    expect(document.documentElement.lang).toBe("ar");
    expect(container.querySelector(".tiraz-system")).toHaveAttribute(
      "data-theme",
      "dark",
    );
  });

  it("pairs language with document direction and translates the live composition", async () => {
    const user = userEvent.setup();
    render(<Landing />);
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Arabic interfaces",
    );
    expect(
      screen.getByRole("region", { name: "Live product example" }),
    ).toHaveTextContent("Sample data");
    await user.click(screen.getByRole("button", { name: "العربية" }));
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("updates period totals from sample rows and changes the single theme", async () => {
    const user = userEvent.setup();
    const { container } = render(<Landing />);
    await user.click(screen.getByRole("button", { name: "English" }));
    const demo = screen.getByRole("region", { name: "Live product example" });
    expect(within(demo).getByTestId("order-total")).toHaveTextContent("1,124");
    await user.click(within(demo).getByRole("tab", { name: "Last 3 days" }));
    expect(within(demo).getByTestId("order-total")).toHaveTextContent("672");
    // The night loom is the default; one control switches the whole page.
    expect(container.querySelector(".tiraz-system")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    await user.click(screen.getByRole("button", { name: "Use light theme" }));
    expect(container.querySelector(".tiraz-system")).toHaveAttribute(
      "data-theme",
      "light",
    );
    expect(document.documentElement.dataset.landingTheme).toBe("light");
    expect(
      screen.getAllByRole("button", { name: "Use dark theme" }),
    ).toHaveLength(1);
    expect(within(demo).getByTestId("order-total")).toHaveTextContent("672");
  });

  it("uses the real documentation entry and keeps mixed source paths isolated", () => {
    render(<Landing />);
    const docs = screen.getAllByRole("link", { name: "المكتبة" });
    expect(docs[0]).toHaveAttribute("href", "/library");
    expect(
      screen.getByText("src/system/ai/README.md").closest("bdi"),
    ).toHaveAttribute("dir", "ltr");
  });
});

describe("hero accent customization", () => {
  it("keeps the example controls while removing the redundant introduction", async () => {
    const user = userEvent.setup();
    const { container } = render(<Landing />);
    expect(container.querySelector(".lp-hero-caption")).not.toBeInTheDocument();
    expect(
      container.querySelector(".lp-principle-strip"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(
      screen.queryByText(/Tint the textile and customize/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/TIRAZ IN ACTION/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Hero swatches customize this example/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Blue" })).toBeEnabled();
    expect(screen.getByRole("tab", { name: "Last 3 days" })).toBeEnabled();
  });

  it("uses one shared accent and preserves the working example state", async () => {
    const user = userEvent.setup();
    const { container } = render(<Landing />);
    await user.click(screen.getByRole("button", { name: "English" }));
    await user.click(screen.getByRole("tab", { name: "Last 3 days" }));
    await user.type(
      screen.getByRole("textbox", { name: "Project name" }),
      "Nawa",
    );
    await user.click(screen.getByRole("radio", { name: "Blue" }));
    expect(container.querySelectorAll(".tiraz-system")).toHaveLength(1);
    expect(container.querySelector(".tiraz-system")).toHaveStyle({
      "--action": "#A8C6EF",
    });
    expect(screen.getByRole("radio", { name: "Blue" })).toBeChecked();
    expect(screen.getByTestId("order-total")).toHaveTextContent("672");
    expect(screen.getByRole("textbox", { name: "Project name" })).toHaveValue(
      "Nawa",
    );
    expect(
      screen.queryByRole("button", { name: "Try an accent" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Purple" })).toBeChecked();
    expect(container.querySelector(".tiraz-system")).toHaveStyle({
      "--action": "#D6B6E5",
    });
    expect(screen.getByTestId("order-total")).toHaveTextContent("672");
    await user.click(screen.getByRole("button", { name: "Use light theme" }));
    expect(container.querySelector(".tiraz-system")).toHaveStyle({
      "--action": "#6B487A",
    });
    expect(screen.getByRole("tab", { name: "Last 3 days" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});

describe("night loom page", () => {
  it("shows the woven hero band as decoration, without WebGL in this environment", () => {
    const { container } = render(<Landing />);
    const loom = container.querySelector(".lp-hero .lp-loom")!;
    expect(loom).toHaveAttribute("aria-hidden", "true");
    expect(loom).toHaveAttribute("data-effect", "static");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "نظام تصميم لبناء واجهات عربية",
    );
  });

  it("showcases real Tiraz components that respond to input", async () => {
    const user = userEvent.setup();
    render(<Landing />);
    await user.click(screen.getByRole("button", { name: "English" }));
    const gallery = screen.getByRole("region", {
      name: "Components for your app",
    });
    expect(
      within(gallery).getByRole("switch", { name: "Instant notifications" }),
    ).toBeChecked();
    expect(
      within(gallery).getByRole("slider", { name: "Display density" }),
    ).toHaveValue("60");
    expect(
      within(gallery).getByRole("progressbar", {
        name: "Sample project progress",
      }),
    ).toHaveAttribute("aria-valuenow", "72");
    const code = within(gallery).getByRole("textbox", {
      name: "Verification code",
    });
    expect(code).toHaveValue("4271");
    await user.click(
      within(gallery).getByRole("switch", { name: "Instant notifications" }),
    );
    expect(
      within(gallery).getByRole("switch", { name: "Instant notifications" }),
    ).not.toBeChecked();
    expect(
      within(gallery).getByRole("button", { name: /Delivery date/ }),
    ).toBeInTheDocument();
  });

  it("sends every Get started action to the setup steps and Browse components to the gallery", async () => {
    const user = userEvent.setup();
    render(<Landing />);
    await user.click(screen.getByRole("button", { name: "English" }));
    const starts = screen.getAllByRole("link", { name: "Get started" });
    expect(starts).toHaveLength(2);
    starts.forEach((link) => expect(link).toHaveAttribute("href", "#start"));
    const browse = screen.getAllByRole("link", { name: "Browse components" });
    expect(browse).toHaveLength(2);
    browse.forEach((link) => expect(link).toHaveAttribute("href", "#explore"));
    expect(
      screen.getByRole("button", { name: "Get started" }),
    ).toBeInTheDocument();
    expect(document.title).toBe(
      "Tiraz · A design system for Arabic interfaces",
    );
  });

  it("lists each selected component family once for assistive technology", async () => {
    const user = userEvent.setup();
    render(<Landing />);
    const names = screen.getByRole("region", { name: "مكوّنات طِراز" });
    expect(within(names).getAllByRole("listitem")).toHaveLength(41);
    await user.click(screen.getByRole("button", { name: "English" }));
    const list = screen.getByRole("region", { name: "Tiraz components" });
    expect(
      within(list).getByText("DatePicker", { selector: "li" }),
    ).toBeVisible();
  });
});
