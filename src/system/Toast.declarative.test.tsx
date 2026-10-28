import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

type User = ReturnType<typeof userEvent.setup>;
const directions = ["rtl", "ltr"] as const;
type Direction = (typeof directions)[number];
const provider = (direction: Direction, children: ReactNode) => (
  <Tiraz.SystemProvider config={{ ...Tiraz.defaultConfig, direction }}>
    <Tiraz.ToastProvider label="Notifications" closeLabel="Dismiss">
      {children}
    </Tiraz.ToastProvider>
  </Tiraz.SystemProvider>
);

// DOM of the imperative toast before the declarative part existed. React ids
// and toast ids are renumbered by first appearance.
const before: Record<string, string> = JSON.parse(
  readFileSync(resolve("src/tests/toast-convenience-dom.json"), "utf8"),
);
function markup() {
  for (const child of [...document.body.children])
    if (child.localName === "div" && !child.childNodes.length) child.remove();
  const seen = new Map<string, string>();
  return document.body.innerHTML
    .replace(/_r_[0-9a-z]+_/g, (id) => {
      if (!seen.has(id)) seen.set(id, `r${seen.size + 1}`);
      return seen.get(id)!;
    })
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
      (id) => {
        if (!seen.has(id)) seen.set(id, `toast${seen.size + 1}`);
        return seen.get(id)!;
      },
    );
}
const announcement = () =>
  document.body.querySelector<HTMLElement>('[role="status"][aria-live]');
const announced = () =>
  waitFor(() => expect(announcement()?.textContent).toMatch(/^Notifications /));
const toasts = () => document.querySelectorAll(".tz-toast");

function Notifier({ messages }: { messages: Tiraz.ToastMessage[] }) {
  const { toast } = Tiraz.useToast();
  return (
    <button
      type="button"
      onClick={() => messages.forEach((message) => toast(message))}
    >
      Notify
    </button>
  );
}
// The same messages as declarative parts; the owner accepts every request.
function Declared({ messages }: { messages: Tiraz.ToastMessage[] }) {
  const [open, setOpen] = useState(messages.map(() => true));
  return (
    <>
      <button type="button">Notify</button>
      {messages.map((message, index) => (
        <Tiraz.Toast
          key={index}
          {...message}
          open={open[index]}
          onOpenChange={(next) =>
            setOpen((list) => list.map((v, i) => (i === index ? next : v)))
          }
        />
      ))}
    </>
  );
}

interface Case {
  key: string;
  messages: Tiraz.ToastMessage[];
  clicks: boolean;
  dismiss?: boolean;
}
function cases(direction: Direction): Case[] {
  return [
    { key: `toast-${direction}-empty`, messages: [], clicks: false },
    {
      key: `toast-${direction}-one`,
      messages: [{ title: "Saved" }],
      clicks: true,
    },
    {
      key: `toast-${direction}-tones`,
      messages: [
        {
          title: "Payment failed",
          description: "Try another card",
          tone: "error",
          duration: 60000,
        },
      ],
      clicks: true,
    },
    {
      key: `toast-${direction}-stack`,
      messages: [
        { title: "First", tone: "success" },
        { title: "Second", description: "More detail", tone: "warning" },
      ],
      clicks: true,
    },
    {
      key: `toast-${direction}-dismissed`,
      messages: [{ title: "Saved", tone: "success" }],
      clicks: true,
      dismiss: true,
    },
  ];
}
async function drive(entry: Case, user: User, imperative: boolean) {
  if (!entry.messages.length) return;
  if (imperative)
    await user.click(screen.getByRole("button", { name: "Notify" }));
  await announced();
  if (entry.dismiss)
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
}

afterEach(() => vi.restoreAllMocks());

it("exports Toast as a function", () => {
  expect(Tiraz.Toast).toBeTypeOf("function");
});

describe.each(directions)("imperative and declarative markup in %s", (d) => {
  const entries = cases(d).map((entry) => [entry.key, entry] as const);
  it.each(entries)("%s: imperative DOM is unchanged", async (key, entry) => {
    const user = userEvent.setup();
    render(provider(d, <Notifier messages={entry.messages} />));
    await drive(entry, user, true);
    expect(markup()).toBe(before[key]);
  });
  it.each(entries)(
    "%s: declarative DOM equals the imperative DOM",
    async (key, entry) => {
      const user = userEvent.setup();
      render(provider(d, <Declared messages={entry.messages} />));
      await drive(entry, user, false);
      expect(markup()).toBe(before[key]);
    },
  );
});

