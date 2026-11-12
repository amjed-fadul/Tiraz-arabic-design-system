import type { ReactNode } from "react";
import { CopyControl } from "../CopyControl";
import type { Language } from "../i18n";
import { words } from "../i18n";

function Value({
  label,
  value,
  caption,
  language,
}: {
  label: string;
  value: string;
  caption: string;
  language: Language;
}) {
  if (!value)
    return (
      <span className="token-value" role="cell" data-label={label}>
        <span className="token-value-text">—</span>
      </span>
    );
  return (
    <span className="token-value" role="cell" data-label={label}>
      <span
        className="token-swatch"
        style={{ backgroundColor: value }}
        aria-hidden="true"
      />
      <code className="token-value-text" dir="ltr">
        {value}
      </code>
      <CopyControl
        text={value}
        caption={caption}
        language={language}
        iconOnly
        inlineFeedback={false}
      />
    </span>
  );
}

export function TokenRow({
  name,
  light,
  dark,
  use,
  badge,
  language,
}: {
  name: string;
  light: string;
  dark: string;
  use: string;
  badge?: ReactNode;
  language: Language;
}) {
  const t = words(language);
  return (
    <div className="token-row" role="row">
      <span className="token-name" role="cell">
        <code dir="ltr">{name}</code>
        <CopyControl
          text={name}
          caption={t(`انسخ ${name}`, `Copy ${name}`)}
          language={language}
          iconOnly
          inlineFeedback={false}
        />
      </span>
      <Value
        label={t("فاتح", "Light")}
        value={light}
        language={language}
        caption={t(`انسخ قيمة ${name} الفاتحة`, `Copy ${name} light value`)}
      />
      <Value
        label={t("داكن", "Dark")}
        value={dark}
        language={language}
        caption={t(`انسخ قيمة ${name} الداكنة`, `Copy ${name} dark value`)}
      />
      <span className="token-use" role="cell">
        <span>{use}</span>
        {badge}
      </span>
    </div>
  );
}

export function TokenTable({
  language,
  header = true,
  label,
  children,
}: {
  language: Language;
  header?: boolean;
  label: string;
  children: ReactNode;
}) {
  const t = words(language);
  return (
    <div className="token-table" role="table" aria-label={label}>
      {header && (
        <div className="token-row token-header" role="row">
          <span role="columnheader">{t("الرمز", "Token")}</span>
          <span role="columnheader">{t("فاتح", "Light")}</span>
          <span role="columnheader">{t("داكن", "Dark")}</span>
          <span role="columnheader">{t("الاستخدام", "Use for")}</span>
        </div>
      )}
      {children}
    </div>
  );
}
