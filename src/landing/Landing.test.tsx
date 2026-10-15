import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Landing } from "./Landing";

describe("landing behavior", () => {
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
    await user.click(screen.getByRole("button", { name: "Use dark theme" }));
    expect(container.querySelector(".tiraz-system")).toHaveAttribute(
      "data-theme",
      "dark",
    );
    expect(
      screen.getAllByRole("button", { name: "Use light theme" }),
    ).toHaveLength(1);
  });

  it("uses the real documentation entry and keeps mixed source paths isolated", () => {
    render(<Landing />);
    const docs = screen.getAllByRole("link", { name: "التوثيق" });
    expect(docs[0]).toHaveAttribute("href", "./index.html#main-content");
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
      "--action": "#365B87",
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
      "--action": "#6B487A",
    });
    expect(screen.getByTestId("order-total")).toHaveTextContent("672");
    await user.click(screen.getByRole("button", { name: "Use dark theme" }));
    expect(container.querySelector(".tiraz-system")).toHaveStyle({
      "--action": "#D6B6E5",
    });
    expect(screen.getByRole("tab", { name: "Last 3 days" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
