import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRef, useState } from "react";
import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Tiraz from "./index";

type User = ReturnType<typeof userEvent.setup>;
const directions = ["rtl", "ltr"] as const;
type Direction = (typeof directions)[number];
const provider = (direction: Direction, children: ReactNode) => (
  <Tiraz.SystemProvider config={{ ...Tiraz.defaultConfig, direction }}>
    {children}
  </Tiraz.SystemProvider>
);

// DOM of the convenience ChatThread and ChatThreadMessage before the compound
// parts existed. React ids are renumbered by first appearance.
const before: Record<string, string> = JSON.parse(
  readFileSync(resolve("src/tests/chat-thread-convenience-dom.json"), "utf8"),
);
function markup() {
  for (const child of [...document.body.children])
    if (child.localName === "div" && !child.childNodes.length) child.remove();
  const seen = new Map<string, string>();
  return document.body.innerHTML.replace(/_r_[0-9a-z]+_/g, (id) => {
    if (!seen.has(id)) seen.set(id, `r${seen.size + 1}`);
    return seen.get(id)!;
  });
}

// jsdom has no AnimationEvent, so React listens for the prefixed name.
const endEntrance = (node: Element) =>
  fireEvent(node, new Event("webkitAnimationEnd", { bubbles: true }));
const noop = () => {};
// Plain-value messages: what both forms can say.
const asked: Tiraz.ChatMessage = {
  id: "u1",
  role: "user",
  content: "Net cash flow?",
};
const completed: Tiraz.ChatMessage = {
  id: "a1",
  role: "assistant",
  identity: "Tiraz",
  content: "It fell by 12%.",
  status: "completed",
};
const streaming: Tiraz.ChatMessage = {
  id: "a2",
  role: "assistant",
  content: "Checking the ledger",
  status: "streaming",
};
const stopped: Tiraz.ChatMessage = {
  id: "a3",
  role: "assistant",
  content: "Partial answer",
  status: "stopped",
};
const failed: Tiraz.ChatMessage = {
  id: "a4",
  role: "assistant",
  identity: "Tiraz",
  content: "Net cash flow fell",
  status: "failed",
  error: "The ledger connection dropped.",
  onRetry: noop,
};
const failedBare: Tiraz.ChatMessage = {
  id: "a5",
  role: "assistant",
  content: "Net cash flow fell",
  status: "failed",
};

// A message record written as a part.
function asPart(message: Tiraz.ChatMessage, extra = {}) {
  const { content, identity, ...rest } = message;
  return (
    <Tiraz.ChatThreadMessage
      key={message.id}
      {...(rest as Omit<Tiraz.ChatThreadMessagePartProps, "children">)}
      identity={identity as string | undefined}
      {...extra}
    >
      {content}
    </Tiraz.ChatThreadMessage>
  );
}
// The convenience props written as parts.
function CompoundThread({
  messages = [],
  ...props
}: Tiraz.ChatThreadProps): ReturnType<typeof Tiraz.ChatThread> {
  return (
    <Tiraz.ChatThread {...props}>
      {messages.map((message) => asPart(message))}
    </Tiraz.ChatThread>
  );
}
function Growing({ compound }: { compound: boolean }) {
  const [list, setList] = useState([asked, completed]);
  const Thread = compound ? CompoundThread : Tiraz.ChatThread;
  return (
    <>
      <Thread messages={list} label="Growing" />
      <button type="button" onClick={() => setList([...list, streaming])}>
        Add
      </button>
    </>
  );
}

