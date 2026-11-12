import type { Localized } from "../i18n";
import type { SiteRoute } from "../site-routes";

export interface FoundationEntry {
  key: string;
  /** [Arabic, English] */
  name: Localized;
  route: SiteRoute;
}

/** The Foundations sidebar group; also the Previous/Next order. */
export const foundationOrder: readonly FoundationEntry[] = [
  {
    key: "get-started",
    name: ["ابدأ هنا", "Get started"],
    route: { kind: "foundation", id: "get-started" },
  },
  {
    key: "installation",
    name: ["التثبيت", "Installation"],
    route: { kind: "start" },
  },
  {
    key: "colors",
    name: ["الألوان", "Colors"],
    route: { kind: "foundation", id: "colors" },
  },
  {
    key: "typography",
    name: ["الخطوط", "Typography"],
    route: { kind: "foundation", id: "typography" },
  },
  {
    key: "spacing",
    name: ["المسافات والتخطيط", "Spacing and layout"],
    route: { kind: "foundation", id: "spacing" },
  },
  {
    key: "shape",
    name: ["الأشكال والظلال", "Shape and elevation"],
    route: { kind: "foundation", id: "shape" },
  },
  {
    key: "arabic-rtl",
    name: ["العربية والاتجاه", "Arabic and RTL"],
    route: { kind: "foundation", id: "arabic-rtl" },
  },
  {
    key: "changelog",
    name: ["سجل التغييرات", "Changelog"],
    route: { kind: "changelog" },
  },
];

/** Neighbours of an entry in the sidebar order. */
export function foundationNeighbours(key: string) {
  const index = foundationOrder.findIndex((entry) => entry.key === key);
  return {
    previous: index > 0 ? foundationOrder[index - 1] : undefined,
    next:
      index >= 0 && index < foundationOrder.length - 1
        ? foundationOrder[index + 1]
        : undefined,
  };
}
