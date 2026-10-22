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
/** The settings panel, opened from «تخصيص» in the toolbar when it is closed. */
function controls() {
  if (!screen.queryByRole("complementary", { name: "تخصيص المعاينة" }))
    fireEvent.click(screen.getByRole("button", { name: "تخصيص" }));
  return within(screen.getByRole("complementary", { name: "تخصيص المعاينة" }));
}
/** Sets an inspector field through its control: a text field, a segmented
    control or a Select. */
function edit(field: string, value: string) {
  const control = controls().getByLabelText(field);
  if (control.tagName === "INPUT")
    fireEvent.change(control, { target: { value } });
  else if (control.getAttribute("role") === "group")
    fireEvent.click(within(control).getByRole("button", { name: value }));
  else {
    fireEvent.keyDown(control, { key: "Enter" });
    fireEvent.click(screen.getByRole("option", { name: value }));
  }
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
    expect(
      controls().getByRole("combobox", { name: "الحالة" }),
    ).toHaveTextContent("جاهز");
    // The Code view keeps the persisted state while the preview is busy.
    fireEvent.click(screen.getByRole("tab", { name: "الكود" }));
    expect(
      screen
        .getByRole("region", { name: "الكود: src/Example.tsx" })
        .querySelector("pre"),
    ).toHaveTextContent('ButtonState>("idle")');
    fireEvent.click(screen.getByRole("tab", { name: "معاينة" }));
    expect(preview()).toHaveAttribute("data-state", "loading");
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
      النوع: "خفيف",
      الحجم: "عادي · md",
      الأيقونة: "إضافة",
      الحالة: "خطأ",
    };
    edit(field, values[field]);
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
  edit("الحالة", "خطأ");
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
  fireEvent.click(controls().getByRole("radio", { name: "أزرق" }));
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
  fireEvent.click(nav.getByRole("button", { name: "التنقّل" }));
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
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  tick(3000);
  expect(
    within(
      screen.getByRole("region", { name: "Interactive playground" }),
    ).getByRole("button"),
  ).toHaveAttribute("data-state", "idle");
});
