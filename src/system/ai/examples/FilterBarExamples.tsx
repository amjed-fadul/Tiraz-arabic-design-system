import { useState } from "react";
import { FilterBar, Input, Select, numberLocale, useSystem } from "../../index";
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
  const number = new Intl.NumberFormat(
    numberLocale(useSystem().config, language),
  );
  const [query, setQuery] = useState(initialQuery),
    [kind, setKind] = useState(initialKind);
  const documents = [
    { id: "pricing", name: t("دليل التسعير", "Pricing guide"), kind: "guide" },
    {
      id: "launch",
      name: t("ملاحظات اجتماع الإطلاق", "Launch meeting notes"),
      kind: "note",
    },
    { id: "brand", name: t("دليل الهوية", "Brand guide"), kind: "guide" },
  ];
  const results = documents.filter(
    (doc) =>
      doc.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
      (kind === "all" || doc.kind === kind),
  );
  const n = results.length;
  const count =
    language === "ar"
      ? n === 1
        ? "مستند واحد"
        : n === 2
          ? "مستندان"
          : `${number.format(n)} مستندات`
      : `${n} ${n === 1 ? "document" : "documents"}`;
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
      <p role="status" style={{ margin: 0, color: "var(--text-secondary)" }}>
        {count}
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
            "لا توجد مستندات مطابقة. أزل أحد عوامل التصفية لترى المزيد.",
            "No matching documents. Remove a filter to see more.",
          )}
        </p>
      )}
    </div>
  );
}
