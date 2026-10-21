import { Check, Clock, TriangleAlert, X } from "lucide-react";
import { approvalRequestKey } from "./approval-request";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, ReactNode } from "react";
import { AIMark } from "./AIMark";
import { Alert } from "./Alert";
import { DecisionBar } from "./DecisionBar";
import type { DecisionAction } from "./DecisionBar";
import { StatusPill } from "./StatusPill";
import { Tray } from "./Tray";
import { approvalCardCopy } from "./decision-copy";
import { useSystem } from "./useSystem";
import { useChanged } from "./useChanged";
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
/** Every built-in string the card shows; `labels` overrides any of them. */
export interface ApprovalCardLabels {
  target: string;
  oneTime: string;
  recording: string;
  failed: string;
  retryHint: string;
  approved: string;
  rejected: string;
  expired: string;
  /** The note `irreversible={true}` shows. */
  irreversible: string;
  /** The status pill while the request waits. */
  needsYou: string;
  /** The card's description: approval records a decision, nothing more. */
  scope: string;
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
  /** Who or what the action affects, with amounts, as a compact table. */
  impact?: readonly {
    id: string;
    label: ReactNode;
    value?: ReactNode;
    note?: ReactNode;
  }[];
  /** True shows the default note in the attention color; a node replaces it. */
  irreversible?: boolean | ReactNode;
  /** Lets Ctrl or Cmd+Enter approve, unless the request is also irreversible. */
  reversible?: boolean;
  /** The host's expiry text. The card runs no clock of its own. */
  expiryLabel?: ReactNode;
  /** The host's word that the request lapsed. A decision in flight is aborted. */
  expired?: boolean;
  /** An optional middle action, such as viewing the messages. */
  secondaryAction?: { label: ReactNode; onSelect(): void };
  /** Host-formatted time after the approved receipt, such as «قبل دقيقة». */
  receiptTime?: ReactNode;
  /** Names the agent that asks, under the title. */
  agent?: ReactNode;
  /** The title's level; 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<ApprovalCardLabels>;
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}
/** What a card shows beyond its request; ApprovalFlow's `approval` returns it. */
export type ApprovalDetails = Pick<
  ApprovalCardProps,
  | "impact"
  | "irreversible"
  | "reversible"
  | "expiryLabel"
  | "expired"
  | "secondaryAction"
  | "receiptTime"
  | "labels"
>;
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
  impact,
  irreversible,
  reversible,
  expiryLabel,
  expired = false,
  secondaryAction,
  receiptTime,
  agent,
  headingLevel = 3,
  labels,
  appearance = "card",
}: ApprovalCardProps) {
  const { config } = useSystem(),
    copy = {
      ...approvalCardCopy[config.direction === "rtl" ? "ar" : "en"],
      ...labels,
    },
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
  // A recorded decision stands; otherwise the host's expiry closes the card.
  const closed = decision ?? (expired ? "expired" : null);
  // The receipt folds in and its glyph pops and draws only once the card
  // closes here, never when it mounts closed.
  const changed = useChanged(closed);
  const root = useRef<HTMLDivElement>(null),
    hadFocus = useRef(false);
  // Expiry aborts a decision in flight, so a late answer records nothing.
  const { cancel } = task;
  useLayoutEffect(() => {
    if (expired) cancel();
  }, [expired, cancel]);
  // The actions are gone once the card closes, so focus that went with them
  // moves to the card.
  useLayoutEffect(() => {
    if (
      closed &&
      hadFocus.current &&
      root.current?.ownerDocument.activeElement ===
        root.current?.ownerDocument.body
    )
      root.current?.focus();
  }, [closed]);
  function decide(next: ApprovalDecision) {
    if (closed) return;
    setPending(next);
    void task.run(
      (signal) => onDecision(request, next, { signal }),
      () => setLocal(next),
    );
  }
  const busy = task.state === "submitting" || task.state === "accepted";
  // One live region: the receipt it holds once closed is the visible one.
  const status =
    closed === "approved" ? (
      <>
        {copy.approved}
        {receiptTime != null && (
          <span className="tz-approval-receipt-time"> · {receiptTime}</span>
        )}
      </>
    ) : closed === "rejected" ? (
      copy.rejected
    ) : closed === "expired" ? (
      copy.expired
    ) : busy ? (
      copy.recording
    ) : task.state === "failed" ? (
      copy.failed
    ) : (
      ""
    );
  const actions: DecisionAction[] = [
    {
      id: "reject",
      label: request.rejectLabel,
      shortcut: "Escape",
      loading: task.state === "submitting" && pending === "rejected",
      disabled: busy,
      onSelect: () => decide("rejected"),
    },
    ...(secondaryAction
      ? [
          {
            id: "secondary",
            label: secondaryAction.label,
            onSelect: () => secondaryAction.onSelect(),
          },
        ]
      : []),
    {
      id: "approve",
      label: request.approveLabel,
      tone: "primary",
      // Spec section 8: an irreversible approval needs a click, or Enter or
      // Space on the focused button.
      shortcut: reversible && !irreversible ? "Mod+Enter" : undefined,
      loading: task.state === "submitting" && pending === "approved",
      disabled: busy,
      onSelect: () => decide("approved"),
    },
  ];
  // The approve chord waits again whenever what it approves changes, the
  // impact figures included. Only strings and numbers go into the key: a
  // React element can be circular.
  const prim = (value: unknown) =>
    typeof value === "string" || typeof value === "number" ? value : null;
  const contentKey = JSON.stringify([
    reversible,
    !!irreversible,
    expired,
    impact?.map((row) => [row.id, prim(row.label), prim(row.value)]),
  ]);
  const Heading = `h${headingLevel}` as const;
  const title = (
    <Heading id={`${id}-title`} className="tz-approval-title" dir="auto">
      {request.action}
    </Heading>
  );
  const header = (
    <div className="tz-approval-header" data-zone="header">
      {closed ? (
        <span className="tz-decision-icon" aria-hidden="true">
          {closed === "approved" ? (
            <Check size={16} />
          ) : closed === "rejected" ? (
            <X size={16} />
          ) : (
            <Clock size={16} />
          )}
        </span>
      ) : (
        <AIMark />
      )}
      {agent != null ? (
        // Who asks, under what it asks for, so the title keeps its width.
        <div className="tz-approval-heading">
          {title}
          <span className="tz-question-agent">{agent}</span>
        </div>
      ) : (
        title
      )}
      {!closed && <StatusPill state="needs-you" label={copy.needsYou} />}
    </div>
  );
  const paper = (
    <>
      <dl className="tz-decision-facts">
        <div>
          <dt>{copy.target}</dt>
          <dd dir="auto">{request.target}</dd>
        </div>
      </dl>
      {request.details && (
        <p className="tz-decision-details" dir="auto">
          {request.details}
        </p>
      )}
      {!!impact?.length && (
        <table className="tz-approval-impact">
          <tbody>
            {impact.map((row) => (
              <tr key={row.id}>
                <th scope="row" dir="auto">
                  {row.label}
                  {row.note != null && (
                    <span className="tz-approval-impact-note">{row.note}</span>
                  )}
                </th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {request.consequences.length > 0 && (
        <ul className="tz-decision-consequences">
          {request.consequences.map((item, index) => (
            <li key={index} dir="auto">
              {item}
            </li>
          ))}
        </ul>
      )}
      {!!irreversible && (
        <p className="tz-approval-irreversible">
          <TriangleAlert aria-hidden="true" size={15} />
          <span dir="auto">
            {irreversible === true ? copy.irreversible : irreversible}
          </span>
        </p>
      )}
      {task.state === "failed" && !closed && (
        <Alert tone="error" title={copy.retryHint} />
      )}
    </>
  );
  const footer = (
    <>
      <div className="tz-approval-meta" data-zone="meta">
        <span>{copy.oneTime}</span>
        {expiryLabel != null && <span>{expiryLabel}</span>}
        {/* Announced with the card; the decision buttons say the rest. */}
        <span id={`${id}-scope`} className="tz-visually-hidden">
          {copy.scope}
        </span>
      </div>
      {/* No action without a host to record it. */}
      {!closed && typeof onDecision === "function" && (
        <div className="tz-approval-decision" data-zone="decision">
          <DecisionBar actions={actions} scope={root} contentKey={contentKey} />
        </div>
      )}
    </>
  );
  const statusLine = (
    <p
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="tz-decision-status"
    >
      {status}
    </p>
  );
  const rootProps = {
    ref: root,
    tabIndex: -1,
    role: "group",
    "aria-labelledby": `${id}-title`,
    "aria-describedby": `${id}-scope`,
    className: `tz-approval-card ${className}`,
    "data-state": closed ?? task.state,
    "data-appearance": appearance,
    "data-changed": changed || undefined,
    onFocusCapture: () => {
      hadFocus.current = true;
    },
    onBlurCapture: (event: FocusEvent<HTMLDivElement>) => {
      if (
        event.relatedTarget &&
        !event.currentTarget.contains(event.relatedTarget)
      )
        hadFocus.current = false;
    },
  };
  // The paper and the status line sit between the header and the footer in
  // both appearances, so the live region never moves.
  return appearance === "card" ? (
    <Tray {...rootProps} paper={false} header={header} footer={footer}>
      <div className="tz-tray-paper tz-approval-paper" data-zone="paper">
        {paper}
      </div>
      {statusLine}
    </Tray>
  ) : (
    <div {...rootProps}>
      {header}
      <div className="tz-approval-paper" data-zone="paper">
        {paper}
      </div>
      {statusLine}
      <div className="tz-approval-footer">{footer}</div>
    </div>
  );
}
