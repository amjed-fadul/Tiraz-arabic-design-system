import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";
import { persist, storageKeys } from "./storage";
import { SkeletonExample } from "../system/ai/examples/SkeletonExample";
import { SystemProvider, defaultConfig } from "../system";
afterEach(() => vi.useRealTimers());
it("documents four feedback pages with complete copied code and prompts", async () => {
  render(<Workbench />);
  const user = userEvent.setup(),
    write = vi.spyOn(navigator.clipboard, "writeText"),
    nav = within(screen.getByRole("navigation", { name: "المكوّنات" }));
  for (const name of [
    "الرسالة الدلالية",
    "هيكل التحميل",
    "التقدم",
    "مؤشر التحميل",
  ]) {
    await user.click(nav.getByRole("button", { name }));
    expect(
      screen.getByRole("region", { name: "المعاينة التفاعلية" }),
    ).not.toBeEmptyDOMElement();
    expect(screen.queryByRole("status", { name: "آخر حدث" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "نسخ الكود" }));
    const code = write.mock.calls.at(-1)![0];
    await user.click(screen.getByRole("button", { name: "نسخ الطلب" }));
    expect(write.mock.calls.at(-1)![0]).toContain(code);
    expect(code).toContain("SystemProvider");
    if (name === "هيكل التحميل") {
      // The skeleton stage is a loading profile, so its code carries the timer.
      expect(code).toContain("export function SkeletonExample");
      expect(code).toContain(
        '<SkeletonExample language="ar" shape="circle" />',
      );
      expect(code).toContain("Avatar, Skeleton, useSystem");
    } else expect(code).not.toContain("setTimeout");
    if (name === "الرسالة الدلالية") {
      expect(code).toContain("Alert, Button");
      expect(code).toContain(
        'action={<Button variant="secondary" onClick={() => {}}>{"عرض الخطة"}</Button>}',
      );
    }
  }
});
it("records the Alert playground action and drops it when its label is cleared", async () => {
  render(<Workbench />);
  const user = userEvent.setup(),
    write = vi.spyOn(navigator.clipboard, "writeText");
  await user.click(
    within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
      "button",
      { name: "الرسالة الدلالية" },
    ),
  );
  const stage = within(
    screen.getByRole("region", { name: "المعاينة التفاعلية" }),
  );
  await user.click(stage.getByRole("button", { name: "عرض الخطة" }));
  expect(screen.getByRole("status", { name: "آخر حدث" })).toHaveTextContent(
    "onClick",
  );
  await user.clear(
    within(screen.getByRole("complementary", { name: "التخصيص" })).getByRole(
      "textbox",
      { name: "زر الإجراء" },
    ),
  );
  expect(stage.queryByRole("button")).toBeNull();
  await user.click(screen.getByRole("button", { name: "نسخ الكود" }));
  const code = String(write.mock.calls.at(-1)![0]);
  expect(code).not.toContain("action=");
  expect(code).not.toContain("Alert, Button");
});
it("opens the skeleton playground loaded and replays the load", async () => {
  vi.useFakeTimers();
  render(<Workbench />);
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "المكوّنات" })).getByRole(
      "button",
      { name: "هيكل التحميل" },
    ),
  );
  const canvas = () =>
    screen.getByRole("region", { name: "المعاينة التفاعلية" });
  const profile = () => canvas().querySelector("[aria-busy]")!;
  // Nothing autoplays: the page is complete at rest, and stays so.
  expect(profile()).toHaveAttribute("aria-busy", "false");
  expect(profile().querySelector(".tz-skeleton")).toBeNull();
  expect(within(canvas()).getByText("سارة علي")).toBeVisible();
  expect(within(canvas()).getByText("sara@madar.sa")).toBeVisible();
  expect(
    within(canvas()).getByText("تم تحميل الملف الشخصي"),
  ).toBeInTheDocument();
  await act(async () => vi.advanceTimersByTime(5000));
  expect(profile()).toHaveAttribute("aria-busy", "false");
  // Replay shows the placeholders, then the profile takes their place.
  fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
  expect(profile()).toHaveAttribute("aria-busy", "true");
  // The default shape holds a photo slot beside the text lines.
  expect(
    profile().querySelector('.tz-skeleton[data-shape="circle"]'),
  ).not.toBeNull();
  expect(
    within(canvas()).getByText("جارٍ تحميل الملف الشخصي…"),
  ).toBeInTheDocument();
  expect(within(canvas()).queryByText("سارة علي")).toBeNull();
  await act(async () => vi.advanceTimersByTime(1800));
  expect(profile()).toHaveAttribute("aria-busy", "false");
  expect(within(canvas()).getByText("سارة علي")).toBeVisible();
});
it("replays the skeleton load under reduced motion, since the states are content", async () => {
  vi.useFakeTimers();
  persist(storageKeys.system, { reducedMotion: true });
  persist(storageKeys.documentation, { language: "ar", active: "skeleton" });
  render(<Workbench />);
  const profile = () =>
    screen
      .getByRole("region", { name: "المعاينة التفاعلية" })
      .querySelector("[aria-busy]")!;
  expect(profile()).toHaveAttribute("aria-busy", "false");
  fireEvent.click(screen.getByRole("button", { name: "إعادة تشغيل المثال" }));
  expect(profile()).toHaveAttribute("aria-busy", "true");
  await act(async () => vi.advanceTimersByTime(1800));
  expect(profile()).toHaveAttribute("aria-busy", "false");
});
it("loads the skeleton profile on its own when it has no phase", () => {
  vi.useFakeTimers();
  const view = render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <SkeletonExample language="en" />
    </SystemProvider>,
  );
  const profile = () => view.container.querySelector("[aria-busy]")!;
  expect(profile()).toHaveAttribute("aria-busy", "true");
  act(() => vi.advanceTimersByTime(2399));
  expect(profile()).toHaveAttribute("aria-busy", "true");
  act(() => vi.advanceTimersByTime(1));
  expect(profile()).toHaveAttribute("aria-busy", "false");
  expect(screen.getByText("Sara Ali")).toBeVisible();
});
it("holds the skeleton placeholders under reduced motion", () => {
  vi.useFakeTimers();
  const view = render(
    <SystemProvider
      config={{ ...defaultConfig, direction: "ltr", reducedMotion: true }}
    >
      <SkeletonExample language="en" shape="rectangle" />
    </SystemProvider>,
  );
  expect(vi.getTimerCount()).toBe(0);
  act(() => vi.advanceTimersByTime(5000));
  expect(view.container.querySelector("[aria-busy]")).toHaveAttribute(
    "aria-busy",
    "true",
  );
  expect(
    view.container.querySelector('.tz-skeleton[data-shape="rectangle"]'),
  ).not.toBeNull();
  expect(screen.queryByText("Sara Ali")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent("Loading profile…");
});
it("exposes existing src with a minimal photo choice and accurate imports", async () => {
  localStorage.setItem(
    "tiraz.documentation.v2",
    JSON.stringify({
      language: "en",
      active: "avatar",
      systemPanelOpen: true,
      inspectorOpen: true,
    }),
  );
  render(<Workbench />);
  const user = userEvent.setup(),
    write = vi.spyOn(navigator.clipboard, "writeText"),
    preview = within(
      screen.getByRole("region", { name: "Interactive playground" }),
    );
  // The page opens on Photo, so the photo and its URL field are already there.
  expect(
    preview.getByRole("img", { name: "Sara Ali" }).querySelector("img"),
  ).not.toBeNull();
  await user.click(screen.getByRole("button", { name: "Copy code" }));
  expect(write.mock.calls.at(-1)![0]).toContain("./system/ai/assets/sara.jpg");
  await user.type(
    screen.getByLabelText("Image URL · optional"),
    "/personal.jpg",
  );
  await user.click(screen.getByRole("button", { name: "Copy code" }));
  expect(write.mock.calls.at(-1)![0]).toContain('src={"/personal.jpg"}');
  await user.selectOptions(screen.getByLabelText("Appearance"), "initials");
  expect(
    preview.getByRole("img", { name: "Sara Ali" }).querySelector("img"),
  ).toBeNull();
  // The URL field belongs to the photo choice only.
  expect(screen.queryByLabelText("Image URL · optional")).toBeNull();
});
