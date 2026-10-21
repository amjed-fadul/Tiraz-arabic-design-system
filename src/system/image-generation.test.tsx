import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  ImageGeneration,
  SystemProvider,
  WeaveCanvas,
  defaultConfig,
} from "./index";
import type { ImageGenerationProps, SystemConfig } from "./index";
import { ImageGenerationExample } from "./ai/examples/ImageGenerationExamples";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const wrap = (children: ReactNode, config: Partial<SystemConfig> = {}) => (
  <SystemProvider config={{ ...defaultConfig, ...config }}>
    {children}
  </SystemProvider>
);

const prompt =
  "غلاف لحملة رمضان لمتجر تمور: كثبان عند الغروب، هلال ونخيل، بألوان دافئة";
const picture = (fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="${fill}"/></svg>`,
  )}`;
const alts = [
  "كثبان عند الغروب وهلال ونخيل",
  "هلال فوق واحة نخيل",
  "كثبان ذهبية تحت قمر",
  "غروب دافئ فوق الكثبان",
];
const images: ImageGenerationProps["images"] = [
  "#b8651b",
  "#d98f3e",
  "#8a4b2a",
  "#c4733f",
].map((fill, index) => ({
  id: `v${index + 1}`,
  src: picture(fill),
  alt: alts[index],
  width: 1536,
  height: 1024,
}));

function generation(
  status: ImageGenerationProps["status"],
  extra: Partial<ImageGenerationProps> = {},
  config: Partial<SystemConfig> = {},
) {
  return wrap(
    <ImageGeneration
      prompt={prompt}
      status={status}
      images={images}
      agent="مصمّم الحملات"
      {...extra}
    />,
    config,
  );
}
const section = () => screen.getByRole("region", { name: "توليد صورة" });
const live = () =>
  document.querySelector(".tz-image-generation > [role='status']");

it("keeps an unknown preview soft until the host completes it", () => {
  vi.useFakeTimers();
  const canvas = (status: "weaving" | "completed") =>
    wrap(<WeaveCanvas status={status} src={images[0].src} alt={alts[0]} />);
  const view = render(canvas("weaving"));
  const preview = screen.getByRole("img", { name: alts[0] });
  const focus = () => Number(preview.style.getPropertyValue("--weave-focus"));
  const waiting = focus();
  expect(waiting).toBeGreaterThan(0);
  expect(waiting).toBeLessThan(1);
  act(() => vi.advanceTimersByTime(10_000));
  expect(focus()).toBe(waiting);
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(
    view.container.querySelector("[aria-live], [role='status']"),
  ).toBeNull();

  view.rerender(canvas("completed"));
  act(() => vi.advanceTimersByTime(1_200));
  expect(focus()).toBe(1);
  vi.useRealTimers();
});

it("holds the current preview when the host stops generation", () => {
  vi.useFakeTimers();
  const canvas = (status: "queued" | "weaving" | "failed", progress: number) =>
    wrap(
      <WeaveCanvas
        status={status}
        progress={progress}
        src={images[0].src}
        alt={alts[0]}
      />,
    );
  const view = render(canvas("weaving", 20));
  const preview = screen.getByRole("img", { name: alts[0] });
  const focus = () => Number(preview.style.getPropertyValue("--weave-focus"));
  expect(focus()).toBe(0.2);
  view.rerender(canvas("weaving", 80));
  act(() => vi.advanceTimersByTime(100));
  const interrupted = focus();
  expect(interrupted).toBeGreaterThan(0.2);
  expect(interrupted).toBeLessThan(0.8);
  view.rerender(canvas("failed", 0));
  act(() => vi.advanceTimersByTime(1_200));
  expect(focus()).toBe(interrupted);
  expect(preview).toHaveAttribute("data-status", "failed");

  view.rerender(canvas("queued", 0));
  expect(focus()).toBe(0);
  vi.useRealTimers();
});

it("names the weave as one image and follows progress", () => {
  const view = render(generation("weaving", { progress: 42 }));
  // One image, named by the selected picture's description; the preview and
  // atmospheric light are decoration.
  const weave = screen.getByRole("img", { name: alts[0] });
  expect(weave).toHaveClass("tz-weave");
  expect(screen.getAllByRole("img")).toHaveLength(1);
  for (const part of weave.querySelectorAll(
    ".tz-weave-image, .tz-weave-atmosphere, .tz-weave-sheen",
  ))
    expect(part).toHaveAttribute("aria-hidden", "true");

  const bar = screen.getByRole("progressbar");
  expect(bar).toHaveAttribute("aria-valuenow", "42");
  expect(bar).toHaveTextContent("يُنسج · ٤٢٪");

  // An unknown wait has no value to report, and no number to show.
  view.rerender(generation("weaving", { progress: null }));
  const waiting = screen.getByRole("progressbar");
  expect(waiting).not.toHaveAttribute("aria-valuenow");
  expect(waiting).toHaveTextContent("يُنسج");
  expect(waiting).not.toHaveTextContent("٪");
});

it("crossfades under reduced motion", () => {
  const alt = "غروب فوق الكثبان";
  const frame = vi.spyOn(window, "requestAnimationFrame");
  const still = (src?: string) =>
    wrap(<WeaveCanvas status="weaving" progress={null} src={src} alt={alt} />, {
      reducedMotion: true,
    });
  const view = render(still());
  expect(frame).not.toHaveBeenCalled();
  // No picture yet; a still thread indicates that the job is active.
  expect(view.container.querySelector("img")).toBeNull();
  expect(view.container.querySelector(".tz-weave-still")).not.toBeNull();

  view.rerender(still(images[0].src));
  const image = view.container.querySelector("img")!;
  expect(image).toHaveAttribute("src", images[0].src);
  expect(image).toBeVisible();
  // The picture is whole and fades in; nothing clips it, and nothing loops.
  expect(image.style.clipPath).toBe("");
  expect(screen.getByRole("img", { name: alt })).toHaveAttribute(
    "data-reduced",
  );
  expect(frame).not.toHaveBeenCalled();
});

it("keeps variants inert until done, then chooses from a named radio group", async () => {
  const user = userEvent.setup(),
    choose = vi.fn(),
    use = vi.fn();
  const view = render(
    generation("weaving", {
      progress: 30,
      onSelectedChange: choose,
      onUse: use,
    }),
  );
  const group = screen.getByRole("radiogroup", { name: "اختر نسخة" });
  const radios = within(group).getAllByRole("radio");
  expect(radios).toHaveLength(4);
  ["١", "٢", "٣", "٤"].forEach((digit, index) => {
    expect(radios[index]).toHaveAccessibleName(`النسخة ${digit}`);
    expect(radios[index]).toBeDisabled();
  });
  expect(screen.getByRole("button", { name: "استخدم الصورة" })).toBeDisabled();

  view.rerender(
    generation("completed", {
      duration: 12,
      onSelectedChange: choose,
      onUse: use,
    }),
  );
  for (const radio of screen.getAllByRole("radio")) expect(radio).toBeEnabled();
  expect(screen.getByRole("radio", { name: "النسخة ١" })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: "النسخة ٢" }));
  expect(choose).toHaveBeenCalledOnce();
  expect(choose).toHaveBeenCalledWith("v2");
  expect(screen.getByRole("radio", { name: "النسخة ٢" })).toBeChecked();
  await user.click(screen.getByRole("button", { name: "استخدم الصورة" }));
  expect(use).toHaveBeenCalledOnce();
  expect(use).toHaveBeenCalledWith("v2");
  // The footer: the agent, the images and the time it took.
  expect(section()).toHaveTextContent("مصمّم الحملات · ٤ صور · ١٢ث");
});

