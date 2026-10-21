import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  InlineDiff,
  SuggestedEdits,
  SystemProvider,
  defaultConfig,
} from "./index";
import type { DiffSegment, SuggestedEditsProps, SystemConfig } from "./index";

afterEach(() => vi.unstubAllGlobals());

const wrap = (children: ReactNode, config: Partial<SystemConfig> = {}) => (
  <SystemProvider config={{ ...defaultConfig, ...config }}>
    {children}
  </SystemProvider>
);

// The close summary's first sentence, and the three changes that make it
// shorter.
const sentence =
  "خلال إقفال أكتوبر، قام فريق المالية بعملية مطابقة ٢١٧ فاتورة للموردين، وتبيّن من خلال المطابقة وجود ٣ فروق مختلفة تحتاج إلى مراجعة.";
const segments: DiffSegment[] = [
  { id: "s1", kind: "same", text: "خلال إقفال أكتوبر، " },
  { id: "c1", kind: "delete", text: "قام فريق المالية بعملية مطابقة" },
  { id: "c1-new", kind: "insert", text: "طابق فريق المالية" },
  { id: "s2", kind: "same", text: " ٢١٧ فاتورة للموردين، " },
  { id: "c2", kind: "delete", text: "وتبيّن من خلال المطابقة وجود" },
  { id: "c2-new", kind: "insert", text: "وظهرت" },
  { id: "s3", kind: "same", text: " ٣ فروق " },
  { id: "c3", kind: "delete", text: "مختلفة " },
  { id: "s4", kind: "same", text: "تحتاج إلى مراجعة." },
];
const suggestion = { title: "اجعلها أقصر", segments };
// The sentence follows a lead, so its offsets do not start at zero.
const lead = "ملخص الإقفال للمدير المالي. ";
const at = { start: lead.length, end: lead.length + sentence.length };
const actions = [
  { id: "shorter", label: "أقصر" },
  { id: "clearer", label: "أوضح" },
];
type Status = SuggestedEditsProps["status"];

function edits(
  props: Partial<SuggestedEditsProps> = {},
  config: Partial<SystemConfig> = {},
) {
  return wrap(
    <SuggestedEdits
      actions={actions}
      onAction={() => {}}
      status="idle"
      {...props}
    >
      <p data-testid="text">{lead + sentence}</p>
    </SuggestedEdits>,
    config,
  );
}
const title = "اقتراح المساعد · اجعلها أقصر";

it("accepts with Y and rejects with N on any layout, never on repeat", () => {
  const change = vi.fn();
  render(
    wrap(
      <>
        <InlineDiff
          segments={segments}
          decisions={{}}
          onDecisionsChange={change}
        />
        <input aria-label="ملاحظة" />
      </>,
    ),
  );
  // Each change is a group named by what it does.
  const first = screen.getByRole("group", {
    name: "حذف «قام فريق المالية بعملية مطابقة» وإضافة «طابق فريق المالية»",
  });
  expect(screen.getAllByRole("group")).toHaveLength(3);
  first.focus();
  // An Arabic layout types «غ» on the Y key and «ى» on the N key.
  fireEvent.keyDown(first, { code: "KeyY", key: "غ" });
  expect(change).toHaveBeenLastCalledWith({ c1: "accepted" });
  fireEvent.keyDown(first, { code: "KeyN", key: "ى" });
  expect(change).toHaveBeenLastCalledWith({ c1: "rejected" });
  change.mockClear();
  fireEvent.keyDown(first, { code: "KeyY", key: "غ", repeat: true });
  fireEvent.keyDown(first, { code: "KeyY", key: "y", ctrlKey: true });
  fireEvent.keyDown(first, { code: "KeyN", key: "n", metaKey: true });
  fireEvent.keyDown(first, { code: "KeyY", key: "y", altKey: true });
  const field = screen.getByRole("textbox", { name: "ملاحظة" });
  field.focus();
  fireEvent.keyDown(field, { code: "KeyY", key: "y" });
  expect(change).not.toHaveBeenCalled();
});

