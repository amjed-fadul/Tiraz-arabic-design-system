import { useId, useState } from "react";
import { Accordion } from "../system/Accordion";
import { Textarea } from "../system/Textarea";
import { CopyControl } from "./CopyControl";
import { label, words } from "./i18n";
import type { Language } from "./i18n";
import "./prompt-panel.css";

export function PromptPanel({
  prompt,
  language,
}: {
  prompt: string;
  language: Language;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const t = words(language);
  return (
    <section className="agent-section doc-prompt" aria-labelledby={id}>
      <div className="doc-prompt-header">
        <div className="doc-prompt-intro">
          <h2 id={id}>{label("useInApp", language)}</h2>
          <p>
            {t(
              "انسخ الطلب إلى مساعدك البرمجي. يتضمّن إعداداتك الحالية ومثالًا جاهزًا للتعديل.",
              "Copy this prompt into your coding assistant. It includes your current settings and an example to adapt.",
            )}
          </p>
        </div>
        <CopyControl
          iconOnly
          inlineFeedback={false}
          text={prompt}
          onFeedbackChange={(result) => {
            setCopyFailed(result === "failure");
            if (result === "failure") setExpanded("prompt");
          }}
          caption={label("copyPrompt", language)}
          language={language}
        />
      </div>
      {copyFailed && (
        <p className="doc-prompt-error" aria-hidden="true">
          {label("failed", language)}
        </p>
      )}
      <Accordion
        collapsible
        value={expanded}
        onValueChange={setExpanded}
        className="doc-prompt-disclosure"
        items={[
          {
            value: "prompt",
            label: t("راجع الطلب", "Review prompt"),
            content: (
              <Textarea
                className="doc-prompt-text"
                aria-label={t(
                  "الطلب الكامل للمساعد البرمجي",
                  "Full prompt for your coding assistant",
                )}
                readOnly
                value={prompt}
                rows={12}
                dir="ltr"
                lang="en"
                spellCheck={false}
              />
            ),
          },
        ]}
      />
    </section>
  );
}
