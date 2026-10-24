import { navigationGroups, nestedParts } from "./catalog";
import { libraryEntries } from "./library-entries";
import type { LibraryEntry } from "./library-entries";
import { illustrations } from "./illustrations";
import { localize } from "./i18n";
import type { Language, Localized } from "./i18n";
import type { SiteRoute } from "./site-routes";

export type NavigationSection =
  "screens" | "components" | "ai" | "illustrations";
export const sectionNames: Record<NavigationSection, Localized> = {
  screens: ["شاشات", "Screens"],
  components: ["المكوّنات", "Components"],
  ai: ["واجهات المساعد", "AI interfaces"],
  illustrations: ["الرسوم التوضيحية", "Illustrations"],
};
const aiGroups = new Set(["ask", "delegate", "create", "understand"]);
export function entrySection(entry: LibraryEntry): NavigationSection {
  if (entry.category === "screens" || entry.category === "illustrations")
    return entry.category;
  return aiGroups.has(entry.category) ? "ai" : "components";
}
export const navigationEntries: readonly LibraryEntry[] = [
  ...libraryEntries,
  ...illustrations.map((item) => ({
    key: item.id,
    name: item.name,
    description: item.description,
    category: "illustrations",
    route: { kind: "illustrations", id: item.id } as SiteRoute,
  })),
];
export function navigationSection(
  route: SiteRoute,
): NavigationSection | undefined {
  if (route.kind === "screen") return "screens";
  if (route.kind === "illustrations") return "illustrations";
  if (route.kind === "library")
    return route.category === "screens"
      ? "screens"
      : route.category === "ai" || aiGroups.has(route.category ?? "")
        ? "ai"
        : "components";
  if (route.kind !== "component") return undefined;
  const parent = nestedParts[route.id as keyof typeof nestedParts] ?? route.id;
  const entry = libraryEntries.find((item) => item.key === parent);
  return entry ? entrySection(entry) : "components";
}
export function sectionEntries(section: NavigationSection, language: Language) {
  const entries = navigationEntries.filter(
    (item) => entrySection(item) === section,
  );
  return section === "components"
    ? entries.sort((a, b) =>
        localize(a.name, language).localeCompare(
          localize(b.name, language),
          language,
        ),
      )
    : entries;
}
export function galleryEntries(
  category: string | undefined,
  language: Language,
) {
  if (!category || category === "components")
    return sectionEntries("components", language);
  if (category === "ai" || category === "screens")
    return sectionEntries(category, language);
  if (category === "all") return libraryEntries;
  return navigationGroups.some((group) => group.id === category)
    ? libraryEntries.filter((item) => item.category === category)
    : sectionEntries("components", language);
}
export function galleryName(category: string | undefined): Localized {
  if (!category || category === "components") return sectionNames.components;
  if (category === "ai" || category === "screens")
    return sectionNames[category];
  if (category === "all") return ["كل المكتبة", "All items"];
  return (
    navigationGroups.find((group) => group.id === category)?.name ??
    sectionNames.components
  );
}
const aliases: Record<string, string[]> = {
  button: ["buttons", "action", "زر", "ازرار", "إجراء"],
  badge: [
    "chip",
    "chips",
    "pill",
    "status",
    "tag",
    "شارة",
    "حالة",
    "وسم",
    "وسوم",
  ],
  "tag-input": ["chip", "chips", "tag", "tags", "pill", "وسم", "وسوم"],
  input: ["text field", "textfield", "حقل", "حقل نص"],
  tabs: ["tab", "تبويب", "تبويبات"],
  "date-picker": ["calendar", "date", "تقويم", "تاريخ"],
  modal: ["dialog", "نافذة", "حوار"],
};
const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}|ـ/gu, "")
    .toLocaleLowerCase()
    .trim();
export function searchEntries(query: string, language: Language) {
  const needle = normalize(query);
  if (!needle) return [];
  const compact = (value: string) => value.replace(/[\s-]/g, "");
  return navigationEntries
    .map((item) => {
      const names = [...item.name, item.key].map(normalize);
      const terms = (aliases[item.key] ?? []).map(normalize);
      const score = names.some(
        (value) => value === needle || compact(value) === compact(needle),
      )
        ? 0
        : names.some((value) => value.startsWith(needle))
          ? 1
          : terms.includes(needle)
            ? 2
            : names.some((value) => value.includes(needle))
              ? 3
              : terms.some((value) => value.includes(needle))
                ? 4
                : item.description.some((value) =>
                      normalize(value).includes(needle),
                    )
                  ? 5
                  : 6;
      return { item, score };
    })
    .filter((result) => result.score < 6)
    .sort(
      (a, b) =>
        a.score - b.score ||
        localize(a.item.name, language).localeCompare(
          localize(b.item.name, language),
          language,
        ),
    )
    .map((result) => result.item);
}