it("applies only accepted changes and hands the host the offsets", async () => {
  const onAction = vi.fn(),
    onApply = vi.fn();
  const view = render(edits({ onAction }));
  const text = screen.getByTestId("text").firstChild!;
  act(() => {
    window.getSelection()!.setBaseAndExtent(text, at.start, text, at.end);
    fireEvent(document, new Event("selectionchange"));
  });
  const shorter = (await screen.findByText("أقصر")).closest("button")!;
  fireEvent.pointerDown(shorter);
  fireEvent.click(shorter);
  expect(onAction).toHaveBeenCalledWith("shorter", { text: sentence, ...at });
  view.rerender(
    edits({
      onAction,
      status: "reviewing",
      suggestion,
      decisions: { c1: "accepted", c2: "rejected" },
      onApply,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "تطبيق" }));
  // c1 is accepted; c2 is rejected and c3 undecided, so both keep the
  // original.
  expect(onApply).toHaveBeenCalledWith(
    "خلال إقفال أكتوبر، طابق فريق المالية ٢١٧ فاتورة للموردين، وتبيّن من خلال المطابقة وجود ٣ فروق مختلفة تحتاج إلى مراجعة.",
    at,
  );
});

it("counts changes and accepts or rejects them all", () => {
  const change = vi.fn();
  render(
    edits({
      status: "reviewing",
      suggestion,
      selection: at,
      decisions: {},
      onDecisionsChange: change,
    }),
  );
  const card = screen.getByRole("dialog", { name: title });
  expect(card).toHaveTextContent("١ من ٣");
  fireEvent.click(within(card).getByRole("button", { name: "التعديل التالي" }));
  expect(card).toHaveTextContent("٢ من ٣");
  fireEvent.click(within(card).getByRole("button", { name: "قبول الكل" }));
  expect(change).toHaveBeenLastCalledWith({
    c1: "accepted",
    c2: "accepted",
    c3: "accepted",
  });
  fireEvent.click(within(card).getByRole("button", { name: "رفض الكل" }));
  expect(change).toHaveBeenLastCalledWith({
    c1: "rejected",
    c2: "rejected",
    c3: "rejected",
  });
});

// A suggestion of `total` one-word insertions, the first `accepted` of them
// accepted.
function many(total: number, accepted: number) {
  const parts: DiffSegment[] = [];
  const decisions: Record<string, "accepted" | "rejected"> = {};
  for (let index = 1; index <= total; index += 1) {
    parts.push(
      { id: `s${index}`, kind: "same", text: "كلمة " },
      { id: `c${index}`, kind: "insert", text: "جديدة " },
    );
    if (index <= accepted) decisions[`c${index}`] = "accepted";
  }
  return { suggestion: { title: "اجعلها أوضح", segments: parts }, decisions };
}

it("closes into an agreeing receipt with Undo only when offered", () => {
  const undo = vi.fn();
  const decided = {
    c1: "accepted",
    c2: "accepted",
    c3: "rejected",
  } as const;
  const view = render(
    edits({ status: "applied", suggestion, decisions: decided, onUndo: undo }),
  );
  expect(screen.getByText("طُبّق تعديلان من ٣")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "تراجع" }));
  expect(undo).toHaveBeenCalledTimes(1);
  view.rerender(edits({ status: "applied", suggestion, decisions: decided }));
  expect(screen.getByText("طُبّق تعديلان من ٣")).toBeVisible();
  expect(screen.queryByRole("button", { name: "تراجع" })).toBeNull();
  // The verb agrees with تعديل at every plural boundary, in either digits.
  for (const [accepted, total, receipt, numerals] of [
    [0, 3, "لم يُطبَّق أي تعديل", "arab"],
    [1, 3, "طُبّق تعديل واحد من ٣", "arab"],
    [3, 5, "طُبّق ٣ تعديلات من ٥", "arab"],
    [11, 12, "طُبّق ١١ تعديلًا من ١٢", "arab"],
    [100, 100, "طُبّق ١٠٠ تعديل من ١٠٠", "arab"],
    [3, 5, "طُبّق 3 تعديلات من 5", "latn"],
  ] as const) {
    view.rerender(
      edits({ status: "applied", ...many(total, accepted) }, { numerals }),
    );
    expect(screen.getByText(receipt)).toBeVisible();
  }
});

it("leaves the host text untouched and returns focus on Escape", () => {
  const dismiss = vi.fn();
  const view = render(edits({ selection: at }));
  view.rerender(
    edits({
      status: "reviewing",
      suggestion,
      selection: at,
      decisions: { c1: "accepted", c2: "accepted", c3: "accepted" },
      onDismiss: dismiss,
    }),
  );
  // The card opened while focus was on the page, so it takes it.
  const heading = screen.getByRole("heading", { name: title });
  expect(heading).toHaveFocus();
  // Accepting every change rewrites nothing until Apply.
  expect(screen.getByTestId("text").textContent).toBe(lead + sentence);
  fireEvent.keyDown(heading, { key: "Escape" });
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("region", { name: "نص قابل للتحسين" })).toHaveFocus();
});

