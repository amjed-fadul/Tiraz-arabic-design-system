import { useState } from "react";
import { FilterBar, Input, Select } from "../../index";
type Language = "ar" | "en";
export interface FilterBarExampleProps {
  language?: Language;
  initialQuery?: string;
  initialKind?: "all" | "guide" | "note";
  clearAll?: boolean;
}
export function FilterBarExample({
  language = "ar",
  initialQuery = "",
  initialKind = "all",
  clearAll = true,
}: FilterBarExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [query, setQuery] = useState(initialQuery),
    [kind, setKind] = useState(initialKind);
  const documents = [
    { id: "guide", name: t("دليل القراءة", "Reading guide"), kind: "guide" },
    { id: "note", name: t("ملاحظات التصميم", "Design notes"), kind: "note" },
    { id: "rtl", name: t("دليل العربية", "Arabic guide"), kind: "guide" },
  ];
  const results = documents.filter(
    (doc) =>
      doc.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
      (kind === "all" || doc.kind === kind),
  );
  const kindLabel =
    kind === "guide" ? t("أدلة", "Guides") : t("ملاحظات", "Notes");
  return (
    <div
      style={{ display: "grid", gap: 12, inlineSize: "100%", minInlineSize: 0 }}
    >
      <FilterBar
        label={t("تصفية المكتبة", "Library filters")}
        search={
          <Input
            type="search"
            aria-label={t("البحث في المكتبة", "Search library")}
            placeholder={t("ابحث في العناوين…", "Search titles…")}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        }
        filters={[
          ...(query
            ? [
                {
                  id: "query",
                  label: query,
                  removeLabel: t("إزالة البحث", "Remove search"),
                  onRemove: () => setQuery(""),
                },
              ]
            : []),
          ...(kind !== "all"
            ? [
                {
                  id: "kind",
                  label: kindLabel,
                  removeLabel: t("إزالة النوع", "Remove kind"),
                  onRemove: () => setKind("all"),
                },
              ]
            : []),
        ]}
        onClearAll={
          clearAll
            ? () => {
                setQuery("");
                setKind("all");
              }
            : undefined
        }
        clearLabel={t("مسح الكل", "Clear all")}
      >
        <Select
          aria-label={t("نوع المستند", "Document kind")}
          value={kind}
          onValueChange={(next) => setKind(next as typeof kind)}
          options={[
            { value: "all", label: t("كل الأنواع", "All kinds") },
            { value: "guide", label: t("أدلة", "Guides") },
            { value: "note", label: t("ملاحظات", "Notes") },
          ]}
        />
      </FilterBar>
      <p role="status" style={{ margin: 0 }}>
        {t(`${results.length} مستند`, `${results.length} documents`)}
      </p>
      {results.length ? (
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          {results.map((doc) => (
            <li key={doc.id}>{doc.name}</li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0 }}>
          {t(
            "لا توجد نتائج. أزل عامل تصفية لعرض المزيد.",
            "No results. Remove a filter to see more.",
          )}
        </p>
      )}
    </div>
  );
}