it("captures exactly the cases compared", () => {
  const keys = directions.flatMap((d) => cases(d).map((entry) => entry.key));
  expect(Object.keys(before).sort()).toEqual(keys.sort());
});

describe("declarative Toast", () => {
  function Controlled({
    onOpenChange,
    start = true,
    ...message
  }: {
    onOpenChange?: (open: boolean) => void;
    start?: boolean;
  } & Partial<Tiraz.ToastProps>) {
    const [open, setOpen] = useState(start);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        <Tiraz.Toast
          title="Saved"
          {...message}
          open={open}
          onOpenChange={(next) => {
            onOpenChange?.(next);
            setOpen(next);
          }}
        />
      </>
    );
  }

  it("shows while open and leaves when closed", () => {
    const { rerender } = render(
      provider(
        "ltr",
        <Tiraz.Toast open={false} title="Saved" description="All good" />,
      ),
    );
    expect(toasts()).toHaveLength(0);
    rerender(
      provider(
        "ltr",
        <Tiraz.Toast open title="Saved" description="All good" />,
      ),
    );
    expect(toasts()).toHaveLength(1);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(toasts()[0]).toHaveAttribute("data-tone", "info");
    rerender(
      provider(
        "ltr",
        <Tiraz.Toast open={false} title="Saved" description="All good" />,
      ),
    );
    expect(toasts()).toHaveLength(0);
  });

  it("announces its label, title and description like toast()", async () => {
    render(
      provider(
        "ltr",
        <Tiraz.Toast
          open
          title="Saved"
          description="All good"
          tone="success"
        />,
      ),
    );
    await announced();
    expect(announcement()).toHaveAttribute("aria-live", "assertive");
    expect(announcement()).toHaveTextContent("Notifications SavedAll good");
  });

  it("shows each tone's icon and a custom duration", async () => {
    const onOpenChange = vi.fn();
    render(
      provider(
        "ltr",
        <Tiraz.Toast
          open
          title="Failed"
          tone="error"
          duration={120}
          onOpenChange={onOpenChange}
        />,
      ),
    );
    expect(toasts()[0]).toHaveAttribute("data-tone", "error");
    expect(toasts()[0].querySelector(".lucide-circle-alert")).not.toBeNull();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledTimes(1), {
      timeout: 1500,
    });
  });

  it("requests close exactly once when it times out", async () => {
    const onOpenChange = vi.fn();
    render(
      provider(
        "ltr",
        <Controlled duration={120} onOpenChange={onOpenChange} />,
      ),
    );
    await waitFor(() => expect(toasts()).toHaveLength(0), { timeout: 1500 });
    await new Promise((done) => setTimeout(done, 300));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("requests close exactly once when dismissed with the pointer", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(provider("ltr", <Controlled onOpenChange={onOpenChange} />));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toasts()).toHaveLength(0);
  });

  it("requests close exactly once from the keyboard, with Enter and with Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(provider("ltr", <Controlled onOpenChange={onOpenChange} />));
    screen.getByRole("button", { name: "Dismiss" }).focus();
    await user.keyboard("{Enter}");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(toasts()).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(toasts()).toHaveLength(1);
    screen.getByRole("button", { name: "Dismiss" }).focus();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(toasts()).toHaveLength(0);
  });

  it("restores the caller's focus when dismissed, as toast() does", async () => {
    const user = userEvent.setup();
    render(provider("ltr", <Controlled start={false} />));
    const opener = screen.getByRole("button", { name: "Open" });
    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("stays shown while its owner has not accepted the request", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      provider(
        "ltr",
        <Tiraz.Toast open title="Saved" onOpenChange={onOpenChange} />,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toasts()).toHaveLength(1);
  });

  it("shows a fresh toast with a fresh timer each time it reopens", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      provider(
        "ltr",
        <Controlled duration={120} onOpenChange={onOpenChange} />,
      ),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledTimes(1), {
      timeout: 1500,
    });
    await waitFor(() => expect(toasts()).toHaveLength(0));
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(toasts()).toHaveLength(1);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledTimes(2), {
      timeout: 1500,
    });
    expect(toasts()).toHaveLength(0);
  });

  it("follows the title, description and tone while open", () => {
    const { rerender } = render(
      provider("ltr", <Tiraz.Toast open title="Saving" />),
    );
    rerender(
      provider(
        "ltr",
        <Tiraz.Toast
          open
          title="Saved"
          description="All good"
          tone="success"
        />,
      ),
    );
    expect(toasts()).toHaveLength(1);
    expect(screen.queryByText("Saving")).toBeNull();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(toasts()[0]).toHaveAttribute("data-tone", "success");
  });

  it("removes its toast on unmount without requesting anything", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      provider(
        "ltr",
        <Tiraz.Toast open title="Saved" onOpenChange={onOpenChange} />,
      ),
    );
    expect(toasts()).toHaveLength(1);
    rerender(provider("ltr", <div />));
    expect(toasts()).toHaveLength(0);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("keeps several declarative toasts independent", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    render(
      provider(
        "ltr",
        <>
          <Controlled title="First" onOpenChange={first} />
          <Controlled title="Second" onOpenChange={second} />
        </>,
      ),
    );
    expect(toasts()).toHaveLength(2);
    const dismiss = screen.getAllByRole("button", { name: "Dismiss" });
    await user.click(dismiss[0]);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(toasts()).toHaveLength(1);
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("stacks with imperative toasts and leaves them unchanged", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      provider(
        "ltr",
        <>
          <Notifier messages={[{ title: "Imperative", tone: "warning" }]} />
          <Tiraz.Toast open title="Declared" onOpenChange={onOpenChange} />
        </>,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Notify" }));
    const list = [...toasts()];
    expect(list.map((node) => node.getAttribute("data-depth"))).toEqual([
      "1",
      "0",
    ]);
    expect(list[0]).toHaveTextContent("Declared");
    expect(list[1]).toHaveTextContent("Imperative");
    await user.click(screen.getAllByRole("button", { name: "Dismiss" })[1]);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByText("Imperative")).toBeNull();
    expect(screen.getByText("Declared")).toBeInTheDocument();
  });

  it("keeps an open declarative toast when toast() passes its cap of three", async () => {
    const user = userEvent.setup();
    render(
      provider(
        "ltr",
        <>
          <Notifier messages={[{ title: "Imperative" }]} />
          <Tiraz.Toast open title="Declared" />
        </>,
      ),
    );
    for (let i = 0; i < 4; i++)
      await user.click(screen.getByRole("button", { name: "Notify" }));
    expect(
      [...document.querySelectorAll(".tz-toast-title")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["Declared", "Imperative", "Imperative", "Imperative"]);
  });

  it("shows one toast and announces it once under StrictMode", async () => {
    render(
      <StrictMode>
        {provider("ltr", <Tiraz.Toast open title="Saved" />)}
      </StrictMode>,
    );
    expect(toasts()).toHaveLength(1);
    await announced();
    expect(
      document.body.querySelectorAll('[role="status"][aria-live]'),
    ).toHaveLength(1);
  });

  it("does not request anything when the owner closes it", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      provider(
        "ltr",
        <Tiraz.Toast open title="Saved" onOpenChange={onOpenChange} />,
      ),
    );
    act(() => {
      rerender(
        provider(
          "ltr",
          <Tiraz.Toast
            open={false}
            title="Saved"
            onOpenChange={onOpenChange}
          />,
        ),
      );
    });
    expect(toasts()).toHaveLength(0);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("requires ToastProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <Tiraz.SystemProvider>
          <Tiraz.Toast open title="Saved" />
        </Tiraz.SystemProvider>,
      ),
    ).toThrow("Toast requires ToastProvider.");
  });
});

describe("ToastProvider", () => {
  it("keeps its label and closeLabel for declarative toasts", () => {
    render(
      <Tiraz.SystemProvider>
        <Tiraz.ToastProvider label="التنبيهات" closeLabel="إغلاق التنبيه">
          <Tiraz.Toast open title="تم الحفظ" />
        </Tiraz.ToastProvider>
      </Tiraz.SystemProvider>,
    );
    expect(
      screen.getByRole("region", { name: "التنبيهات" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "إغلاق التنبيه" }),
    ).toBeInTheDocument();
  });
});
