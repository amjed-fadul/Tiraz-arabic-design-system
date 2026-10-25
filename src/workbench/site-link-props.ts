import type { MouseEvent } from "react";
import { routePath, type SiteRoute } from "./site-routes";
export type Navigate = (route: SiteRoute) => void;
/** Keep browser navigation for modifiers, downloads and non-current targets. */
export function siteLinkProps(route: SiteRoute, navigate: Navigate) {
  return {
    href: routePath(route),
    onClick(event: MouseEvent<HTMLAnchorElement>) {
      const { target } = event.currentTarget;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (target && target !== "_self") ||
        event.currentTarget.hasAttribute("download")
      )
        return;
      event.preventDefault();
      navigate(route);
    },
  };
}
