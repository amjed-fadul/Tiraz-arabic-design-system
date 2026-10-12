import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { defaultPlaygrounds } from "./model";
import { persist, storageKeys } from "./storage";
function preview() {
  return within(
    screen.getByRole("region", { name: "المعاينة التفاعلية" }),
  ).getByRole("button");
}
function controls() {
  return within(screen.getByRole("complementary", { name: "التخصيص" }));
}
function tick(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}
afterEach(() => vi.useRealTimers());
it.each(["success", "error"] as const)(
  "returns simulated %s feedback to idle without persisting it",
  (outcome) => {
    vi.useFakeTimers();
    persist(storageKeys.playgrounds, {
      ...defaultPlaygrounds("ar"),
      button: { ...defaultPlaygrounds("ar").button, outcome },
    });
    render(<Workbench />);
    fireEvent.click(preview());
    expect(preview()).toHaveAttribute("data-state", "loading");
    expect(
      JSON.parse(localStorage.getItem(storageKeys.playgrounds)!).button.state,
    ).toBe("idle");
    expect(controls().getByLabelText("الحالة")).toHaveValue("idle");
    expect(
      screen.getByRole("region", { name: "مثال الاستخدام" }),
    ).toHaveTextContent('ButtonState>("idle")');
    tick(1200);
    expect(preview()).toHaveAttribute("data-state", outcome);
    tick(1000);
    expect(preview()).toHaveAttribute("data-state", "idle");
    fireEvent.click(preview());
    expect(preview()).toHaveAttribute("data-state", "loading");
    tick(2200);
    expect(preview()).toHaveAttribute("data-state", "idle");
  },
);
it.each(["التسمية", "النوع", "الحجم", "الأيقونة", "الحالة"])(
  "cancels old simulation on contextual edit: %s",
  (field) => {
    vi.useFakeTimers();
    render(<Workbench />);
    fireEvent.click(preview());
    const values: Record<string, string> = {
      التسمية: "اختيار جديد",
      النوع: "ghost",
      الحجم: "md",
      الأيقونة: "plus",
      الحالة: "error",
    };
    fireEvent.change(controls().getByLabelText(field), {
      target: { value: values[field] },
    });
    expect(preview()).toHaveAttribute(
      "data-state",
      field === "الحالة" ? "error" : "idle",
    );
    tick(5000);
    expect(preview()).toHaveAttribute(
      "data-state",
      field === "الحالة" ? "error" : "idle",
    );
  },
);
it("preserves an intentional inspector feedback state after simulation", () => {
  vi.useFakeTimers();
  render(<Workbench />);
  fireEvent.change(controls().getByLabelText("الحالة"), {
    target: { value: "error" },
  });
  fireEvent.click(preview());
  tick(1200);
  expect(preview()).toHaveAttribute("data-state", "success");
  tick(1000);
  expect(preview()).toHaveAttribute("data-state", "error");
  expect(
    JSON.parse(localStorage.getItem(storageKeys.playgrounds)!).button.state,
  ).toBe("error");
});
it("propagates global settings during feedback and cancels timers on both resets", () => {
  vi.useFakeTimers();
  const { container } = render(<Workbench />);
  fireEvent.click(preview());
  fireEvent.change(controls().getByLabelText("اللون الأساسي"), {
    target: { value: "blue" },
  });
  expect(preview()).toHaveAttribute("data-state", "loading");
  expect(
    (
      container.querySelector(".playground-region .tiraz-system") as HTMLElement
    ).style.getPropertyValue("--action"),
  ).toBe("#365B87");
  tick(1200);
  fireEvent.click(controls().getByRole("button", { name: "إعادة ضبط النظام" }));
  expect(preview()).toHaveAttribute("data-state", "idle");
  tick(3000);
  fireEvent.click(preview());
  fireEvent.click(
    controls().getByRole("button", { name: "إعادة ضبط المعاينة" }),
  );
  tick(5000);
  expect(preview()).toHaveAttribute("data-state", "idle");
});
it("cancels a loading action when navigating and unmounting", () => {
  vi.useFakeTimers();
  const view = render(<Workbench />);
  fireEvent.click(preview());
  const nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  fireEvent.click(nav.getByRole("button", { name: "التبويبات" }));
  tick(3000);
  fireEvent.click(nav.getByRole("button", { name: "الأزرار" }));
  expect(preview()).toHaveAttribute("data-state", "idle");
  fireEvent.click(preview());
  view.unmount();
  tick(5000);
  render(<Workbench />);
  expect(preview()).toHaveAttribute("data-state", "idle");
});

it("does not let an old feedback timer overwrite a repeated action", () => {
  vi.useFakeTimers();
  render(<Workbench />);
  fireEvent.click(preview());
  tick(1200);
  fireEvent.click(preview());
  tick(1000);
  expect(preview()).toHaveAttribute("data-state", "loading");
  tick(200);
  expect(preview()).toHaveAttribute("data-state", "success");
  tick(1000);
  expect(preview()).toHaveAttribute("data-state", "idle");
});
it("cancels simulation for icon-only edits and language transitions", () => {
  vi.useFakeTimers();
  render(<Workbench />);
  fireEvent.click(preview());
  fireEvent.click(controls().getByRole("switch", { name: "أيقونة فقط" }));
  tick(3000);
  expect(preview()).toHaveAttribute("data-state", "idle");
  fireEvent.click(preview());
  fireEvent.change(screen.getByLabelText("لغة التوثيق"), {
    target: { value: "en" },
  });
  tick(3000);
  expect(
    within(
      screen.getByRole("region", { name: "Interactive playground" }),
    ).getByRole("button"),
  ).toHaveAttribute("data-state", "idle");
});
