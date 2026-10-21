import type { AnchorHTMLAttributes } from "react";
import { routePath } from "./site-routes";
import type { SiteRoute } from "./site-routes";
export type Navigate = (route: SiteRoute) => void;
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
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank"
        )
          return;
        event.preventDefault();
        navigate(route);
      }}
    />
  );
}
