import { useState, useSyncExternalStore } from "react";
import { Chip } from "../../index";

function subscribeToHash(change: () => void) {
  window.addEventListener("hashchange", change);
  return () => window.removeEventListener("hashchange", change);
}
const readHash = () => window.location.hash;
const serverHash = () => "";

export interface ChipExampleProps {
  /** Stable fragment prefix; use a different id for each example on a page. */
  id?: string;
  language?: "ar" | "en";
  behavior?: "filter" | "multiple" | "navigation";
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
}
/** The app owns the choices and results. Chip only renders the native control. */
export function ChipExample({
  id = "chip-example",
  language = "ar",
  behavior = "filter",
  label,
  selected = false,
  disabled = false,
  size = "sm",
}: ChipExampleProps) {
  const t = (ar: string, en: string) => (language === "ar" ? ar : en);
  const [active, setActive] = useState<string[]>(selected ? ["design"] : []);
  const hash = useSyncExternalStore(subscribeToHash, readHash, serverHash);
  const choices = [
    { id: "all", label: t("الكل", "All") },
    { id: "design", label: label || t("التصميم", "Design") },
    { id: "development", label: t("التطوير", "Development") },
  ];
  const page =
    choices.find((choice) => hash === `#${id}-${choice.id}`)?.id ??
    (selected ? "design" : "all");
  const documents = [
    {
      id: "identity",
      category: "design",
      title: t("دليل الهوية", "Brand guide"),
    },
    {
      id: "layout",
      category: "design",
      title: t("تخطيط الواجهة", "Interface layout"),
    },
    {
      id: "setup",
      category: "development",
      title: t("إعداد المشروع", "Project setup"),
    },
  ];
  function choose(id: string) {
    setActive((previous) =>
      id === "all"
        ? []
        : behavior === "multiple"
          ? previous.includes(id)
            ? previous.filter((value) => value !== id)
            : [...previous, id]
          : [id],
    );
  }
  const row = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "var(--space-2)",
  };
  const results = documents.filter(
    (item) => active.length === 0 || active.includes(item.category),
  );
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-5)",
        inlineSize: "100%",
        maxInlineSize: "36rem",
      }}
    >
      {behavior === "navigation" ? (
        <>
          <nav aria-label={t("أقسام المشروع", "Project sections")} style={row}>
            {choices.map((choice) => (
              <Chip
                key={choice.id}
                href={`#${id}-${choice.id}`}
                selected={page === choice.id}
                aria-current="location"
                disabled={disabled}
                size={size}
              >
                {choice.label}
              </Chip>
            ))}
          </nav>
          {choices.map((choice) => (
            <section
              key={choice.id}
              id={`${id}-${choice.id}`}
              tabIndex={-1}
              style={{
                padding: "var(--space-4)",
                background: "var(--surface)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-item)",
                scrollMarginBlockStart: "var(--space-8)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "var(--text-body)",
                  fontWeight: "var(--weight-semibold)",
                }}
              >
                {choice.label}
              </h3>
              <ul>
                {documents
                  .filter(
                    (item) =>
                      choice.id === "all" || item.category === choice.id,
                  )
                  .map((item) => (
                    <li key={item.id}>{item.title}</li>
                  ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <>
          <div
            role="group"
            aria-label={t("تصفية المستندات", "Filter documents")}
            style={row}
          >
            {choices.map((choice) => (
              <Chip
                key={choice.id}
                selected={
                  choice.id === "all"
                    ? active.length === 0
                    : active.includes(choice.id)
                }
                disabled={disabled}
                size={size}
                onClick={() => choose(choice.id)}
              >
                {choice.label}
              </Chip>
            ))}
          </div>
          <ul
            aria-label={t("المستندات", "Documents")}
            style={{
              display: "grid",
              gap: "var(--space-3)",
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {results.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: "var(--space-4)",
                  background: "var(--surface)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-item)",
                }}
              >
                {item.title}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
