import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { DraftReview, SystemProvider, defaultConfig } from "./index";
import type { DiffSegment, DraftReviewProps } from "./index";
afterEach(() => vi.useRealTimers());

const title = "تذكير بالسداد";
const body =
  "مرحبًا سارة، نذكّرك بأن الفاتورة INV-1043 استُحقّت في ٦ أكتوبر. نرجو السداد في أقرب وقت.";
// Two changes: an added clause, and a phrase swapped for another.
const segments: DiffSegment[] = [
  {
    id: "s1",
    kind: "same",
    text: "مرحبًا سارة، نذكّرك بأن الفاتورة INV-1043 استُحقّت في ٦ أكتوبر",
  },
  { id: "c1", kind: "insert", text: "، أي قبل ١٢ يومًا" },
  { id: "s2", kind: "same", text: ". نرجو السداد " },
  { id: "c2", kind: "delete", text: "في أقرب وقت" },
  { id: "c2-new", kind: "insert", text: "خلال هذا الأسبوع" },
  { id: "s3", kind: "same", text: "." },
];
const recipients = [{ id: "sara", label: "سارة العتيبي" }];
function draft(
  status: DraftReviewProps["status"],
  extra: Partial<DraftReviewProps> = {},
) {
  return (
    <DraftReview
      status={status}
      title={title}
      agent="وكيل التحصيل"
      record={{
        id: "INV-1043",
        customer: "شركة مدار",
        amount: "٩٬٤٠٠ ر.س",
        overdue: "متأخرة ١٢ يومًا",
      }}
      recipients={recipients}
      attachments={[{ id: "inv-1043", label: "INV-1043.pdf" }]}
      body={body}
      tone="friendly"
      {...extra}
    />
  );
}
const section = () => screen.getByRole("region", { name: title });
const region = () =>
  document.querySelector(".tz-draft-review > [role='status']") as HTMLElement;
const chord = (extra: Record<string, boolean> = {}) =>
  act(() => {
    fireEvent.keyDown(section(), { key: "Enter", ctrlKey: true, ...extra });
  });
const undoButton = () => screen.queryByRole("button", { name: "تراجع" });

it("sends what it shows, once, with Ctrl or Cmd+Enter after 500 ms", () => {
  vi.useFakeTimers();
  const onSend = vi.fn();
  const view = render(
    draft("ready", {
      suggestion: {
        title: "أوضح",
        segments,
        decisions: { c1: "accepted", c2: "rejected" },
        onDecisionsChange: () => {},
      },
      onSend,
      onDiscard: () => {},
    }),
  );
  act(() => section().focus());
  act(() => vi.advanceTimersByTime(600));
  chord();
  // The accepted clause goes in; the rejected phrase stays as it was.
  expect(onSend).toHaveBeenCalledTimes(1);
  expect(onSend).toHaveBeenLastCalledWith(
    "مرحبًا سارة، نذكّرك بأن الفاتورة INV-1043 استُحقّت في ٦ أكتوبر، أي قبل ١٢ يومًا. نرجو السداد في أقرب وقت.",
  );
  // One send per ready status: another chord, a click and a held key do nothing.
  act(() => vi.advanceTimersByTime(600));
  chord();
  fireEvent.click(screen.getByRole("button", { name: "إرسال" }));
  chord({ ctrlKey: false, metaKey: true, repeat: true });
  expect(onSend).toHaveBeenCalledTimes(1);
  view.unmount();
  // Without a suggestion, Send hands over the body.
  const plain = vi.fn();
  const again = render(draft("ready", { onSend: plain }));
  fireEvent.click(screen.getByRole("button", { name: "إرسال" }));
  expect(plain).toHaveBeenCalledTimes(1);
  expect(plain).toHaveBeenLastCalledWith(body);
  again.unmount();
  // A new tone or a new recipient waits 500 ms again before the chord sends.
  for (const change of [
    { tone: "formal" as const },
    { recipients: [...recipients, { id: "finance", label: "قسم المالية" }] },
  ]) {
    const onChange = vi.fn();
    const fresh = render(draft("ready", { onSend: onChange }));
    act(() => section().focus());
    act(() => vi.advanceTimersByTime(600));
    fresh.rerender(draft("ready", { onSend: onChange, ...change }));
    act(() => vi.advanceTimersByTime(100));
    chord();
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(500));
    chord();
    expect(onChange).toHaveBeenCalledTimes(1);
    fresh.unmount();
  }
});

