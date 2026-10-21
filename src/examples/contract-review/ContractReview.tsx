import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, Ref, RefObject } from "react";
import { FolderOpen } from "lucide-react";
import {
  ApprovalCard,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  FileTree,
  Sheet,
  SuggestedEdits,
  approvalRequestKey,
  useSystem,
} from "../../system";
import type {
  ApprovalDecision,
  ApprovalRequest,
  DiffSegment,
  FileTreeNode,
} from "../../system";
import { story } from "../../system/ai/examples/finance-story";
import { diffText } from "../../system/diff-text";
import { formatCount } from "../../system/format";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { recorded, useScreen } from "../frame/screen";
import {
  agreement,
  annex,
  clause,
  figures,
  files,
  messages,
  supplier,
} from "./data";
import type { FileId } from "./data";
import "./contract-review.css";

type Decisions = Record<string, "accepted" | "rejected">;

/** A file's page: its name, what it is, and its text on paper. */
function Page({
  title,
  description,
  readOnly,
  reserve,
  ref,
  children,
}: {
  title: string;
  description: string;
  readOnly?: string;
  /** Room under the text, in px, for a card that floats there. */
  reserve?: number;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <Card ref={ref} className="contract-review-document">
      <CardHeader>
        <div className="contract-review-title">
          <h2>{title}</h2>
          {readOnly && <Badge>{readOnly}</Badge>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent
        style={
          reserve
            ? {
                paddingBlockEnd: `calc(var(--paper-padding-block) + ${reserve}px)`,
              }
            : undefined
        }
      >
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * The review card floats under the clause, in the provider's layer, so the page
 * helps it in two ways. It reserves the card's height under the clause, so the
 * card covers nothing the person needs to read. And when the page moves the
 * clause (a font arriving, the Sidebar toggling, a change of language) it tells
 * the card to measure again, as a window resize does, since the card follows a
 * text range that nothing observes.
 */
function useReviewCard(page: RefObject<HTMLElement | null>, active: boolean) {
  const { container } = useSystem();
  const [reserve, setReserve] = useState(0);
  useEffect(() => {
    const paper = page.current;
    const card = document
      .querySelector('[role="dialog"] h3[tabindex="-1"]')
      ?.closest<HTMLElement>('[role="dialog"]');
    if (!active || !paper || !card) return;
    const sized = new ResizeObserver(([entry]) => {
      const height =
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      setReserve(Number.isFinite(height) ? Math.ceil(height) : 0);
    });
    const measure = () => window.dispatchEvent(new Event("resize"));
    const moved = new ResizeObserver(measure);
    let current = true;
    void document.fonts?.ready.then(() => current && measure());
    sized.observe(card);
    moved.observe(paper);
    return () => {
      current = false;
      sized.disconnect();
      moved.disconnect();
    };
  }, [page, active, container]);
  return reserve;
}

function Review() {
  const { t, language, size, endSide, percent, money, date } = useScreen();
  const { config } = useSystem();
  const filesTitle = useId();
  const sendTitle = useId();
  const [file, setFile] = useState<FileId>("annex");
  const [filesOpen, setFilesOpen] = useState(false);
  const [decisions, setDecisions] = useState<Decisions>({});
  // The edits are in the clause: after Apply or Dismiss, or the send.
  const [applied, setApplied] = useState(false);
  // The send's decision as the host recorded it. It stands for the decisions
  // it was made on: any change to them clears a rejection, and once the send
  // is approved they can no longer change, so the card stays its receipt.
  const [record, setRecord] = useState<ApprovalDecision | null>(null);
  // Going back to review remounts the card, which drops a send in flight.
  const [round, setRound] = useState(0);
  const sent = record === "approved";
  const live = useRef<HTMLSpanElement>(null);
  const annexPage = useRef<HTMLDivElement>(null);
  const toReview = useRef(false);
  const wide = size === "wide";

  // The clause as the assistant rewrote it, its {slots} filled by the frame's
  // formatters.
  const facts: Record<string, string> = Object.fromEntries(
    Object.entries(figures).map(([key, figure]) => [
      key,
      figure.kind === "money"
        ? money(figure.value)
        : figure.kind === "percent"
          ? percent(figure.value)
          : date(figure.value),
    ]),
  );
  const fill = (text: { ar: string; en: string }) =>
    text[language].replace(/\{(\w+)\}/g, (_, key: string) => facts[key] ?? "");
  const segments = clause.flatMap((part): DiffSegment[] =>
    "text" in part
      ? [{ id: part.id, kind: "same" as const, text: part.text[language] }]
      : [
          { id: part.id, kind: "delete" as const, text: fill(part.from) },
          {
            id: `${part.id}-new`,
            kind: "insert" as const,
            text: fill(part.to),
          },
        ],
  );
  const changes = clause.flatMap((part) => ("from" in part ? [part] : []));
  const original = diffText(segments, {});
  // An undecided change keeps the original wording, as a rejected one does.
  const decided = diffText(segments, decisions);
  const waiting = changes.filter((change) => !decisions[change.id]).length;
  const ready = waiting === 0;
  const settled = (decision: "accepted" | "rejected") =>
    Object.fromEntries(changes.map((change) => [change.id, decision]));

  // The approval comes only once every edit has a decision, and holds the
  // clause as decided and the same terms in its impact table.
  const request: ApprovalRequest = {
    id: "send-contract",
    action: t(
      `إرسال العقد المعدّل إلى ${supplier.ar}`,
      `Send the revised contract to ${supplier.en}`,
    ),
    target: supplier[language],
    consequences: [
      t(
        "يصل الملحق إلى المورّد بالبند كما قررته.",
        "The Supplier receives the annex with the clause as you decided it.",
      ),
    ],
    details: decided,
    approveLabel: t("أرسل العقد", "Send the contract"),
    rejectLabel: t("لا ترسل", "Don't send"),
  };
  const impact = ["amount", "discount", "due"].flatMap((row) => {
    const change = changes.find((item) => item.row.id === row);
    if (!change) return [];
    const accepted = decisions[change.id] === "accepted";
    return [
      {
        id: row,
        label: change.row.label[language],
        value: fill(accepted ? change.row.set : change.row.kept),
      },
    ];
  });
  const key = approvalRequestKey(request);
  const current = useRef(key);
  useLayoutEffect(() => {
    current.current = key;
  });
  // The receipt is bound to the content the host recorded it for. The
  // decisions are frozen after the send, so only the language can move that
  // content; the record follows it, and the card stays a receipt.
  const value = record
    ? { requestId: request.id, requestKey: key, decision: record }
    : null;

  // Records the decision after the host's moment. If the request's content
  // moved on meanwhile (a decision changed, so the card remounted and aborted
  // this), nothing is recorded.
  async function decide(
    asked: ApprovalRequest,
    decision: ApprovalDecision,
    { signal }: { signal: AbortSignal },
  ) {
    await recorded(signal);
    if (approvalRequestKey(asked) !== current.current)
      throw new DOMException("Cancelled", "AbortError");
    setRecord(decision);
  }
  // Once the send is approved nothing may change what it was approved on.
  function decideEdits(next: Decisions) {
    if (sent) return;
    setDecisions(next);
    setRecord(null);
  }

  // One polite region: the moment the approval is ready, said once.
  const was = useRef(ready);
  useEffect(() => {
    if (was.current === ready) return;
    was.current = ready;
    if (live.current)
      live.current.textContent = ready
        ? t(
            "طلب إرسال العقد جاهز لقرارك",
            "The request to send the contract is ready for your decision",
          )
        : "";
  });

  // The review card floats in the provider's layer, after the page in Tab
  // order, so the panel's button hands it focus.
  const focusReview = () =>
    document
      .querySelector<HTMLElement>('[role="dialog"] h3[tabindex="-1"]')
      ?.focus();
  function review() {
    if (file === "annex") return focusReview();
    toReview.current = true;
    setFile("annex");
  }
  useEffect(() => {
    if (file !== "annex" || !toReview.current) return;
    toReview.current = false;
    focusReview();
  }, [file]);

  function open(id: string) {
    const next = files.find((item) => item.id === id);
    if (!next) return;
    setFile(next.id);
    setFilesOpen(false);
  }
  const nodes: FileTreeNode[] = [
    {
      id: "folder",
      kind: "folder",
      name: supplier[language],
      children: files.map((item) => ({
        id: item.id,
        kind: "file",
        name: item.name[language],
        metadata: item.note[language],
      })),
    },
  ];
  const tree = (
    <FileTree
      nodes={nodes}
      label={t("ملفات العقد", "Contract files")}
      defaultExpandedIds={["folder"]}
      selectedId={file}
      onSelectedChange={open}
    />
  );

  const reviewing = file === "annex" && !(applied || sent);
  const reserve = useReviewCard(annexPage, reviewing);
  const readOnly = t("للقراءة فقط", "Read-only");
  const name = (id: FileId) => files.find((item) => item.id === id)!.name;
  const page =
    file === "annex" ? (
      <Page
        title={name("annex")[language]}
        description={annex.description[language]}
        reserve={reviewing ? reserve : 0}
        ref={annexPage}
      >
        <ol className="contract-review-clauses">
          {annex.clauses.map((item) => (
            <li key={item.id}>
              <h3>{item.title[language]}</h3>
              {"text" in item ? (
                <p>{item.text[language]}</p>
              ) : (
                <SuggestedEdits
                  status={applied || sent ? "applied" : "reviewing"}
                  actions={[]}
                  onAction={() => {}}
                  suggestion={{
                    title: t("بند شروط الدفع", "Payment terms clause"),
                    segments,
                  }}
                  selection={{ start: 0, end: original.length }}
                  decisions={decisions}
                  onDecisionsChange={decideEdits}
                  // Apply settles what is undecided as rejected, and Dismiss
                  // rejects every change; both put the decided text in the
                  // clause.
                  onApply={() => {
                    decideEdits({ ...settled("rejected"), ...decisions });
                    setApplied(true);
                  }}
                  onDismiss={() => {
                    decideEdits(settled("rejected"));
                    setApplied(true);
                  }}
                  // Undo goes back to reviewing, and a send that waited on the
                  // host is dropped. There is no way back once it is approved.
                  onUndo={
                    sent
                      ? undefined
                      : () => {
                          setApplied(false);
                          setRecord(null);
                          setRound((count) => count + 1);
                        }
                  }
                  labels={{
                    region: t("بند شروط الدفع", "Payment terms clause"),
                  }}
                >
                  <p>{applied || sent ? decided : original}</p>
                </SuggestedEdits>
              )}
            </li>
          ))}
        </ol>
      </Page>
    ) : file === "agreement" ? (
      <Page
        title={name("agreement")[language]}
        description={agreement.description[language]}
        readOnly={readOnly}
      >
        <ol className="contract-review-clauses">
          {agreement.clauses.map((item) => (
            <li key={item.id}>
              <h3>{item.title[language]}</h3>
              <p>{item.text[language]}</p>
            </li>
          ))}
        </ol>
      </Page>
    ) : (
      <Page
        title={name("messages")[language]}
        description={messages.description[language]}
        readOnly={readOnly}
      >
        <ul className="contract-review-thread">
          {messages.thread.map((item) => (
            <li key={item.id}>
              <p className="contract-review-from">
                <strong>{item.from[language]}</strong>
                <time dateTime={item.on}>{date(item.on)}</time>
              </p>
              <p>{fill(item.text)}</p>
            </li>
          ))}
        </ul>
      </Page>
    );

  // Until every change has a decision there is nothing to approve, and the
  // panel says how many wait.
  const waits = (
    <section aria-labelledby={sendTitle} className="contract-review-wait">
      <h2 id={sendTitle}>{t("إرسال العقد", "Send the contract")}</h2>
      <p>
        {formatCount(waiting, "edit", config)}{" "}
        {t("بانتظار قرارك", "waiting for your decision")}
      </p>
      <p className="contract-review-hint">
        {t(
          "يظهر طلب الإرسال بعد أن تقرّر في كل تعديل.",
          "The send request appears once you've decided on every edit.",
        )}
      </p>
      <Button variant="secondary" size="sm" onClick={review}>
        {t("راجع التعديلات", "Review the edits")}
      </Button>
    </section>
  );
  const approval = (
    <ApprovalCard
      headingLevel={2}
      appearance={wide ? "plain" : "card"}
      request={request}
      impact={impact}
      resetKey={round}
      irreversible={t(
        "لا يمكن استرجاع العقد بعد إرساله.",
        "A sent contract can't be recalled.",
      )}
      agent={story.agents.finance[language]}
      receiptTime={t("الآن", "just now")}
      value={value}
      onDecision={decide}
    />
  );

  return (
    <>
      <ScreenHeader
        actions={
          wide ? undefined : (
            <Sheet
              open={filesOpen}
              onOpenChange={setFilesOpen}
              side={endSide}
              title={t("الملفات", "Files")}
              description={t(
                `اختر ملفًا من ملفات ${supplier.ar}.`,
                `Choose a file from ${supplier.en}'s files.`,
              )}
              closeLabel={t("إغلاق الملفات", "Close files")}
              trigger={
                <Button variant="secondary">
                  <FolderOpen size={16} aria-hidden="true" />
                  {t("الملفات", "Files")}
                </Button>
              }
            >
              {tree}
            </Sheet>
          )
        }
      />
      <span
        ref={live}
        className="tz-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      <div className="contract-review-layout">
        <div className="contract-review-main">
          {page}
          {!wide &&
            (ready ? (
              approval
            ) : (
              <Card>
                <CardContent>{waits}</CardContent>
              </Card>
            ))}
        </div>
        {wide && (
          <div className="contract-review-panel">
            <Card>
              <CardContent className="contract-review-panel-body">
                <section aria-labelledby={filesTitle}>
                  <h2 id={filesTitle} className="contract-review-subtitle">
                    {t("الملفات", "Files")}
                  </h2>
                  {tree}
                </section>
                <div className="contract-review-send">
                  {ready ? approval : waits}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

export function ContractReview() {
  return (
    <ScreenFrame slug="contract-review">
      <div className="contract-review">
        <Review />
      </div>
    </ScreenFrame>
  );
}
