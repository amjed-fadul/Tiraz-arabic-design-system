import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertExamples,
  SkeletonExamples,
} from "./ai/examples/FeedbackExamples";
import { expect, it, vi } from "vitest";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Progress,
  Skeleton,
  Spinner,
  SystemProvider,
  ToastProvider,
  defaultConfig,
  useToast,
} from "./index";

it.each(["warning", "ai"] as const)(
  "renders the %s tone on Badge and Alert",
  (tone) => {
    const { container } = render(
      <>
        <Badge tone={tone}>Label</Badge>
        <Alert title="Title" tone={tone} />
      </>,
    );
    expect(container.querySelector(".tz-badge")).toHaveAttribute(
      "data-tone",
      tone,
    );
    expect(container.querySelector(".tz-alert")).toHaveAttribute(
      "data-tone",
      tone,
    );
  },
);
it("renders a warning Toast", async () => {
  function Demo() {
    const { toast } = useToast();
    return (
      <Button onClick={() => toast({ title: "Check", tone: "warning" })}>
        Notify
      </Button>
    );
  }
  render(
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      <ToastProvider closeLabel="Close" label="Notifications">
        <Demo />
      </ToastProvider>
    </SystemProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Notify" }));
  expect(screen.getByText("Check").closest(".tz-toast")).toHaveAttribute(
    "data-tone",
    "warning",
  );
});
it("keeps static Alert feedback nonurgent regardless of semantic tone", () => {
  render(
    <Alert
      title="Check the form"
      description="A field needs attention."
      tone="error"
    />,
  );
  expect(screen.getByText("Check the form")).toBeInTheDocument();
  expect(screen.getByText("A field needs attention.")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
});
it.each([
  ["polite", "status"],
  ["assertive", "alert"],
] as const)("uses explicit %s Alert announcement", (announcement, role) => {
  render(
    <Alert
      title="Result"
      description="Persistent feedback"
      announcement={announcement}
    />,
  );
  const alert = screen.getByRole(role);
  expect(alert).toHaveTextContent("Result");
  expect(alert).toHaveTextContent("Persistent feedback");
  expect(alert).toHaveAttribute("aria-atomic", "true");
});
it("renders an application action without manufacturing dismissal state", () => {
  let result = "";
  render(
    <Alert
      title="Information"
      action={
        <Button
          onClick={() => {
            result = "details";
          }}
        >
          Show details
        </Button>
      }
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Show details" }));
  expect(result).toBe("details");
  expect(screen.getByText("Information")).toBeInTheDocument();
});
it.each(["text", "rectangle", "circle"] as const)(
  "keeps %s Skeleton decorative and accepts native sizing style",
  (shape) => {
    const { container } = render(
      <div aria-busy="true">
        <Skeleton
          shape={shape}
          style={{ inlineSize: "50%", blockSize: 48 }}
          className="sample"
        />
      </div>,
    );
    const skeleton = container.querySelector(".tz-skeleton")!;
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton).toHaveAttribute("data-shape", shape);
    expect(skeleton).toHaveClass("sample");
    expect(skeleton).toHaveStyle({ inlineSize: "50%", blockSize: "48px" });
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
  },
);
it.each([
  [0, 0, "0%"],
  [100, 100, "100%"],
  [-20, 0, "0%"],
  [120, 100, "100%"],
  [42.5, 42.5, "43%"],
])(
  "normalizes Progress value %s with correct semantics",
  (value, want, text) => {
    render(
      <Progress
        label="Preparing report"
        value={Number(value)}
        showValue
        locale="en"
      />,
    );
    const bar = screen.getByRole("progressbar", { name: "Preparing report" });
    expect(bar).toHaveAttribute("aria-valuenow", String(want));
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuetext", String(text));
    expect(screen.getByText(String(text))).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  },
);
it.each([undefined, null, NaN, Infinity, -Infinity])(
  "does not claim a numeric Progress value for %s",
  (value) => {
    render(<Progress label="Loading report" value={value} showValue />);
    const bar = screen.getByRole("progressbar", { name: "Loading report" });
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar).not.toHaveAttribute("aria-valuetext");
    expect(bar).toHaveAttribute("data-indeterminate", "true");
    expect(screen.queryByText(/NaN|Infinity|%|٪/)).toBeNull();
  },
);
it("formats Progress for Arabic and can explicitly use English in RTL", () => {
  const { rerender } = render(
    <SystemProvider>
      <Progress label="تجهيز التقرير" value={64} showValue />
    </SystemProvider>,
  );
  expect(screen.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "٦٤٪؜",
  );
  expect(screen.getByText("٦٤٪؜")).toBeInTheDocument();
  rerender(
    <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
      <Progress label="تجهيز التقرير" value={64} locale="en" showValue />
    </SystemProvider>,
  );
  expect(screen.getByRole("progressbar")).toHaveAttribute(
    "aria-valuetext",
    "64%",
  );
});
it("names Spinner and supports decorative composition without an extra announcement", () => {
  const { rerender, container } = render(<Spinner label="Loading report" />);
  expect(
    screen.getByRole("status", { name: "Loading report" }),
  ).toBeInTheDocument();
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  rerender(
    <p role="status">
      <Spinner decorative />
      Loading report
    </p>,
  );
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(container.querySelector(".tz-loading-spinner")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(screen.getByRole("status")).toHaveTextContent("Loading report");
});
it("preserves Avatar fallback/name during loading, failure, replacement and removal", () => {
  const { container, rerender } = render(
    <Avatar name="سارة علي" fallback="س ع" src="/sample-sara.png" />,
  );
  const avatar = screen.getByRole("img", { name: "سارة علي" });
  expect(avatar).toHaveTextContent("س ع");
  expect(container.querySelector("img")).toHaveAttribute("alt", "");
  fireEvent.load(container.querySelector("img")!);
  expect(avatar).not.toHaveTextContent("س ع");
  rerender(<Avatar name="سارة علي" fallback="س ع" src="/sample-omar.png" />);
  expect(avatar).toHaveTextContent("س ع");
  fireEvent.error(container.querySelector("img")!);
  expect(avatar).toHaveTextContent("س ع");
  expect(container.querySelector("img")).toBeNull();
  rerender(<Avatar name="سارة علي" fallback="س ع" src="/sample-sara.png" />);
  fireEvent.load(container.querySelector("img")!);
  expect(avatar).not.toHaveTextContent("س ع");
  rerender(<Avatar name="سارة علي" fallback="س ع" />);
  expect(avatar).toHaveTextContent("س ع");
  expect(screen.getAllByRole("img")).toHaveLength(1);
});

it("lets the Alert example action update its own polite alert in place", async () => {
  render(<AlertExamples language="en" />);
  const action = screen.getByRole("button", { name: "Send reminder" });
  const reminder = screen.getByRole("status");
  expect(reminder).toHaveTextContent("Invoice INV-2048 is due tomorrow");
  await userEvent.click(action);
  expect(action).toHaveAccessibleName("Reminder sent");
  expect(action).toHaveAttribute("data-state", "success");
  expect(action).toHaveFocus();
  expect(reminder).toHaveTextContent("We sent a reminder to hello@madar.sa.");
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.queryByRole("alert")).toBeNull();
});
it("plays the Skeleton loading state once, then reveals content with one host announcement", () => {
  vi.useFakeTimers();
  try {
    render(<SkeletonExamples language="en" />).unmount();
    expect(vi.getTimerCount()).toBe(0);
    const { container } = render(<SkeletonExamples language="en" />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll(".tz-skeleton")).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("Loading profile");
    act(() => vi.advanceTimersByTime(2400));
    expect(container.querySelector('[aria-busy="false"]')).not.toBeNull();
    expect(container.querySelectorAll(".tz-skeleton")).toHaveLength(0);
    expect(screen.getByText("sara@madar.sa")).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Profile loaded");
  } finally {
    vi.useRealTimers();
  }
});
it("holds a still Skeleton example with reduced motion instead of advancing", () => {
  vi.useFakeTimers();
  try {
    const { container } = render(
      <SystemProvider config={{ ...defaultConfig, reducedMotion: true }}>
        <SkeletonExamples language="en" />
      </SystemProvider>,
    );
    act(() => vi.advanceTimersByTime(5000));
    expect(container.querySelectorAll(".tz-skeleton").length).toBeGreaterThan(
      0,
    );
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  } finally {
    vi.useRealTimers();
  }
});
