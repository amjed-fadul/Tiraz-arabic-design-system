import type { AnchorHTMLAttributes } from "react";
import { routePath } from "./site-routes";
import type { SiteRoute } from "./site-routes";
import { siteLinkProps, type Navigate } from "./site-link-props";
export type { Navigate } from "./site-link-props";
export function SiteLink({
  route,
  navigate,
  onClick,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  route: SiteRoute;
  navigate: Navigate;
}) {
  return (
    <a
      {...props}
      href={routePath(route)}
      onClick={(event) => {
        onClick?.(event);
        siteLinkProps(route, navigate).onClick(event);
      }}
    />
  );
}
