import { useState } from "react";
import {
  Chip,
  FilterBarChip,
  FilterBarRoot,
  FilterBarSearch,
  Input,
} from "../../index";
/** Parts instead of the `search` and `filters` props; the application owns every value. */
export function CompoundFilterBarExample({
  language = "ar",
}: {
  language?: "ar" | "en";
}) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  return (
    <FilterBarRoot
      label={t("تصفية العملاء", "Customer filters")}
      clearLabel={t("مسح الكل", "Clear all")}
      onClearAll={() => {
        setQuery("");
        setActiveOnly(false);
      }}
    >
      <FilterBarSearch>
        <Input
          type="search"
          aria-label={t("البحث في العملاء", "Search customers")}
          placeholder={t("ابحث بالاسم…", "Search by name…")}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </FilterBarSearch>
      <Chip selected={activeOnly} onClick={() => setActiveOnly(!activeOnly)}>
        {t("النشطون فقط", "Active only")}
      </Chip>
      {query && (
        <FilterBarChip
          id="query"
          label={query}
          removeLabel={t("إزالة البحث", "Remove search")}
          onRemove={() => setQuery("")}
        />
      )}
      {activeOnly && (
        <FilterBarChip
          id="active"
          label={t("النشطون فقط", "Active only")}
          removeLabel={t("إزالة النشطين فقط", "Remove active only")}
          onRemove={() => setActiveOnly(false)}
        />
      )}
    </FilterBarRoot>
  );
}