interface Case {
  key: string;
  convenience: ReactNode;
  compound?: ReactNode;
  act?: (user: User) => Promise<void>;
}
function cases(direction: Direction): Case[] {
  const both = (
    props: Tiraz.ChatThreadProps,
  ): Pick<Case, "convenience" | "compound"> => ({
    convenience: provider(direction, <Tiraz.ChatThread {...props} />),
    compound: provider(direction, <CompoundThread {...props} />),
  });
  return [
    { key: `chat-thread-${direction}-empty`, ...both({ messages: [] }) },
    {
      key: `chat-thread-${direction}-conversation`,
      ...both({
        messages: [asked, completed, streaming],
        label: "Customer chat",
        className: "extra",
        id: "thread",
        "data-testid": "thread",
        followOutput: true,
      } as Tiraz.ChatThreadProps),
    },
    {
      key: `chat-thread-${direction}-statuses`,
      ...both({ messages: [stopped, failed, failedBare] }),
    },
    {
      // Slots a part cannot carry: avatar, actions and node content.
      key: `chat-thread-${direction}-slots`,
      convenience: provider(
        direction,
        <Tiraz.ChatThread
          aria-label="Support"
          messages={[
            {
              id: "s1",
              role: "assistant",
              identity: <em>Tiraz</em>,
              avatar: <span data-avatar="">T</span>,
              content: (
                <p>
                  Fell by <strong>12%</strong>.
                </p>
              ),
              actions: <button type="button">Copy</button>,
            },
            {
              id: "s2",
              role: "assistant",
              avatar: <span data-avatar="">T</span>,
              content: "No name",
              status: "failed",
              error: <code>E_LEDGER</code>,
              onRetry: noop,
              actions: <button type="button">Report</button>,
            },
          ]}
        />,
      ),
    },
    {
      key: `chat-message-${direction}-alone`,
      convenience: provider(
        direction,
        <Tiraz.ChatThreadMessage
          message={failed}
          className="extra"
          data-testid="one"
        />,
      ),
      compound: provider(
        direction,
        <Tiraz.ChatThreadMessage
          id="a4"
          role="assistant"
          identity="Tiraz"
          status="failed"
          error="The ledger connection dropped."
          onRetry={noop}
          className="extra"
          data-testid="one"
        >
          Net cash flow fell
        </Tiraz.ChatThreadMessage>,
      ),
    },
    {
      // A native id and role stay native when the message is a record.
      key: `chat-message-${direction}-native`,
      convenience: provider(
        direction,
        <Tiraz.ChatThreadMessage
          message={completed}
          id="dom-id"
          role="note"
          lang="en"
        />,
      ),
    },
    {
      key: `chat-thread-${direction}-arrival`,
      convenience: provider(direction, <Growing compound={false} />),
      compound: provider(direction, <Growing compound />),
      act: async (user) => {
        await user.click(screen.getByRole("button", { name: "Add" }));
      },
    },
  ];
}

afterEach(() => vi.restoreAllMocks());

describe.each(directions)("convenience markup in %s", (direction) => {
  const entries = cases(direction).map((entry) => [entry.key, entry] as const);
  it.each(entries)("%s is unchanged from the capture", async (key, entry) => {
    const user = userEvent.setup();
    render(entry.convenience);
    await entry.act?.(user);
    expect(markup()).toBe(before[key]);
  });
  it.each(entries.filter(([, entry]) => entry.compound))(
    "%s equals the compound markup",
    async (_, entry) => {
      const user = userEvent.setup();
      const wrapped = render(entry.convenience);
      await entry.act?.(user);
      const convenience = markup();
      wrapped.unmount();
      render(entry.compound);
      await entry.act?.(user);
      expect(markup()).toBe(convenience);
    },
  );
});

it("captures exactly the cases compared", () => {
  const keys = directions.flatMap((d) => cases(d).map((entry) => entry.key));
  expect(Object.keys(before).sort()).toEqual(keys.sort());
});