it("marks the selection only where the highlight API exists, one range per instance", () => {
  class FakeHighlight extends Set<Range> {}
  const highlights = new Map<string, FakeHighlight>();
  vi.stubGlobal("CSS", { ...globalThis.CSS, highlights });
  vi.stubGlobal("Highlight", FakeHighlight);
  const two = (first: Status, second: Status) =>
    wrap(
      <>
        <SuggestedEdits
          actions={actions}
          onAction={() => {}}
          status={first}
          selection={{ start: 0, end: 3 }}
        >
          <p>أول نص</p>
        </SuggestedEdits>
        <SuggestedEdits
          actions={actions}
          onAction={() => {}}
          status={second}
          selection={{ start: 0, end: 4 }}
        >
          <p>ثاني نص</p>
        </SuggestedEdits>
      </>,
    );
  const marked = () =>
    [...(highlights.get("tz-suggestion") ?? [])].map((range) =>
      range.toString(),
    );
  const view = render(two("rewriting", "rewriting"));
  expect(marked()).toEqual(["أول", "ثاني"]);
  // Dismissing the first takes away only its own range.
  view.rerender(two("idle", "rewriting"));
  expect(marked()).toEqual(["ثاني"]);
  view.rerender(two("idle", "idle"));
  expect(highlights.has("tz-suggestion")).toBe(false);
  // Without the API nothing is marked, and nothing throws.
  vi.unstubAllGlobals();
  expect(() => view.rerender(two("rewriting", "reviewing"))).not.toThrow();
  expect(highlights.size).toBe(0);
});

it("says plain text when the selection spans formatting", () => {
  const formatted = (start: number, end: number) =>
    wrap(
      <SuggestedEdits
        actions={actions}
        onAction={() => {}}
        status="reviewing"
        suggestion={{
          title: "اجعلها أقصر",
          segments: [{ id: "s1", kind: "same", text: "ثاني ثا" }],
        }}
        selection={{ start, end }}
      >
        <p>
          أول <strong>ثاني</strong> ثالث
        </p>
      </SuggestedEdits>,
    );
  // «ثاني ثا» runs out of the bold word.
  const view = render(formatted(4, 11));
  expect(screen.getByText("يُطبَّق كنص عادي")).toBeVisible();
  // «أول» is plain text.
  view.rerender(formatted(0, 3));
  expect(screen.getByText("يُطبَّق كنص عادي")).not.toBeVisible();
});

it("keeps an inline review in the text flow and preserves decisions and keyboard dismissal", () => {
  const dismiss = vi.fn();
  render(
    edits({
      status: "reviewing",
      suggestion,
      selection: at,
      reviewPlacement: "inline",
      onDismiss: dismiss,
    }),
  );
  const dialog = screen.getByRole("dialog", { name: title });
  expect(
    screen.getByTestId("text").closest(".tz-suggested-edits"),
  ).toContainElement(dialog);
  expect(dialog).not.toHaveAttribute("data-side");
  const first = within(dialog).getAllByRole("group")[0];
  first.focus();
  fireEvent.keyDown(first, { code: "KeyY", key: "غ" });
  expect(within(first).getByRole("button", { name: /^قبول/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.keyDown(first, { key: "Escape" });
  expect(dismiss).toHaveBeenCalledOnce();
  expect(screen.getByRole("region")).toHaveFocus();
});

it("returns focus to the review heading when changing placement removes a focused control", () => {
  const props = { status: "reviewing" as const, suggestion, selection: at };
  const view = render(edits(props));
  within(screen.getByRole("dialog", { name: title }))
    .getByRole("button", { name: "قبول الكل" })
    .focus();
  view.rerender(edits({ ...props, reviewPlacement: "inline" }));
  expect(screen.getByRole("heading", { name: title })).toHaveFocus();
  within(screen.getByRole("dialog", { name: title }))
    .getByRole("button", { name: "رفض الكل" })
    .focus();
  view.rerender(edits(props));
  expect(screen.getByRole("heading", { name: title })).toHaveFocus();
});
