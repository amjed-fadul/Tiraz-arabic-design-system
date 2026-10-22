import type { ApprovalRequest } from "./ApprovalCard";
/** Content, including the stable ID, binds a decision to one concrete proposal. */
export function approvalRequestKey(request: ApprovalRequest) {
  return JSON.stringify([
    request.id,
    request.action,
    request.target,
    request.consequences,
    request.details ?? "",
    request.approveLabel,
    request.rejectLabel,
  ]);
}
