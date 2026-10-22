import { useId } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";

export type TableProps = ComponentPropsWithRef<"table"> & {
  caption?: ReactNode;
  containerProps?: ComponentPropsWithRef<"div">;
};
/** Native table with a keyboard-accessible horizontal scroll container. */
export function Table({
  caption,
  containerProps,
  className = "",
  children,
  ...props
}: TableProps) {
  const captionId = useId();
  const hasCaption =
    caption !== undefined && caption !== null && caption !== "";
  const labelledBy =
    props["aria-labelledby"] ||
    (!props["aria-label"] && hasCaption ? captionId : undefined);
  const label = props["aria-label"];
  return (
    <div
      role={labelledBy || label ? "region" : "group"}
      aria-labelledby={labelledBy}
      aria-label={label}
      tabIndex={0}
      {...containerProps}
      className={`tz-table-container ${containerProps?.className ?? ""}`}
    >
      <table {...props} className={`tz-table ${className}`}>
        {hasCaption && <caption id={captionId}>{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
export function TableHeader(props: ComponentPropsWithRef<"thead">) {
  return <thead {...props} />;
}
export function TableBody(props: ComponentPropsWithRef<"tbody">) {
  return <tbody {...props} />;
}
export function TableRow(props: ComponentPropsWithRef<"tr">) {
  return <tr {...props} />;
}
export function TableHead({
  scope = "col",
  ...props
}: ComponentPropsWithRef<"th">) {
  return <th scope={scope} {...props} />;
}
export function TableCell(props: ComponentPropsWithRef<"td">) {
  return <td {...props} />;
}
