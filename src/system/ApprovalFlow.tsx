import { useLayoutEffect, useRef, useState } from "react";
import { ApprovalCard } from "./ApprovalCard";
import { approvalRequestKey } from "./approval-request";
import type {
  ApprovalCardProps,
  ApprovalRecord,
  ApprovalRequest,
} from "./ApprovalCard";
import { useSystem } from "./useSystem";
export type { ApprovalRecord } from "./ApprovalCard";
export interface ApprovalFlowProps {
  label: string;
  requests: readonly ApprovalRequest[];
  onDecision: ApprovalCardProps["onDecision"];
  value?: readonly ApprovalRecord[];
  onValueChange?: (decisions: readonly ApprovalRecord[]) => void;
  resetKey?: string | number;
  className?: string;
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
}: ApprovalFlowProps) {
  const schemaKey = JSON.stringify(requests.map(approvalRequestKey));
  const [history, setHistory] = useState<{
    schemaKey: string;
    records: readonly ApprovalRecord[];
  }>({ schemaKey, records: [] });
  const { config } = useSystem(),
    ar = config.direction === "rtl";
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
  const last = records.at(-1);
  const lastRequest = last
    ? requests.find(
        (request) => approvalRequestKey(request) === last.requestKey,
      )
    : undefined;
  const acceptedAnnouncement =
    last && lastRequest
      ? `${last.decision === "approved" ? (ar ? "تمت الموافقة" : "Approved") : ar ? "تم الرفض" : "Rejected"}: ${lastRequest.action} · ${lastRequest.target}. ${current ? (ar ? `الطلب ${position} من ${requests.length}` : `Request ${position} of ${requests.length}`) : ar ? "سُجّلت جميع القرارات. لم يُنفّذ أي إجراء." : "All decisions recorded. No actions executed."}`
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
  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      tabIndex={-1}
      className={`tz-approval-flow ${className}`}
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
      <p className="tz-decision-position">
        {ar
          ? `الطلب ${position} من ${requests.length}`
          : `Request ${position} of ${requests.length}`}
      </p>
      {records.length > 0 && (
        <ol
          className="tz-decision-history"
          aria-label={ar ? "القرارات السابقة" : "Prior decisions"}
        >
          {requests.flatMap((request) => {
            const record = records.find(
              (item) => item.requestKey === approvalRequestKey(request),
            );
            return record
              ? [
                  <li key={request.id}>
                    <bdi>
                      {request.action} · {request.target}
                    </bdi>
                    <span>
                      {record.decision === "approved"
                        ? ar
                          ? "تمت الموافقة"
                          : "Approved"
                        : ar
                          ? "تم الرفض"
                          : "Rejected"}
                    </span>
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
          {requests.length
            ? ar
              ? "سُجّلت جميع القرارات. لم يُنفّذ أي إجراء."
              : "All decisions recorded. No actions executed."
            : ar
              ? "لا طلبات للمراجعة."
              : "No requests to review."}
        </p>
      )}
    </div>
  );
}
