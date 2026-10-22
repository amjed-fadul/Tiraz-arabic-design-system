import type { ComponentPropsWithRef, ReactNode } from "react";

export type TrayProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** Sits on the tray above the paper: the mark, the task and the status. */
  header?: ReactNode;
  /** Sits on the tray below the paper: meta and decisions. */
  footer?: ReactNode;
  /** False puts the children straight on the tray. */
  paper?: boolean;
  children: ReactNode;
};

/**
 * Tray and paper (Woven spec section 9): what the assistant produced sits on
 * paper; status, meta and decisions sit on the tray around it. Never nest a
 * tray inside a tray.
 */
export function Tray({
  header,
  footer,
  paper = true,
  children,
  className = "",
  ...props
}: TrayProps) {
  return (
    <div {...props} className={`tz-tray ${className}`}>
      {header != null && <div className="tz-tray-header">{header}</div>}
      {paper ? <div className="tz-tray-paper">{children}</div> : children}
      {footer != null && <div className="tz-tray-footer">{footer}</div>}
    </div>
  );
}