describe("ChatThread with ChatThreadMessage parts", () => {
  it("draws each part as a message, in order, with its content as children", () => {
    render(
      provider(
        "ltr",
        <Tiraz.ChatThread label="Support">
          <Tiraz.ChatThreadMessage id="u1" role="user">
            Net cash flow?
          </Tiraz.ChatThreadMessage>
          <Tiraz.ChatThreadMessage
            id="a1"
            role="assistant"
            identity="Tiraz"
            status="completed"
          >
            <p>
              It fell by <strong>12%</strong>.
            </p>
          </Tiraz.ChatThreadMessage>
        </Tiraz.ChatThread>,
      ),
    );
    const region = screen.getByRole("region", { name: "Support" });
    const articles = [...region.querySelectorAll("article")];
    expect(articles.map((a) => a.getAttribute("data-role"))).toEqual([
      "user",
      "assistant",
    ]);
    expect(articles.map((a) => a.getAttribute("data-message-id"))).toEqual([
      "u1",
      "a1",
    ]);
    expect(articles[1]).toHaveAttribute("data-status", "completed");
    expect(articles[1].querySelector(".tz-chat-identity")).toHaveTextContent(
      "Tiraz",
    );
    expect(
      articles[1].querySelector(".tz-chat-content strong"),
    ).toHaveTextContent("12%");
    // The message ID is the application's, never a DOM id.
    for (const article of articles) expect(article).not.toHaveAttribute("id");
  });

  it("names the region by direction when no label is given", () => {
    render(
      provider(
        "rtl",
        <Tiraz.ChatThread>
          <Tiraz.ChatThreadMessage id="u1" role="user">
            مرحبًا
          </Tiraz.ChatThreadMessage>
        </Tiraz.ChatThread>,
      ),
    );
    expect(screen.getByRole("region", { name: "المحادثة" })).toBeVisible();
  });

  it("retries a failed part once, keeps the error as text and moves focus to the message", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { container } = render(
      provider(
        "ltr",
        <Tiraz.ChatThread>
          <Tiraz.ChatThreadMessage
            id="a4"
            role="assistant"
            status="failed"
            error="The ledger connection dropped."
            onRetry={onRetry}
          >
            Net cash flow fell
          </Tiraz.ChatThreadMessage>
        </Tiraz.ChatThread>,
      ),
    );
    const message = container.querySelector("article")!;
    expect(message).toHaveAttribute("data-status", "failed");
    expect(message).toHaveTextContent("The ledger connection dropped.");
    expect(
      message.querySelector("[aria-live], [role=status], [role=alert]"),
    ).toBe(null);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(message).toHaveFocus();
  });

  it("says a stopped part stopped, and offers no retry without onRetry", () => {
    render(
      provider(
        "rtl",
        <Tiraz.ChatThread>
          <Tiraz.ChatThreadMessage id="a3" role="assistant" status="stopped">
            رد جزئي
          </Tiraz.ChatThreadMessage>
          <Tiraz.ChatThreadMessage id="a5" role="assistant" status="failed">
            رد
          </Tiraz.ChatThreadMessage>
        </Tiraz.ChatThread>,
      ),
    );
    expect(screen.getByText("أُوقف الرد")).toBeVisible();
    expect(screen.getByText("تعذّر إكمال الرد")).toBeVisible();
    expect(screen.queryByRole("button", { name: "أعد المحاولة" })).toBeNull();
  });

  it("keeps messages first, then parts, and passes other children through", () => {
    render(
      provider(
        "ltr",
        <Tiraz.ChatThread messages={[asked]}>
          <Tiraz.ChatThreadMessage id="a1" role="assistant">
            Part
          </Tiraz.ChatThreadMessage>
          <p>Typing…</p>
        </Tiraz.ChatThread>,
      ),
    );
    const list = screen.getByRole("region").querySelector(".tz-chat-messages")!;
    expect([...list.children].map((node) => node.textContent)).toEqual([
      "Net cash flow?",
      "Part",
      "Typing…",
    ]);
  });

  it("enters only the parts that arrive after the first render, until their entrance ends", () => {
    function Host({ more }: { more: boolean }) {
      return provider(
        "ltr",
        <Tiraz.ChatThread>
          <Tiraz.ChatThreadMessage id="u1" role="user">
            One
          </Tiraz.ChatThreadMessage>
          {more && (
            <Tiraz.ChatThreadMessage id="a1" role="assistant">
              Two
            </Tiraz.ChatThreadMessage>
          )}
        </Tiraz.ChatThread>,
      );
    }
    const { rerender, container } = render(<Host more={false} />);
    expect(container.querySelector("[data-fresh]")).toBeNull();
    rerender(<Host more />);
    const articles = container.querySelectorAll("article");
    expect(articles[0]).not.toHaveAttribute("data-fresh");
    expect(articles[1]).toHaveAttribute("data-fresh", "true");
    // A part's own handler still runs, then the entrance settles.
    endEntrance(articles[1]);
    expect(articles[1]).not.toHaveAttribute("data-fresh");
  });

  it("calls a part's own onAnimationEnd before settling it", () => {
    const own = vi.fn();
    function Host({ more }: { more: boolean }) {
      return provider(
        "ltr",
        <Tiraz.ChatThread>
          <Tiraz.ChatThreadMessage id="u1" role="user">
            One
          </Tiraz.ChatThreadMessage>
          {more && (
            <Tiraz.ChatThreadMessage
              id="a1"
              role="assistant"
              onAnimationEnd={own}
            >
              Two
            </Tiraz.ChatThreadMessage>
          )}
        </Tiraz.ChatThread>,
      );
    }
    const { rerender, container } = render(<Host more={false} />);
    rerender(<Host more />);
    endEntrance(container.querySelectorAll("article")[1]);
    expect(own).toHaveBeenCalledTimes(1);
    expect(container.querySelector("[data-fresh]")).toBeNull();
  });

  it("draws one part alone, forwards ref and native attributes, and keeps data-message-id", () => {
    const ref = createRef<HTMLElement>();
    render(
      provider(
        "ltr",
        <Tiraz.ChatThreadMessage
          ref={ref}
          id="a1"
          role="assistant"
          className="extra"
          data-testid="one"
          lang="en"
        >
          Alone
        </Tiraz.ChatThreadMessage>,
      ),
    );
    const article = screen.getByTestId("one");
    expect(ref.current).toBe(article);
    expect(article).toHaveClass("tz-chat-message", "extra");
    expect(article).toHaveAttribute("data-message-id", "a1");
    expect(article).toHaveAttribute("data-role", "assistant");
    expect(article).not.toHaveAttribute("role");
    expect(article).toHaveAttribute("tabindex", "-1");
  });

  it("keeps the record form: a native role and id stay native", () => {
    render(
      provider(
        "ltr",
        <Tiraz.ChatThreadMessage message={completed} id="dom-id" role="note" />,
      ),
    );
    const article = document.querySelector("article")!;
    expect(article).toHaveAttribute("id", "dom-id");
    expect(article).toHaveAttribute("role", "note");
    expect(article).toHaveAttribute("data-message-id", "a1");
    expect(article).toHaveAttribute("data-role", "assistant");
  });

  it("checks the part and record forms at compile time", () => {
    const bad = [
      // @ts-expect-error a part needs its message id
      <Tiraz.ChatThreadMessage role="user" key="1" />,
      // @ts-expect-error a part needs its role
      <Tiraz.ChatThreadMessage id="x" key="2" />,
      // @ts-expect-error a record takes its content from the message, not children
      <Tiraz.ChatThreadMessage message={asked} key="3">
        Extra
      </Tiraz.ChatThreadMessage>,
      // @ts-expect-error actions stay in the messages API
      <Tiraz.ChatThreadMessage id="x" role="user" actions="Copy" key="4" />,
      // @ts-expect-error avatar is a node, so it stays in the messages API
      <Tiraz.ChatThreadMessage id="x" role="user" avatar="T" key="5" />,
    ];
    expect(bad).toHaveLength(5);
    const ok: ReactNode[] = [
      <Tiraz.ChatThread key="a" />,
      <Tiraz.ChatThread messages={[asked]} key="b" />,
      <Tiraz.ChatThread key="c">
        <Tiraz.ChatThreadMessage id="u" role="user" />
      </Tiraz.ChatThread>,
    ];
    expect(ok).toHaveLength(3);
  });
});
