import { Check, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { ApprovalCard } from "./ApprovalCard";
import { approvalRequestKey } from "./approval-request";
import type {
  ApprovalCardProps,
  ApprovalDetails,
  ApprovalRecord,
  ApprovalRequest,
} from "./ApprovalCard";
import { Tray } from "./Tray";
import { approvalCardCopy, approvalFlowCopy } from "./decision-copy";
import { useSystem } from "./useSystem";
import { useArrivals } from "./useArrivals";
import { numberLocale } from "./config";
export type { ApprovalRecord } from "./ApprovalCard";
/** Every built-in string the flow shows; `labels` overrides any of them. */
export interface ApprovalFlowLabels {
  /** «الطلب ١ من ٢». The digits arrive formatted for the page's numerals. */
  position: (current: string, total: string) => string;
  /** Names the list of decisions already recorded. */
  history: string;
  /** Shown, and announced after the last decision, once all are decided. */
  allDecided: string;
  /** Shown when there are no requests. */
  none: string;
}
export interface ApprovalFlowProps {
  label: string;
  requests: readonly ApprovalRequest[];
  onDecision: ApprovalCardProps["onDecision"];
  value?: readonly ApprovalRecord[];
  onValueChange?: (decisions: readonly ApprovalRecord[]) => void;
  resetKey?: string | number;
  className?: string;
  /** What each request's card shows beyond the request itself. */
  approval?: (request: ApprovalRequest) => ApprovalDetails | undefined;
  labels?: Partial<ApprovalFlowLabels>;
  /** Its card's title level; 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** "card" puts the whole flow in one tray, its card plain inside. */
  appearance?: "card" | "plain";
}
/** Short inline composition. Hosts independently authorize and execute actions. */
export function ApprovalFlow(props: ApprovalFlowProps) {
  return <ApprovalFlowInstance key={props.resetKey} {...props} />;
}
function ApprovalFlowInstance({
  label,
  requests,
  onDecision,
  value,
  onValueChange,
  className = "",
  approval,
  labels,
  headingLevel = 3,
  appearance = "card",
}: ApprovalFlowProps) {
  const schemaKey = JSON.stringify(requests.map(approvalRequestKey));
  const [history, setHistory] = useState<{
    schemaKey: string;
    records: readonly ApprovalRecord[];
  }>({ schemaKey, records: [] });
  const { config } = useSystem(),
    language = config.direction === "rtl" ? "ar" : "en",
    copy = { ...approvalFlowCopy[language], ...labels };
  // A decision reads in its own card's words.
  const decided = (record: ApprovalRecord, request: ApprovalRequest) => {
    const words = {
      ...approvalCardCopy[language],
      ...approval?.(request)?.labels,
    };
    return record.decision === "approved" ? words.approved : words.rejected;
  };
  const validRecord = (record: ApprovalRecord) =>
    requests.some(
      (request) =>
        request.id === record.requestId &&
        approvalRequestKey(request) === record.requestKey,
    );
  const local =
    history.schemaKey === schemaKey
      ? history.records
      : history.records.filter(validRecord);
  // Adjust this instance's history before rendering a changed proposal, so an
  // invalidated decision cannot resurface if the old content later returns.
  if (history.schemaKey !== schemaKey)
    setHistory({ schemaKey, records: local });
  const records = (value ?? local).filter(validRecord);
  // Decisions on the first render are history; only a receipt recorded later
  // rises in and draws its mark, until its entrance finishes.
  const arrivals = useArrivals(records.map((record) => record.requestKey));
  const latest = useRef({ records, value, onValueChange });
  useLayoutEffect(() => {
    latest.current = { records, value, onValueChange };
  });
  const current = requests.find(
    (request) =>
      !records.some(
        (record) => record.requestKey === approvalRequestKey(request),
      ),
  );
  const position = current ? requests.indexOf(current) + 1 : requests.length;
  const digits = new Intl.NumberFormat(numberLocale(config), {
      useGrouping: false,
    }),
    place = copy.position(
      digits.format(position),
      digits.format(requests.length),
    );
  const last = records.at(-1);
  const lastRequest = last
    ? requests.find(
        (request) => approvalRequestKey(request) === last.requestKey,
      )
    : undefined;
  const acceptedAnnouncement =
    last && lastRequest
      ? `${decided(last, lastRequest)}: ${lastRequest.action} · ${lastRequest.target}. ${current ? place : copy.allDecided}`
      : "";
  const root = useRef<HTMLDivElement>(null),
    focused = useRef(false),
    previous = useRef(current ? approvalRequestKey(current) : null);
  const currentKey = current ? approvalRequestKey(current) : null;
  useLayoutEffect(() => {
    if (previous.current !== currentKey && focused.current) {
      const doc = root.current?.ownerDocument;
      if (
        doc?.activeElement === doc?.body ||
        root.current?.contains(doc?.activeElement ?? null)
      )
        (
          root.current?.querySelector<HTMLElement>(".tz-approval-card") ??
          root.current
        )?.focus();
    }
    previous.current = currentKey;
  }, [currentKey]);
  const progress = (
    <div className="tz-question-progress">
      <p className="tz-decision-position">{place}</p>
      <span className="tz-question-steps" aria-hidden="true">
        {requests.map((request) => {
          const record = records.find(
            (item) => item.requestKey === approvalRequestKey(request),
          );
          return (
            <span
              key={request.id}
              data-state={
                record
                  ? record.decision === "approved"
                    ? "done"
                    : "skipped"
                  : request === current
                    ? "current"
                    : "upcoming"
              }
            />
          );
        })}
      </span>
    </div>
  );
  const body = (
    <>
      {records.length > 0 && (
        <ol className="tz-decision-history" aria-label={copy.history}>
          {requests.flatMap((request) => {
            const record = records.find(
              (item) => item.requestKey === approvalRequestKey(request),
            );
            return record
              ? [
                  <li
                    key={request.id}
                    data-decision={record.decision}
                    data-changed={
                      arrivals.fresh(record.requestKey) || undefined
                    }
                    onAnimationEnd={(event) => {
                      if (event.target === event.currentTarget)
                        arrivals.settle(record.requestKey);
                    }}
                  >
                    <span className="tz-decision-mark" aria-hidden="true">
                      {record.decision === "approved" ? (
                        <Check size={12} strokeWidth={2.5} />
                      ) : (
                        <X size={12} strokeWidth={2.5} />
                      )}
                    </span>
                    <bdi>
                      {request.action} · {request.target}
                    </bdi>
                    <span>{decided(record, request)}</span>
                  </li>,
                ]
              : [];
          })}
        </ol>
      )}
      {current ? (
        <ApprovalCard
          key={currentKey}
          request={current}
          {...approval?.(current)}
          appearance="plain"
          headingLevel={headingLevel}
          value={null}
          onDecision={async (request, decision, context) => {
            await onDecision(request, decision, context);
            if (context.signal.aborted) return;
            const next = [
              ...latest.current.records.filter(
                (record) => record.requestId !== request.id,
              ),
              {
                requestId: request.id,
                requestKey: approvalRequestKey(request),
                decision,
              },
            ];
            if (latest.current.value === undefined)
              setHistory((previous) => ({ ...previous, records: next }));
            latest.current.onValueChange?.(next);
          }}
        />
      ) : (
        <p className="tz-decision-status">
          {requests.length ? copy.allDecided : copy.none}
        </p>
      )}
    </>
  );
  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      tabIndex={-1}
      className={`tz-approval-flow ${className}`}
      data-appearance={appearance}
      onFocusCapture={() => {
        focused.current = true;
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focused.current = false;
      }}
    >
      <span
        className="tz-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {acceptedAnnouncement}
      </span>
      {appearance === "card" ? (
        <Tray header={progress}>{body}</Tray>
      ) : (
        <>
          {progress}
          {body}
        </>
      )}
    </div>
  );
}
