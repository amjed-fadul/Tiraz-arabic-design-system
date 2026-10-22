import type { AgentPresentation } from "../../index";
import { useEffect, useRef, useState } from "react";
import { SuggestedEdits, numberLocale, useSystem } from "../../index";
import type { DiffSegment, SuggestedEditsProps } from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Status = SuggestedEditsProps["status"];
type Decisions = Record<string, "accepted" | "rejected">;

// The page's phases are the pattern's statuses; Selecting is idle with the
// summary's first sentence selected.
const statusOf: Record<string, Status> = {
  selecting: "idle",
  rewriting: "rewriting",
  reviewing: "reviewing",
  applied: "applied",
};
const phaseOf: Record<Status, string> = {
  idle: "selecting",
  rewriting: "rewriting",
  reviewing: "reviewing",
  applied: "applied",
};
// What the Applied state shows when no one has decided: two of three.
const sampleDecisions: Decisions = {
  c1: "accepted",
  c2: "accepted",
  c3: "rejected",
};

export function SuggestedEditsExample({
  getAgentPresentation,
  language = "ar",
  undo = true,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  getAgentPresentation?: (status: string) => AgentPresentation;
  /** Offers Undo in the receipt. */
  undo?: boolean;
  /**
   * "selecting", "rewriting", "reviewing" or "applied", held as given.
   * Selecting selects the summary's first sentence for the toolbar to answer;
   * an action rewrites it and the host's suggestion arrives a moment later.
   * Without a phase the example rests on reviewing.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const n = (value: number) =>
    new Intl.NumberFormat(numberLocale(config, language)).format(value);
  const [invoices, bank, accruals] = story.closeSteps;

  // The close summary for the CFO. Its first sentence is wordy on purpose.
  const first = t(
    `خلال إقفال ${story.period.month.ar}، قام فريق المالية بعملية مطابقة ${n(invoices.invoices)} فاتورة للموردين، وتبيّن من خلال المطابقة وجود ${n(invoices.differences)} فروق مختلفة تحتاج إلى مراجعة.`,
    `During the ${story.period.month.en} close, the finance team carried out the matching of ${n(invoices.invoices)} supplier invoices, and the matching showed that there are ${n(invoices.differences)} separate differences that need review.`,
  );
  const paragraph = `${first} ${t(
    `كما سجّل الفريق ${n(accruals.entries)} قيود استحقاق بقيمة ${money(accruals.amount, language, config.numerals)}، وسوّى حسابات البنك الأهلي الثلاثة بعد مراجعة ${n(bank.transactions)} عملية.`,
    `The team also recorded ${n(accruals.entries)} accrual entries worth ${money(accruals.amount, language, config.numerals)} and reconciled the three Al Ahli bank accounts across ${n(bank.transactions)} transactions.`,
  )}`;
  const actions = [
    {
      id: "shorter",
      label: t("أقصر", "Shorter"),
      title: t("اجعلها أقصر", "Make it shorter"),
    },
    {
      id: "clearer",
      label: t("أوضح", "Clearer"),
      title: t("اجعلها أوضح", "Make it clearer"),
    },
    {
      id: "formal",
      label: t("أكثر رسمية", "More formal"),
      title: t("اجعلها أكثر رسمية", "Make it more formal"),
    },
    {
      id: "translate",
      label: t("ترجم إلى الإنجليزية", "Translate to Arabic"),
      title: t("ترجمها إلى الإنجليزية", "Translate it to Arabic"),
    },
  ];
  // A real host sends the text and the action to its model. This one answers
  // every action with the same rewrite: three phrases it tightens wherever
  // they appear in the selected text.
  const rewrites: readonly (readonly [string, string])[] = ar
    ? [
        ["قام فريق المالية بعملية مطابقة", "طابق فريق المالية"],
        ["وتبيّن من خلال المطابقة وجود", "وظهرت"],
        ["مختلفة ", ""],
      ]
    : [
        ["carried out the matching of", "matched"],
        ["the matching showed that there are", "found"],
        ["separate ", ""],
      ];
  function suggest(text: string) {
    const segments: DiffSegment[] = [];
    let rest = text,
      count = 0;
    for (const [from, to] of rewrites) {
      const at = rest.indexOf(from);
      if (at < 0) continue;
      count += 1;
      if (at > 0)
        segments.push({
          id: `same-${count}`,
          kind: "same",
          text: rest.slice(0, at),
        });
      segments.push({ id: `c${count}`, kind: "delete", text: from });
      if (to) segments.push({ id: `c${count}-new`, kind: "insert", text: to });
      rest = rest.slice(at + from.length);
    }
    if (rest) segments.push({ id: "same-end", kind: "same", text: rest });
    return segments;
  }

  // The host owns the status, the request, the decisions and its own text.
  const [local, setLocal] = useState<Status>("reviewing");
  const status = (phase && statusOf[phase]) || local;
  const [request, setRequest] = useState<{
    action: string;
    start: number;
    end: number;
    segments: DiffSegment[];
  } | null>(null);
  const [decisions, setDecisions] = useState<Decisions>({});
  // The text after the visitor's last Apply, and the text Undo brings back.
  const [edited, setEdited] = useState<string | null>(null),
    [previous, setPrevious] = useState<string | null>(null);
  const answer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(answer.current), []);
  function move(next: Status) {
    setLocal(next);
    onPhaseChange?.(phaseOf[next]);
  }
  // Until the visitor applies something, the Applied state shows the sample
  // decisions applied to the first sentence.
  const sample = edited === null && status === "applied";
  const text =
    edited ??
    (sample
      ? rewrites
          .slice(0, 2)
          .reduce((value, [from, to]) => value.replace(from, to), paragraph)
      : paragraph);
  const current = request ?? {
    action: "shorter",
    start: 0,
    end: first.length,
    segments: suggest(first),
  };

  // Selecting selects the first sentence, unless the visitor has already
  // selected text in the summary.
  const summary = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const node = summary.current,
      words = node?.firstChild;
    if (
      phase !== "selecting" ||
      status !== "idle" ||
      !node ||
      !words?.textContent
    )
      return;
    const chosen = node.ownerDocument.getSelection();
    if (chosen && !chosen.isCollapsed && node.contains(chosen.anchorNode))
      return;
    const end = words.textContent.indexOf(".") + 1 || words.textContent.length;
    chosen?.setBaseAndExtent(words, 0, words, end);
  }, [phase, status]);

  return (
    <SuggestedEdits
      agentPresentation={getAgentPresentation?.(status)}
      status={status}
      actions={actions}
      onAction={(action, picked) => {
        if (sample) setEdited(text);
        setRequest({
          action,
          start: picked.start,
          end: picked.end,
          segments: suggest(text.slice(picked.start, picked.end)),
        });
        setDecisions({});
        move("rewriting");
        clearTimeout(answer.current);
        answer.current = setTimeout(() => move("reviewing"), 1400);
      }}
      suggestion={{
        title: actions.find((action) => action.id === current.action)!.title,
        segments: current.segments,
      }}
      selection={{ start: current.start, end: current.end }}
      decisions={sample ? sampleDecisions : decisions}
      onDecisionsChange={setDecisions}
      onApply={(next, at) => {
        setPrevious(edited);
        setEdited(text.slice(0, at.start) + next + text.slice(at.end));
        move("applied");
      }}
      onUndo={
        undo
          ? () => {
              setEdited(previous);
              setPrevious(null);
              move("idle");
            }
          : undefined
      }
      onDismiss={() => {
        clearTimeout(answer.current);
        move("idle");
      }}
      labels={{ region: t("ملخص الإقفال", "Close summary") }}
    >
      <p ref={summary}>{text}</p>
    </SuggestedEdits>
  );
}