it("retries a failure with focus on the figure and shows the alt text", async () => {
  const user = userEvent.setup(),
    retry = vi.fn();
  const view = render(generation("failed", { onRetry: retry }));
  const figure = screen.getByRole("figure");
  // The failure is text, and it names the picture that did not arrive.
  expect(within(figure).getByText("تعذّر توليد الصورة")).toBeVisible();
  expect(within(figure).getByText(alts[0])).toBeVisible();
  await user.click(
    within(figure).getByRole("button", { name: "أعد المحاولة" }),
  );
  expect(retry).toHaveBeenCalledOnce();
  expect(figure).toHaveFocus();

  // When the host queues the retry the figure goes; focus stays in the
  // pattern instead of falling to the page.
  view.rerender(generation("queued", { onRetry: retry }));
  expect(screen.queryByRole("figure")).toBeNull();
  expect(section()).toHaveFocus();
});

it("explains a blocked request and offers to edit the description", async () => {
  const user = userEvent.setup(),
    edit = vi.fn();
  const reason = "يتضمن الوصف اسم علامة تجارية محمية.";
  const blocked = () =>
    generation("blocked", { blockedReason: reason, onEditPrompt: edit });
  const view = render(generation("weaving", { progress: 40 }));
  // The status the pattern mounts in is not news.
  expect(live()).toBeEmptyDOMElement();

  view.rerender(blocked());
  const panel = view.container.querySelector(".tz-image-generation-blocked");
  expect(panel).toHaveTextContent("لا يمكن توليد هذه الصورة");
  expect(panel).toHaveTextContent(reason);
  expect(section()).toHaveTextContent("بانتظارك");
  expect(screen.queryByRole("progressbar")).toBeNull();
  // Said once, with the reason.
  expect(live()).toHaveTextContent(`لا يمكن توليد هذه الصورة: ${reason}`);

  // One way to edit, beside the reason.
  const buttons = screen.getAllByRole("button", { name: "تعديل بالوصف" });
  expect(buttons).toHaveLength(1);
  await user.click(buttons[0]);
  expect(edit).toHaveBeenCalledOnce();

  // Mounted blocked, it says nothing until something changes.
  view.unmount();
  render(blocked());
  expect(live()).toBeEmptyDOMElement();
});

it("never loads a remote image in the demo", () => {
  for (const [phase, expected] of [
    ["weaving", 1],
    ["completed", 6],
  ] as const) {
    const { container, unmount } = render(
      wrap(<ImageGenerationExample language="ar" phase={phase} />),
    );
    const sources = Array.from(container.querySelectorAll("img"), (image) =>
      image.getAttribute("src"),
    );
    // Weaving draws the one picture. Done draws it in the result and under it,
    // where the weave stays, and adds four thumbnails.
    expect(sources).toHaveLength(expected);
    for (const src of sources)
      expect(src?.startsWith("data:image/svg+xml")).toBe(true);
    unmount();
  }
});
