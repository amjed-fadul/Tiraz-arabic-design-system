import { navigationGroups, nestedParts } from "./catalog";
import { libraryEntries } from "./library-entries";
import type { LibraryEntry } from "./library-entries";
import { illustrations } from "./illustrations";
import { localize } from "./i18n";
import type { Language, Localized } from "./i18n";
import type { SiteRoute } from "./site-routes";

export const essentialIds = [
  "button",
  "input",
  "badge",
  "chip",
  "select",
  "checkbox",
  "radio-group",
  "switch",
  "textarea",
  "tabs",
  "card",
  "avatar",
  "slider",
] as const;
export const livePreviewIds = new Set<string>([...essentialIds, "tag-input"]);
export const essentialsName: Localized = [
  "مكوّنات أساسية",
  "Everyday components",
];

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
  if (category === "essentials")
    return essentialIds.map((id) =>
      libraryEntries.find((item) => item.key === id)!,
    );
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
  if (category === "essentials") return essentialsName;
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
  chip: [
    "chips",
    "filter",
    "filters",
    "category",
    "pill",
    "تصفية",
    "تصنيف",
    "خيارات",
    "وسوم",
  ],
  badge: ["pill", "status", "tag", "شارة", "حالة", "وسم", "وسوم"],
  "tag-input": ["chip", "chips", "tag", "tags", "pill", "وسم", "وسوم"],
  input: ["text field", "textfield", "حقل", "حقل نص"],
  tabs: ["tab", "تبويب", "تبويبات"],
  "date-picker": ["calendar", "date", "تقويم", "تاريخ"],
  modal: ["dialog", "نافذة", "حوار"],
  checkbox: [
    "check",
    "check box",
    "checkboxes",
    "multiple choice",
    "خانة اختيار",
    "اختيار متعدد",
  ],
  "radio-group": [
    "radio",
    "radio buttons",
    "single choice",
    "اختيار واحد",
    "خيار واحد",
  ],
  switch: ["toggle", "toggles", "on off", "تبديل", "تشغيل"],
  select: ["combobox", "picker", "select menu", "اختيار من قائمة"],
  textarea: ["text area", "multiline", "long text", "نص طويل", "متعدد الأسطر"],
  sheet: ["drawer", "side panel", "درج", "لوحة جانبية"],
  dropdown: ["dropdown menu", "action menu", "context menu", "قائمة إجراءات"],
  toast: ["notification", "snackbar", "إشعار", "إشعارات"],
  card: ["cards", "container", "panel", "بطاقة", "بطاقات"],
  "data-table": ["datagrid", "data grid", "spreadsheet", "جدول بيانات"],
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

/** Each entry appears once. Filtering retains the search engine's relevance order. */
export function galleryGroups(
  category: string | undefined,
  language: Language,
  query: string,
) {
  const entries = galleryEntries(category, language);
  if (query.trim()) {
    const allowed = new Set(entries.map((item) => item.key));
    return [
      {
        id: "search",
        title: ["نتائج البحث", "Search results"] as Localized,
        entries: searchEntries(query, language).filter((item) =>
          allowed.has(item.key),
        ),
      },
    ];
  }
  if (!category || category === "components") {
    const essentials = new Set<string>(essentialIds);
    return [
      {
        id: "essentials",
        title: essentialsName,
        entries: galleryEntries("essentials", language),
      },
      ...navigationGroups
        .filter((group) => group.id !== "screens" && !aiGroups.has(group.id))
        .map((group) => ({
          id: group.id,
          title: group.name,
          entries: entries.filter(
            (item) => item.category === group.id && !essentials.has(item.key),
          ),
        })),
    ].filter((group) => group.entries.length > 0);
  }
  if (category === "all")
    return (["screens", "components", "ai"] as const).map((id) => ({
      id,
      title: sectionNames[id],
      entries: entries.filter((item) => entrySection(item) === id),
    }));
  return [{ id: category, title: galleryName(category), entries }];
}
