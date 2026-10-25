import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Chip } from "./Chip";

it("toggles the host selection with Enter and Space while keeping its label and focus", async () => {
  function Example() {
    const [selected, setSelected] = useState(false);
    return (
      <Chip selected={selected} onClick={() => setSelected(!selected)}>
        التصميم
      </Chip>
    );
  }
  render(<Example />);
  const user = userEvent.setup(),
    chip = screen.getByRole("button", { name: "التصميم", pressed: false });
  await user.tab();
  await user.keyboard("{Enter}");
  expect(chip).toHaveAttribute("aria-pressed", "true");
  expect(chip).toHaveFocus();
  await user.keyboard(" ");
  expect(chip).toHaveAttribute("aria-pressed", "false");
  expect(chip).toHaveAccessibleName("التصميم");
});

it("does not submit its parent form by default but honors an explicit submit type", async () => {
  const submit = vi.fn((e) => e.preventDefault());
  render(
    <form onSubmit={submit}>
      <Chip>Filter</Chip>
      <Chip type="submit">Apply</Chip>
    </form>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Filter" }));
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(submit).toHaveBeenCalledOnce();
});

it("renders real category URLs and marks only the current link", () => {
  render(
    <nav>
      <Chip href="/library?category=forms" selected>
        Forms
      </Chip>
      <Chip href="/library?category=files" target="_blank" rel="noreferrer">
        Files
      </Chip>
    </nav>,
  );
  const forms = screen.getByRole("link", { name: "Forms", current: "page" });
  expect(forms).toHaveAttribute("href", "/library?category=forms");
  expect(forms).not.toHaveAttribute("aria-pressed");
  const files = screen.getByRole("link", { name: "Files" });
  expect(files).not.toHaveAttribute("aria-current");
  expect(files).toHaveAttribute("target", "_blank");
});

it("blocks disabled button and link activation, including auxiliary clicks and forced tabIndex", async () => {
  const click = vi.fn(),
    auxiliary = vi.fn();
  render(
    <>
      <Chip disabled onClick={click}>
        Filter
      </Chip>
      <Chip
        href="/forms"
        disabled
        tabIndex={0}
        onClick={click}
        onAuxClick={auxiliary}
      >
        Forms
      </Chip>
      <Chip>Next</Chip>
    </>,
  );
  const link = screen.getByRole("link", { name: "Forms" });
  expect(link).not.toHaveAttribute("href");
  expect(link).toHaveAttribute("aria-disabled", "true");
  expect(link).toHaveAttribute("tabindex", "-1");
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Filter" }));
  await user.click(link);
  expect(fireEvent.click(link)).toBe(false);
  expect(
    fireEvent(
      link,
      new MouseEvent("auxclick", {
        bubbles: true,
        cancelable: true,
        button: 1,
      }),
    ),
  ).toBe(false);
  expect(click).not.toHaveBeenCalled();
  expect(auxiliary).not.toHaveBeenCalled();
  await user.tab();
  expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
});

it("forwards refs to the actual native elements and respects controlled selection", () => {
  const button = createRef<HTMLButtonElement>(),
    link = createRef<HTMLAnchorElement>();
  const { rerender } = render(
    <>
      <Chip ref={button} selected={false}>
        One
      </Chip>
      <Chip href="#two" ref={link}>
        Two
      </Chip>
    </>,
  );
  expect(button.current).toBe(screen.getByRole("button", { name: "One" }));
  expect(link.current).toBe(screen.getByRole("link", { name: "Two" }));
  fireEvent.click(button.current!);
  expect(button.current).toHaveAttribute("aria-pressed", "false");
  rerender(
    <>
      <Chip ref={button} selected>
        One
      </Chip>
      <Chip href="#two" ref={link} selected>
        Two
      </Chip>
    </>,
  );
  expect(button.current).toHaveAttribute("aria-pressed", "true");
  expect(link.current).toHaveAttribute("aria-current", "page");
});

it("uses the supplied current-location semantics only while its link is selected", () => {
  const { rerender } = render(
    <Chip href="#design" selected aria-current="location">
      Design
    </Chip>,
  );
  expect(screen.getByRole("link", { name: "Design" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  rerender(
    <Chip href="#design" aria-current="location">
      Design
    </Chip>,
  );
  expect(screen.getByRole("link", { name: "Design" })).not.toHaveAttribute(
    "aria-current",
  );
});