it("offers Undo only inside the host's window and never claims a recall", () => {
  vi.useFakeTimers();
  const onUndo = vi.fn(),
    recall = /استرج|recall/i;
  const said = "تُرسَل الرسالة خلال ١٠ث. يمكنك التراجع.";
  // The host holds the message: the countdown and Undo, said once.
  const view = render(draft("ready", { onSend: () => {} }));
  view.rerender(draft("sending", { undoWindow: 10, onUndo }));
  expect(screen.getByText("تُرسَل خلال ١٠ث")).toBeInTheDocument();
  expect(undoButton()).toBeEnabled();
  expect(region().textContent).toBe(said);
  // The host passes the seconds left; nothing is said again.
  act(() => vi.advanceTimersByTime(3000));
  view.rerender(draft("sending", { undoWindow: 7, onUndo }));
  expect(region().textContent).toBe(said);
  expect(screen.getByText("تُرسَل خلال ٧ث")).toBeInTheDocument();
  // Undo asks the host once, then waits for its answer.
  fireEvent.click(undoButton()!);
  fireEvent.click(undoButton()!);
  expect(onUndo).toHaveBeenCalledTimes(1);
  expect(undoButton()).toBeDisabled();
  view.rerender(draft("ready", { onSend: () => {} }));
  expect(region().textContent).toBe("أُلغي الإرسال، والمسودة محفوظة");
  expect(section().textContent).not.toMatch(recall);
  view.unmount();
  // Without a handler or a window there is no Undo: it is sending now.
  for (const props of [{ undoWindow: 10 }, { onUndo }]) {
    const bare = render(draft("ready", { onSend: () => {} }));
    bare.rerender(draft("sending", props));
    expect(undoButton()).toBeNull();
    expect(screen.getByText("تُرسَل الآن…")).toBeInTheDocument();
    expect(region().textContent).toBe("تُرسَل الرسالة");
    bare.unmount();
  }
  // Once the window ends, Undo goes.
  const ended = render(draft("ready", { onSend: () => {} }));
  ended.rerender(draft("sending", { undoWindow: 10, onUndo }));
  act(() => vi.advanceTimersByTime(10000));
  expect(undoButton()).toBeNull();
  expect(screen.getByText("تُرسَل الآن…")).toBeInTheDocument();
  ended.rerender(draft("sent"));
  expect(region().textContent).toBe("أُرسلت الرسالة");
  ended.unmount();
  // An Undo the host could not honor: the message went, and the receipt says so.
  for (const direction of ["rtl", "ltr"] as const) {
    const ui = (status: DraftReviewProps["status"]) => (
      <SystemProvider config={{ ...defaultConfig, direction }}>
        {draft(status, { undoWindow: 10, onUndo })}
      </SystemProvider>
    );
    const late = render(ui("ready"));
    late.rerender(ui("sending"));
    fireEvent.click(screen.getByRole("button", { name: /^(تراجع|Undo)$/ }));
    late.rerender(ui("sent"));
    expect(region().textContent).toBe(
      direction === "rtl"
        ? "أُرسلت الرسالة قبل أن يُلغى الإرسال"
        : "The message was sent before it could be cancelled",
    );
    expect(section().textContent).not.toMatch(recall);
    late.unmount();
  }
});

it("frames the record and offers recipients, attachments and tone", async () => {
  const user = userEvent.setup(),
    onToneChange = vi.fn();
  const view = render(draft("ready", { onToneChange }));
  const id = screen.getByText("INV-1043", { selector: "bdi" });
  expect(id).toHaveAttribute("dir", "ltr");
  const record = id.closest("p")!;
  expect(record).toHaveTextContent("٩٬٤٠٠ ر.س");
  expect(record).toHaveTextContent("متأخرة ١٢ يومًا");
  expect(screen.getByText("متأخرة ١٢ يومًا")).toHaveAttribute(
    "data-tone",
    "error",
  );
  expect(screen.getByText("سارة العتيبي")).toBeVisible();
  expect(screen.getByText("INV-1043.pdf")).toBeVisible();
  // The tone is the host's: a choice only asks for it.
  expect(screen.getByRole("radio", { name: "ودّي" })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: "رسمي" }));
  expect(onToneChange).toHaveBeenCalledTimes(1);
  expect(onToneChange).toHaveBeenLastCalledWith("formal");
  view.rerender(draft("sending", { onToneChange }));
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(3);
  for (const radio of radios) expect(radio).toBeDisabled();
});

it("announces each status once and moves focus to the section when its controls go", async () => {
  const user = userEvent.setup(),
    onDiscard = vi.fn();
  const ready = () => draft("ready", { onSend: () => {}, onDiscard });
  const view = render(ready());
  // The status it mounts in is not news.
  expect(region()).toBeEmptyDOMElement();
  view.rerender(draft("writing", { body: "مرحبًا سارة،" }));
  expect(region().textContent).toBe("يكتب المسودة");
  view.rerender(ready());
  expect(region().textContent).toBe("المسودة بانتظار مراجعتك");
  act(() => screen.getByRole("button", { name: "تجاهل" }).focus());
  await user.keyboard("{Enter}");
  expect(onDiscard).toHaveBeenCalledTimes(1);
  // Discard is gone with its status, and focus stays in the pattern.
  view.rerender(draft("discarded", { onSend: () => {}, onDiscard }));
  expect(screen.queryByRole("button", { name: "تجاهل" })).toBeNull();
  expect(section()).toHaveFocus();
  expect(region().textContent).toBe("تم تجاهل المسودة");
});
