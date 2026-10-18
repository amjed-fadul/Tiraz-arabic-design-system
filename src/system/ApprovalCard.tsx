import { Check, ShieldCheck, X } from "lucide-react";
import { approvalRequestKey } from "./approval-request";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Alert } from "./Alert";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { useSystem } from "./useSystem";
import { useDecisionTask } from "./decision-task";
export type ApprovalDecision = "approved" | "rejected";
export interface ApprovalRequest {
  id: string;
  action: string;
  target: string;
  consequences: readonly string[];
  details?: string;
  approveLabel: string;
  rejectLabel: string;
}
export interface ApprovalRecord {
  requestId: string;
  requestKey: string;
  decision: ApprovalDecision;
}
export interface ApprovalCardProps {
  request: ApprovalRequest;
  onDecision: (
    request: ApprovalRequest,
    decision: ApprovalDecision,
    context: { signal: AbortSignal },
  ) => void | Promise<void>;
  /** Controlled accepted decision. Must correspond to this exact request content. */
  value?: ApprovalRecord | null;
  resetKey?: string | number;
  className?: string;
}
export function ApprovalCard(props: ApprovalCardProps) {
  return (
    <ApprovalCardInstance
      key={JSON.stringify([approvalRequestKey(props.request), props.resetKey])}
      {...props}
    />
  );
}
function ApprovalCardInstance({
  request,
  onDecision,
  value,
  className = "",
}: ApprovalCardProps) {
  const { config } = useSystem(),
    ar = config.direction === "rtl",
    id = useId();
  const task = useDecisionTask(),
    [local, setLocal] = useState<ApprovalDecision | null>(null),
    [pending, setPending] = useState<ApprovalDecision | null>(null);
  const decision =
    value === undefined
      ? local
      : value?.requestId === request.id &&
          value.requestKey === approvalRequestKey(request)
        ? value.decision
        : null;
  const root = useRef<HTMLDivElement>(null),
    hadFocus = useRef(false);
  useLayoutEffect(() => {
    if (
      decision &&
      hadFocus.current &&
      root.current?.ownerDocument.activeElement ===
        root.current?.ownerDocument.body
    )
      root.current?.focus();
  }, [decision]);
  function decide(next: ApprovalDecision) {
    if (decision) return;
    setPending(next);
    void task.run(
      (signal) => onDecision(request, next, { signal }),
      () => setLocal(next),
    );
  }
  const state = decision ?? task.state;
  const status = decision
    ? decision === "approved"
      ? ar
        ? "تمت الموافقة"
        : "Approved"
      : ar
        ? "تم الرفض"
        : "Rejected"
    : task.state === "submitting" || task.state === "accepted"
      ? ar
        ? "جارٍ تسجيل القرار"
        : "Recording decision"
      : task.state === "failed"
        ? ar
          ? "تعذّر تسجيل القرار. راجع الطلب وحاول مرة أخرى."
          : "Decision was not accepted. Review and try again."
        : "";
  return (
    <div
      ref={root}
      tabIndex={-1}
      role="group"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-scope`}
      className={`tz-approval-card ${className}`}
      data-state={state}
      onFocusCapture={() => {
        hadFocus.current = true;
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          hadFocus.current = false;
      }}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          !decision &&
          task.state !== "submitting"
        ) {
          event.preventDefault();
          event.stopPropagation();
          decide("rejected");
        }
      }}
    >
      <div className="tz-decision-heading">
        <span className="tz-decision-icon" aria-hidden="true">
          {decision === "approved" ? (
            <Check size={16} />
          ) : decision === "rejected" ? (
            <X size={16} />
          ) : (
            <ShieldCheck size={16} />
          )}
        </span>
        <div className="tz-decision-title">
          <h3 id={`${id}-title`} dir="auto">
            {request.action}
          </h3>
          <dl className="tz-decision-facts">
            <div>
              <dt>{ar ? "الهدف" : "Target"}</dt>
              <dd dir="auto">{request.target}</dd>
            </div>
          </dl>
        </div>
        <Badge>{ar ? "لمرة واحدة" : "One-time decision"}</Badge>
      </div>
      {request.details && (
        <p className="tz-decision-details" dir="auto">
          {request.details}
        </p>
      )}
      <ul className="tz-decision-consequences">
        {request.consequences.map((item, index) => (
          <li key={index} dir="auto">
            {item}
          </li>
        ))}
      </ul>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tz-decision-status"
      >
        {status}
      </p>
      {task.state === "failed" && !decision && (
        <Alert
          tone="error"
          title={
            ar ? "يمكنك إعادة المحاولة أو الرفض." : "You can retry or reject."
          }
        />
      )}
      <div className="tz-decision-footer">
        {/* Announced with the card; the decision buttons say the rest. */}
        <p id={`${id}-scope`} className="tz-visually-hidden">
          {ar
            ? "الموافقة تخصّ هذا الطلب وحده، ويتولّى التطبيق تنفيذه."
            : "Approval records a decision for this request only. Execution belongs to the host."}
        </p>
        {!decision && (
          <div className="tz-decision-actions">
            <Button
              variant="secondary"
              state={
                task.state === "submitting" && pending === "rejected"
                  ? "loading"
                  : "idle"
              }
              disabled={
                task.state === "submitting" || task.state === "accepted"
              }
              onClick={() => decide("rejected")}
            >
              {request.rejectLabel}
              <kbd className="tz-kbd" aria-hidden="true">
                Esc
              </kbd>
            </Button>
            <Button
              variant="primary"
              state={
                task.state === "submitting" && pending === "approved"
                  ? "loading"
                  : "idle"
              }
              disabled={
                task.state === "submitting" || task.state === "accepted"
              }
              onClick={() => decide("approved")}
            >
              {request.approveLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
