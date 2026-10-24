import { navigationGroups } from "./catalog";
import { screens } from "../examples/frame/screen";
import type { Localized } from "./i18n";
import type { SiteRoute } from "./site-routes";
export interface LibraryEntry {
  key: string;
  name: Localized;
  description: Localized;
  category: string;
  route: SiteRoute;
}
export const libraryEntries = navigationGroups
  .flatMap<LibraryEntry>((group) =>
    group.items.map((item) => ({
      key: item.id,
      name: item.name,
      description: item.description,
      category: group.id,
      route: { kind: "component", id: item.id } as SiteRoute,
    })),
  )
  .concat(
    screens.map((item) => ({
      key: item.slug,
      name: item.name as Localized,
      description: item.description as Localized,
      category: "screens",
      route: { kind: "screen", slug: item.slug } as SiteRoute,
    })),
  );
