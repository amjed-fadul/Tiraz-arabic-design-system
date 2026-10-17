import { useState } from "react";
import { Copy, CornerDownLeft, Quote } from "lucide-react";
import {
  ChatComposer,
  ChatThread,
  ContextMeter,
  ModelSelector,
  SelectionActions,
} from "../../index";
import type { ChatMessage, ModelOption } from "../../index";

type Language = "ar" | "en";
function sampleModels(ar: boolean, longContent = false): ModelOption[] {
  return [
    {
      id: "studio-draft",
      name: ar ? "مسودة" : "Draft",
      provider: ar ? "الاستوديو · عينة" : "Studio · sample",
      description: ar
        ? "للملاحظات والردود القصيرة"
        : "For notes and short replies",
      tags: [ar ? "عينة" : "Sample"],
      context: "32k",
      price: ar ? "سعر عينة: ١ وحدة" : "Sample price: 1 credit",
    },
    {
      id: "studio-review",
      name: ar ? "مراجعة" : "Review",
      provider: ar ? "الاستوديو · عينة" : "Studio · sample",
      description: longContent
        ? ar
          ? "وصف طويل للاختبار: مراجعة المستندات المختلطة باللغة العربية والإنجليزية والحفاظ على المسودة الحالية."
          : "Long sample description: review mixed Arabic and English documents while preserving the current draft and selected text."
        : ar
          ? "لمراجعة المستندات الطويلة"
          : "For longer document reviews",
      tags: [ar ? "مراجعة" : "Review"],
      context: "64k",
    },
    {
      id: "local-unavailable",
      name: ar ? "محلي" : "Local",
      provider: ar ? "مساحة العمل · عينة" : "Workspace · sample",
      description: ar
        ? "غير مهيّأ في هذا المثال"
        : "Unavailable in this example",
      disabled: true,
    },
  ];
}
const reply = (ar: boolean, long = false) =>
  ar
    ? `تبدأ خطة Tiraz بمراجعة المحتوى، ثم ترتيب الأولويات. يمكن نقل النص المحدّد إلى المسودة دون تغيير الرد الأصلي.${long ? " نراجع النص العربي والإنجليزي معًا: Draft 2026 — جاهز للمراجعة. اختَر عبارة قصيرة أو فقرة كاملة." : ""}`
    : `The Tiraz plan starts with a content review, followed by priorities. Selected text can be placed in the draft while the original reply stays intact.${long ? " Review Arabic and English together: المسودة جاهزة — Draft 2026. Select a short phrase or a whole paragraph." : ""}`;
