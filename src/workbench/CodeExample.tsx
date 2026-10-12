import type { Language } from "./i18n";
import { label } from "./i18n";
import { CopyControl } from "./CopyControl";
export function CodeExample({
  code,
  language,
}: {
  code: string;
  language: Language;
}) {
  return (
    <div className="code-example">
      <header>
        <bdi dir="ltr">src/Example.tsx</bdi>
        <CopyControl
          text={code}
          caption={label("copyCode", language)}
          language={language}
        />
      </header>
      <pre
        dir="ltr"
        tabIndex={0}
        role="region"
        aria-label={label("usage", language)}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
