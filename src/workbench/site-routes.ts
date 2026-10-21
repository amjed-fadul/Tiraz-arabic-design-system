import { navigationCatalog } from "./catalog";
import type { ComponentId } from "./catalog";
import { screens } from "../examples/frame/screen";
import type { ScreenSlug } from "../examples/frame/screen";
import type { DocumentationPreferences } from "./storage";

export const guideIds = [
  "introduction",
  "installation",
  "providers",
  "theming",
  "rtl",
  "accessibility",
  "ai",
] as const;
export type GuideId = (typeof guideIds)[number];
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
  | { kind: "docs"; guide: GuideId }
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
    case "docs":
      return route.guide === "introduction" ? "/docs" : `/docs/${route.guide}`;
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
  if (path === "/")
    return saved.screen
      ? { kind: "screen", slug: saved.screen }
      : { kind: "component", id: saved.active };
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
  if (path === "/docs") return { kind: "docs", guide: "introduction" };
  const guide = guideIds.find((id) => path === `/docs/${id}`);
  if (guide) return { kind: "docs", guide };
  if (path === "/illustrations") return { kind: "illustrations" };
  const illustration = illustrationIds.find(
    (id) => path === `/illustrations/${id}`,
  );
  if (illustration) return { kind: "illustrations", id: illustration };
  return { kind: "not-found" };
}
export function destination(route: SiteRoute) {
  return route.kind === "docs"
    ? "docs"
    : route.kind === "illustrations"
      ? "illustrations"
      : "library";
}
