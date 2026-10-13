import { ChevronRight } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
}
export type BreadcrumbsProps = Omit<
  ComponentPropsWithRef<"nav">,
  "children"
> & {
  items: readonly BreadcrumbItem[];
  /** Translated navigation landmark name. */
  label: string;
};
/** Ancestors are native links; the final item is always current-page text. */
export function Breadcrumbs({
  items,
  label,
  className = "",
  ...props
}: BreadcrumbsProps) {
  return (
    <nav
      {...props}
      aria-label={label}
      className={`tz-breadcrumbs ${className}`}
    >
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            {index > 0 && (
              <ChevronRight
                size={14}
                aria-hidden="true"
                className="tz-breadcrumb-separator"
              />
            )}
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