export function AIContextExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  const ar = language === "ar";
  const [model, setModel] = useState("studio-draft"),
    [draft, setDraft] = useState(""),
    [result, setResult] = useState("");
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const models = sampleModels(ar, longContent);
  function append(text: string) {
    setDraft((value) => (value ? `${value}\n${text}` : text));
    setResult(
      ar
        ? "أُضيف النص المحدّد إلى المسودة."
        : "Selected text added to the draft.",
    );
  }
  return (
    <div className="tz-context-connected">
      <p className="tz-context-note">
        {ar
          ? "مثال محلي · نماذج وقيم سياق وأسعار عينات؛ لا نشاط شبكة."
          : "Local example · sample models, context values and prices; no network activity."}
      </p>
      <div className="tz-context-controls-row">
        <ModelSelector models={models} value={model} onValueChange={setModel} />
        <ContextMeter
          used={4800}
          capacity={model === "studio-review" ? 64000 : 32000}
          estimated
          details={[
            {
              id: "messages",
              label: ar ? "الرسائل · عينة" : "Messages · sample",
              value: 3600,
            },
            {
              id: "instructions",
              label: ar ? "التعليمات · عينة" : "Instructions · sample",
              value: 1200,
            },
          ]}
          metadata={
            ar
              ? "قيم عينات يزوّدها التطبيق"
              : "Sample values supplied by the application"
          }
        />
      </div>
      <SelectionActions
        label={ar ? "رد قابل للتحديد" : "Selectable reply"}
        actions={[
          {
            id: "draft",
            label: ar ? "إلى المسودة" : "Use in draft",
            icon: <CornerDownLeft size={14} aria-hidden="true" />,
            onSelect: append,
          },
          {
            id: "copy",
            label: ar ? "نسخ" : "Copy",
            icon: <Copy size={14} aria-hidden="true" />,
            onSelect: (text) => {
              void navigator.clipboard.writeText(text).then(
                () =>
                  setResult(
                    ar ? "نُسخ النص المحدّد." : "Selected text copied.",
                  ),
                () =>
                  setResult(
                    ar
                      ? "تعذّر النسخ؛ حدّد النص واستخدم أمر النسخ."
                      : "Copy failed; select the text and use the system copy command.",
                  ),
              );
            },
          },
          {
            id: "quote",
            label: ar ? "اقتباس" : "Quote",
            icon: <Quote size={14} aria-hidden="true" />,
            onSelect: (text) => append(`> ${text}`),
          },
        ]}
      >
        <ChatThread
          label={ar ? "محادثة المثال" : "Example conversation"}
          messages={[
            {
              id: "sample-reply",
              role: "assistant",
              identity: ar ? "المساعد · نص عينة" : "Assistant · sample text",
              content: <p>{reply(ar, longContent)}</p>,
            },
            ...sent,
          ]}
        />
      </SelectionActions>
      <p className="tz-context-note">
        {ar
          ? "حدّد نص الرد. Alt+Enter للإجراءات، والأسهم للتنقّل، وEscape للإغلاق."
          : "Select reply text. Alt+Enter for actions, arrows to navigate, Escape to dismiss."}
      </p>
      <ChatComposer
        value={draft}
        onValueChange={setDraft}
        label={ar ? "مسودة الرسالة" : "Message draft"}
        placeholder={
          ar ? "اكتب أو أضف نصًا محدّدًا…" : "Write or add selected text…"
        }
        onSubmit={(text) => {
          setSent((items) => [
            ...items,
            {
              id: `local-${items.length + 1}`,
              role: "user",
              content: <p>{text}</p>,
            },
          ]);
          setDraft("");
          setResult(
            ar ? "أُضيفت الرسالة محليًا فقط." : "Message added locally only.",
          );
        }}
      />
      <p role="status" className="tz-context-note">
        {result}
      </p>
    </div>
  );
}
export function SelectionActionsExample(props: {
  language?: Language;
  longContent?: boolean;
}) {
  return <AIContextExample {...props} />;
}
export function ModelSelectorExample({
  language = "ar",
  disabled = false,
  longContent = false,
}: {
  language?: Language;
  disabled?: boolean;
  longContent?: boolean;
}) {
  const ar = language === "ar",
    [value, setValue] = useState("studio-draft");
  return (
    <div className="tz-context-example">
      <div className="tz-context-controls-row">
        <ModelSelector
          models={sampleModels(ar, longContent)}
          value={value}
          onValueChange={setValue}
          disabled={disabled}
        />
        <span className="tz-context-note">
          {ar ? "يجيب ضمن هذا المثال" : "answers in this example"}
        </span>
      </div>
      <p className="tz-context-note">
        {ar
          ? "نماذج وأوصاف وأسعار عينات يزوّدها التطبيق."
          : "Application-supplied sample models, descriptions and prices."}
      </p>
    </div>
  );
}
export function ContextMeterExample({
  language = "ar",
  preset = "normal",
  estimated = false,
}: {
  language?: Language;
  preset?: "normal" | "near" | "over" | "zero" | "missing" | "invalid";
  estimated?: boolean;
}) {
  const ar = language === "ar";
  const values = {
    normal: [4800, 20000],
    near: [19400, 20000],
    over: [24000, 20000],
    zero: [0, 0],
    missing: [undefined, undefined],
    invalid: [NaN, -1],
  }[preset];
  return (
    <div className="tz-context-example">
      <ContextMeter
        used={values[0]}
        capacity={values[1]}
        estimated={estimated}
        details={
          preset === "normal"
            ? [
                {
                  id: "instructions",
                  label: ar ? "التعليمات" : "Instructions",
                  value: 800,
                },
                {
                  id: "messages",
                  label: ar ? "الرسائل" : "Messages",
                  value: 4000,
                },
              ]
            : undefined
        }
        metadata={ar ? "قيم عينات فقط" : "Sample values only"}
      />
      <p className="tz-context-note">
        {ar
          ? "الاستخدام والسعة عينات صريحة؛ لا تقدير أو اقتطاع تلقائي."
          : "Usage and capacity are explicit sample values; no automatic estimation or truncation."}
      </p>
    </div>
  );
}
export function ContextMeterStates({
  language = "ar",
}: {
  language?: Language;
}) {
  return (
    <div className="tz-context-example">
      <div className="tz-context-controls-row">
        {(
          ["normal", "near", "over", "zero", "missing", "invalid"] as const
        ).map((preset) => (
          <ContextMeterExample
            key={preset}
            language={language}
            preset={preset}
          />
        ))}
      </div>
      <AIContextExample language={language} />
    </div>
  );
}
