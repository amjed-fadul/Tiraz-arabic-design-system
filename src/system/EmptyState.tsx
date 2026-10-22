import type { ReactNode } from "react";
export interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: ReactNode;
  action?: ReactNode;
}
export function EmptyState({
  title,
  description,
  illustration,
  action,
}: EmptyStateProps) {
  return (
    <div className="tz-empty-state">
      {illustration && (
        <div className="tz-empty-illustration" aria-hidden="true">
          {illustration}
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="tz-empty-action">{action}</div>}
    </div>
  );
}
