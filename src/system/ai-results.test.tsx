import { readFileSync } from "node:fs";
import { sampleSources } from "./ai/examples/ai-result-samples";
import { act, render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import {
  ImageResult,
  Sources,
  InlineCitation,
  InsightCards,
  SystemProvider,
  defaultConfig,
  Modal,
  Button,
} from "./index";
import type { SourceReference } from "./index";
import type { ReactNode } from "react";
import {
  ImageResultExample,
  ImageResultStates,
  InsightCardsExample,
  SourcesStates,
} from "./ai/examples/AIResultsExamples";
const source: SourceReference = {
  id: "menu-audit",
  number: 4,
  title: "Menu / القائمة",
  href: "https://example.com/menu",
  description: "Supplied quotation",
  metadata: "Sample · July",
};
function wrap(children: ReactNode) {
  return (
    <SystemProvider config={{ ...defaultConfig, direction: "ltr" }}>
      {children}
    </SystemProvider>
  );
}
it("retains alt and caption across loading, load failure and replacement recovery", () => {
  const view = render(
    wrap(
      <ImageResult
        src="/one.svg"
        alt="Coffee beside a menu"
        caption="Local sample"
      />,
    ),
  );
  expect(screen.getByText("Loading image")).toBeVisible();
  const image = view.container.querySelector("img")!;
  fireEvent.load(image);
  expect(
    screen.getByRole("img", { name: "Coffee beside a menu" }),
  ).toBeVisible();
  fireEvent.error(image);
  expect(screen.getByText("Image unavailable")).toBeVisible();
  expect(screen.getByText("Coffee beside a menu")).toBeVisible();
  expect(screen.queryByRole("button")).toBeNull();
  view.rerender(
    wrap(
      <ImageResult
        src="/two.svg"
        alt="Coffee beside a menu"
        caption="Local sample"
      />,
    ),
  );
  fireEvent.load(view.container.querySelector("img")!);
  expect(
    screen.getByRole("img", { name: "Coffee beside a menu" }),
  ).toBeVisible();
  expect(screen.getByText("Local sample")).toBeVisible();
});
it("exposes only supplied retry and use behavior and honors host states", async () => {
  const user = userEvent.setup(),
    retry = vi.fn(),
    use = vi.fn();
  const view = render(
    wrap(<ImageResult state="error" alt="Menu" onRetry={retry} />),
  );
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledOnce();
  view.rerender(
    wrap(
      <ImageResult
        state="loading"
        alt="Menu"
        src="/one.svg"
        action={{ label: "Use image", onClick: use }}
      />,
    ),
  );
  expect(screen.queryByRole("button")).toBeNull();
  view.rerender(
    wrap(
      <ImageResult
        alt="Menu"
        src="/one.svg"
        action={{ label: "Use image", onClick: use }}
      />,
    ),
  );
  fireEvent.load(view.container.querySelector("img")!);
  await user.click(screen.getByRole("button", { name: "Use image" }));
  expect(use).toHaveBeenCalledOnce();
});
it("renders a missing image as an honest failure instead of an empty src", () => {
  const view = render(wrap(<ImageResult alt="Missing menu" />));
  expect(screen.getByText("Image unavailable")).toBeVisible();
  expect(view.container.querySelector("img")).toBeNull();
});
it("connects citation disclosure to the supplied source and preserves native navigation", async () => {
  const user = userEvent.setup();
  render(
    wrap(
      <>
        <p>
          Answer <InlineCitation source={source} />
        </p>
        <Sources items={[source]} defaultExpanded />
      </>,
    ),
  );
  const trigger = screen.getByRole("button", {
    name: "Source 4: Menu / القائمة",
  });
  trigger.focus();
  await user.keyboard("{Enter}");
  const popup = screen.getByRole("dialog", { name: "Menu / القائمة" });
  expect(within(popup).getByText("Supplied quotation")).toBeVisible();
  expect(
    within(popup).getByRole("link", { name: "Open source" }),
  ).toHaveAttribute("href", "https://example.com/menu");
  const row = screen.getByRole("link", { name: /4 Menu/ });
  expect(row).toHaveAttribute("href", "https://example.com/menu");
  expect(row.closest("li")).toHaveAttribute("data-source-id", "menu-audit");
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole("dialog")).toBeNull();
});
it.each([
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "java\nscript:alert(1)",
  "data:text/html,test",
  "vbscript:msgbox(1)",
  "file:///etc/passwd",
  "//evil.example",
  "\\\\evil.example",
])("rejects unsafe source destination %s", async (href) => {
  const user = userEvent.setup(),
    bad = { ...source, href };
  render(
    wrap(
      <>
        <InlineCitation source={bad} mode="link" />
        <Sources items={[bad]} defaultExpanded />
      </>,
    ),
  );
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.getByText("Destination unavailable")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "1 source" }));
  // Closed, the list stays in the document, hidden, so it can fade out.
  expect(screen.getByText("Destination unavailable")).not.toBeVisible();
});
it.each([
  "https://example.com/a?b=1#c",
  "http://example.com",
  "/local/reference.txt",
  "./notes",
  "../notes",
  "#details",
  "notes.pdf",
])("preserves safe native href %s", (href) => {
  render(wrap(<InlineCitation source={{ ...source, href }} mode="link" />));
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", href);
  expect(link).not.toHaveAttribute("role", "button");
  expect(link).not.toHaveAttribute("target");
});
it("keeps explicit citation numbers stable on reorder and renders missing destinations honestly", () => {
  const second = {
    ...source,
    id: "brief",
    number: 9,
    title: "Brief",
    href: undefined,
  };
  const view = render(
    wrap(<Sources items={[source, second]} defaultExpanded />),
  );
  expect(screen.getByRole("link")).toHaveTextContent("4");
  expect(screen.getByText("Destination unavailable")).toBeVisible();
  view.rerender(wrap(<Sources items={[second, source]} defaultExpanded />));
  expect(screen.getByRole("link")).toHaveTextContent("4");
  expect(screen.getByText("9")).toBeVisible();
});
it("scopes citation popups inside a modal and Escape closes only the top overlay", async () => {
  const user = userEvent.setup();
  render(
    wrap(
      <Modal
        trigger={<Button>Review</Button>}
        title="Review sources"
        description="Local sample"
        closeLabel="Close review"
      >
        <InlineCitation source={source} />
      </Modal>,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Review" }));
  const modal = screen.getByRole("dialog", { name: "Review sources" });
  await user.click(
    within(modal).getByRole("button", { name: "Source 4: Menu / القائمة" }),
  );
  expect(modal).toContainElement(
    screen.getByRole("dialog", { name: source.title }),
  );
  await user.keyboard("{Escape}");
  expect(modal).toBeVisible();
  expect(
    within(modal).getByRole("button", { name: "Source 4: Menu / القائمة" }),
  ).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("pages concise insights with connected actions and preserves selection by ID on update", async () => {
  const user = userEvent.setup(),
    open = vi.fn();
  const a = { id: "a", title: "Menu finding", details: "From sample audit" };
  const b = {
    id: "b",
    title: "Bilingual finding",
    details: "From sample brief",
    action: { label: "View brief", onClick: open },
  };
  const view = render(wrap(<InsightCards items={[a, b]} />));
  expect(
    screen.getByRole("button", { name: "Previous insight" }),
  ).toHaveAttribute("aria-disabled", "true");
  await user.click(screen.getByRole("button", { name: "Next insight" }));
  expect(
    screen.getByRole("heading", { name: "Bilingual finding" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "View brief" }));
  expect(open).toHaveBeenCalledOnce();
  view.rerender(wrap(<InsightCards items={[b, a]} />));
  expect(
    screen.getByRole("heading", { name: "Bilingual finding" }),
  ).toBeVisible();
  view.rerender(wrap(<InsightCards items={[a]} />));
  expect(screen.getByRole("heading", { name: "Menu finding" })).toBeVisible();
  expect(screen.queryByRole("button")).toBeNull();
  expect(view.container.querySelector("[data-tone=error]")).toBeNull();
});
it("renders supplied empty messages without navigation or invented sources/findings", () => {
  render(
    wrap(
      <>
        <Sources items={[]} labels={{ empty: "No references supplied" }} />
        <InsightCards items={[]} labels={{ empty: "No findings supplied" }} />
      </>,
    ),
  );
  expect(screen.getByText("No references supplied")).toBeVisible();
  expect(screen.getByText("No findings supplied")).toBeVisible();
  expect(screen.queryByRole("button")).toBeNull();
});

it("hands keyboard focus to the stable image figure before retry recovery removes the button", async () => {
  const user = userEvent.setup();
  const view = render(wrap(<ImageResultExample language="en" state="error" />));
  const retry = screen.getByRole("button", { name: "Try again" });
  retry.focus();
  await user.keyboard("{Enter}");
  expect(view.container.querySelector("figure")).toHaveFocus();
  expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  fireEvent.load(view.container.querySelector("img")!);
  expect(view.container.querySelector("figure")).toHaveFocus();
});
it("retains supplied zero details rather than treating them as absent", () => {
  render(
    wrap(
      <InsightCards
        items={[{ id: "zero", title: "Zero failures", details: 0 }]}
      />,
    ),
  );
  expect(screen.getByText("0")).toBeVisible();
});

it.each(["ar", "en"] as const)(
  "keeps %s source quotations supported by their actual local documents",
  (language) => {
    const sources = sampleSources(language);
    const files: Record<string, string> = {
      "menu-audit": "menu-audit.txt",
      "menu-brief": "menu-brief.txt",
    };
    const quoted = sources.filter((source) => source.description);
    expect(quoted.length).toBeGreaterThan(0);
    for (const source of quoted) {
      const text = readFileSync(
        `src/system/ai/assets/results/${files[source.id]}`,
        "utf8",
      ).replace(/\s+/g, " ");
      expect(text).toContain(source.description);
    }
  },
);

it("keeps the failed result figure focused through keyboard retry and recovery", async () => {
  const user = userEvent.setup();
  render(wrap(<ImageResultStates language="en" />));
  const retry = screen.getByRole("button", { name: "Try again" });
  const figure = retry.closest("figure")!;
  expect(
    within(figure).getByText("Couldn’t generate this image"),
  ).toBeVisible();
  retry.focus();
  await user.keyboard("{Enter}");
  expect(figure).toHaveFocus();
  expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  fireEvent.load(figure.querySelector("img")!);
  expect(figure).toHaveFocus();
  expect(
    within(figure).getByRole("img", {
      name: "Coffee cup and menu board on a dark background",
    }),
  ).toBeVisible();
});
it("autoplays the generating result once with real progress, then hands it to the loaded image", () => {
  vi.useFakeTimers();
  try {
    const view = render(wrap(<ImageResultStates language="en" />));
    const bar = () =>
      screen.queryByRole("progressbar", { name: "Generating image" });
    const step = (count: number) => {
      for (let i = 0; i < count; i++) act(() => vi.advanceTimersByTime(260));
    };
    expect(bar()).toHaveAttribute("aria-valuenow", "8");
    step(4);
    expect(bar()).toHaveAttribute("aria-valuenow", "56");
    step(4);
    expect(bar()).toHaveAttribute("aria-valuenow", "100");
    expect(vi.getTimerCount()).toBe(0);
    const image = view.container.querySelector<HTMLImageElement>(
      'img[alt="Coffee cup and menu board in clay tones"]',
    )!;
    fireEvent.load(image);
    expect(bar()).toBeNull();
    expect(image).toBeVisible();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
it("shows the finished result immediately under reduced motion", () => {
  vi.useFakeTimers();
  try {
    render(
      <SystemProvider
        config={{ ...defaultConfig, direction: "ltr", reducedMotion: true }}
      >
        <ImageResultStates language="en" />
      </SystemProvider>,
    );
    expect(
      screen.getByRole("progressbar", { name: "Generating image" }),
    ).toHaveAttribute("aria-valuenow", "100");
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.load(
      screen.getByAltText("Coffee cup and menu board in clay tones"),
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});
it.each(["ar", "en"] as const)(
  "renders %s result examples as product content only",
  (language) => {
    const view = render(
      wrap(
        <>
          <ImageResultExample language={language} />
          <ImageResultStates language={language} />
          <SourcesStates language={language} />
          <InsightCardsExample language={language} longContent />
        </>,
      ),
    );
    expect(view.container).not.toHaveTextContent(
      /\b(sample|example|local|demo|simulat\w*|fictional|scripted)\b|تجريبي|عينة|محلي|نموذجي|محاكاة/i,
    );
  },
);
it("retains focus on insight paging controls at both boundaries and ignores unavailable navigation", async () => {
  const user = userEvent.setup();
  render(
    wrap(
      <InsightCards
        items={[
          { id: "one", title: "First finding" },
          { id: "two", title: "Last finding" },
        ]}
      />,
    ),
  );
  const previous = screen.getByRole("button", { name: "Previous insight" });
  const next = screen.getByRole("button", { name: "Next insight" });
  expect(previous).toHaveAttribute("aria-disabled", "true");
  await user.click(previous);
  expect(screen.getByRole("heading", { name: "First finding" })).toBeVisible();
  next.focus();
  await user.keyboard("{Enter}");
  expect(next).toHaveFocus();
  expect(next).toHaveAttribute("aria-disabled", "true");
  await user.keyboard("{Enter}");
  expect(screen.getByRole("heading", { name: "Last finding" })).toBeVisible();
  previous.focus();
  await user.keyboard("{Enter}");
  expect(previous).toHaveFocus();
});
it("shows real host-supplied image progress, clamps values and stays indeterminate when unknown", () => {
  const view = render(
    wrap(<ImageResult state="loading" alt="Menu" progress={42} />),
  );
  const bar = screen.getByRole("progressbar", { name: "Loading image" });
  expect(bar).toHaveAttribute("aria-valuenow", "42");
  expect(screen.getByText("42%")).toBeVisible();
  view.rerender(
    wrap(<ImageResult state="loading" alt="Menu" progress={140} />),
  );
  expect(screen.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  view.rerender(
    wrap(<ImageResult state="loading" alt="Menu" progress={Number.NaN} />),
  );
  expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  expect(screen.queryByText(/NaN/)).toBeNull();
  view.rerender(wrap(<ImageResult state="error" alt="Menu" progress={42} />));
  expect(screen.queryByRole("progressbar")).toBeNull();
});
it("updates loading progress without restarting the image resource", () => {
  const view = render(
    wrap(
      <ImageResult state="loading" src="/menu.svg" alt="Menu" progress={0} />,
    ),
  );
  const image = view.container.querySelector("img");
  view.rerender(
    wrap(
      <ImageResult state="loading" src="/menu.svg" alt="Menu" progress={78} />,
    ),
  );
  expect(view.container.querySelector("img")).toBe(image);
  expect(screen.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "78",
  );
});
it("formats the supplied percentage for Arabic and keeps 100 percent loading until the host completes", () => {
  render(
    <SystemProvider>
      <ImageResult state="loading" alt="قائمة" progress={100} />
    </SystemProvider>,
  );
  expect(
    screen.getByRole("progressbar", { name: "جارٍ تحميل الصورة" }),
  ).toHaveAttribute("aria-valuenow", "100");
  expect(screen.getByText("١٠٠٪؜")).toBeVisible();
});
it("agrees Arabic source counts with their noun", () => {
  const make = (n: number): SourceReference[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `s${i}`,
      number: i + 1,
      title: `مصدر ${i + 1}`,
    }));
  const cases: [number, string][] = [
    [1, "مصدر واحد"],
    [2, "مصدران"],
    [3, "٣ مصادر"],
    [11, "١١ مصدرًا"],
    [100, "١٠٠ مصدر"],
  ];
  for (const [n, text] of cases) {
    const { unmount } = render(
      <SystemProvider config={defaultConfig}>
        <Sources items={make(n)} />
      </SystemProvider>,
    );
    // The whole summary, not a substring: «١٠٠ مصدرًا» must not pass for «١٠٠ مصدر».
    expect(
      within(screen.getByRole("button", { expanded: false })).getByText(text),
    ).toBeInTheDocument();
    unmount();
  }
});
it("agrees Arabic source counts with their noun under Western digits", () => {
  const make = (n: number): SourceReference[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `s${i}`,
      number: i + 1,
      title: `مصدر ${i + 1}`,
    }));
  const cases: [number, string][] = [
    [1, "مصدر واحد"],
    [2, "مصدران"],
    [3, "3 مصادر"],
    [11, "11 مصدرًا"],
    [100, "100 مصدر"],
  ];
  for (const [n, text] of cases) {
    const { unmount } = render(
      <SystemProvider config={{ ...defaultConfig, numerals: "latn" }}>
        <Sources items={make(n)} />
      </SystemProvider>,
    );
    // The whole summary again, so «100 مصدرًا» cannot pass for «100 مصدر».
    expect(
      within(screen.getByRole("button", { expanded: false })).getByText(text),
    ).toBeInTheDocument();
    unmount();
  }
});
