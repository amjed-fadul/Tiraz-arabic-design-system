import { navigationCatalog } from "./catalog";
import type { ComponentId } from "./catalog";
import { screens } from "../examples/frame/screen";
import type { ScreenSlug } from "../examples/frame/screen";
import type { DocumentationPreferences } from "./storage";

export const illustrationIds = [
  "document-vault",
  "agent-handoff",
  "voice-field",
  "no-records",
  "no-search-results",
  "getting-started",
] as const;
export type IllustrationId = (typeof illustrationIds)[number];
export type SiteRoute =
  | { kind: "library"; category?: string }
  | { kind: "component"; id: ComponentId }
  | { kind: "screen"; slug: ScreenSlug }
  | { kind: "start" }
  | { kind: "illustrations"; id?: IllustrationId }
  | { kind: "not-found" };

export function routePath(route: SiteRoute): string {
  switch (route.kind) {
    case "library":
      return `/library${route.category ? `?category=${encodeURIComponent(route.category)}` : ""}`;
    case "component":
      return `/library/components/${route.id}`;
    case "screen":
      return `/library/screens/${route.slug}`;
    case "start":
      return "/start";
    case "illustrations":
      return `/illustrations${route.id ? `/${route.id}` : ""}`;
    case "not-found":
      return "/not-found";
  }
}
export function readSiteRoute(
  url: URL,
  saved: DocumentationPreferences,
): SiteRoute {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/" && !saved.screen && saved.active === "chat-app")
    return { kind: "library", category: "screens" };
  if (path === "/")
    return saved.screen
      ? { kind: "screen", slug: saved.screen }
      : { kind: "component", id: saved.active };
  if (
    [
      "/library/components/chat-app",
      "/examples/chat-app",
      "/examples/playground/chat-app",
    ].includes(path)
  )
    return { kind: "library", category: "screens" };
  if (path === "/library")
    return {
      kind: "library",
      category: url.searchParams.get("category") || undefined,
    };
  const component = navigationCatalog.find(
    (item) => path === `/library/components/${item.id}`,
  );
  if (component) return { kind: "component", id: component.id };
  if (path === "/library/components/field")
    return { kind: "component", id: "input" };
  const screen = screens.find(
    (item) => path === `/library/screens/${item.slug}`,
  );
  if (screen) return { kind: "screen", slug: screen.slug };
  if (path === "/start" || path === "/docs" || path.startsWith("/docs/"))
    return { kind: "start" };
  if (path === "/illustrations") return { kind: "illustrations" };
  const illustration = illustrationIds.find(
    (id) => path === `/illustrations/${id}`,
  );
  if (illustration) return { kind: "illustrations", id: illustration };
  return { kind: "not-found" };
}
export function destination(route: SiteRoute) {
  return route.kind === "start"
    ? "start"
    : route.kind === "illustrations"
      ? "illustrations"
      : "library";
}
