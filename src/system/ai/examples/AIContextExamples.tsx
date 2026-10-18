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
      name: ar ? "فلك سريع" : "Falak Swift",
      provider: ar ? "فلك" : "Falak",
      description: ar
        ? "ردود سريعة ومسودات قصيرة"
        : "Quick replies and short drafts",
      tags: [ar ? "الأسرع" : "Fastest"],
      context: "32k",
      price: ar ? "٠٫٢٥ دولار / مليون رمز" : "$0.25 / M tokens",
    },
    {
      id: "studio-review",
      name: ar ? "فلك متقن" : "Falak Precise",
      provider: ar ? "فلك" : "Falak",
      description: longContent
        ? ar
          ? "يحلّل العقود والتقارير المالية الطويلة بالعربية والإنجليزية ويحافظ على الجداول والأرقام كما هي — suited to quarterly reports and bilingual contracts."
          : "Analyzes long contracts and financial reports in Arabic and English while keeping tables and figures intact — مناسب للتقارير الربعية والعقود ثنائية اللغة."
        : ar
          ? "للمستندات الطويلة وتحليل الجداول"
          : "Long documents and spreadsheet analysis",
      tags: [ar ? "الأدق" : "Most capable"],
      context: "200k",
      price: ar ? "٣ دولارات / مليون رمز" : "$3 / M tokens",
    },
    {
      id: "local-unavailable",
      name: ar ? "مدار الخاص" : "Madar Private",
      provider: ar ? "خوادم مدار" : "Madar servers",
      description: ar
        ? "قيد الصيانة حتى ٢٠ نوفمبر"
        : "Under maintenance until Nov 20",
      disabled: true,
    },
  ];
}
const reply = (ar: boolean, long = false) =>
  ar
    ? `راجعتُ فواتير أكتوبر لشركة مدار: تطابقت ٢١٤ فاتورة مع أوامر الشراء، وتحتاج ٣ فواتير إلى مراجعة لأن مبالغها تختلف عن الإيصالات. أكبر فرق في الفاتورة INV-1043 بقيمة ١٬٢٥٠ ر.س.${long ? " كتب المورّد على الفاتورة: «Partial delivery — second shipment on Nov 20». أقترح تعليق الدفع حتى تتأكد الشحنة الثانية، ثم صرف المبلغ المتبقي وإرفاق إشعار التسليم بأمر الشراء PO-7781." : ""}`
    : `I reviewed Madar’s October invoices: 214 match their purchase orders, and 3 need review because their totals differ from the receipts. The largest gap is 1,250 SAR on invoice INV-1043.${long ? " The supplier’s note on that invoice reads «تم التسليم جزئيًا، والشحنة الثانية تصل في ٢٠ نوفمبر». I suggest holding payment until the second shipment is confirmed, then releasing the balance and attaching the delivery note to PO-7781." : ""}`;
export function AIContextExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  const ar = language === "ar";
  const [model, setModel] = useState("studio-draft"),
    [draft, setDraft] = useState("");
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const models = sampleModels(ar, longContent);
  function append(text: string) {
    setDraft((value) => (value ? `${value}\n${text}` : text));
  }
  return (
    <div className="tz-context-connected">
      <div className="tz-context-controls-row">
        <ModelSelector models={models} value={model} onValueChange={setModel} />
        <ContextMeter
          used={4800}
          capacity={model === "studio-review" ? 200000 : 32000}
          estimated
          details={[
            {
              id: "messages",
              label: ar ? "الرسائل" : "Messages",
              value: 3600,
            },
            {
              id: "instructions",
              label: ar ? "التعليمات" : "Instructions",
              value: 1200,
            },
          ]}
          metadata={
            ar ? "حُدّث بعد آخر رسالة" : "Updated after your last message"
          }
        />
      </div>
      <SelectionActions
        label={ar ? "رد المساعد" : "Assistant reply"}
        actions={[
          {
            id: "draft",
            label: ar ? "إضافة إلى المسودة" : "Use in draft",
            icon: <CornerDownLeft size={14} aria-hidden="true" />,
            onSelect: append,
          },
          {
            id: "copy",
            label: ar ? "نسخ" : "Copy",
            icon: <Copy size={14} aria-hidden="true" />,
            onSelect: (text) => {
              void navigator.clipboard?.writeText(text).catch(() => {});
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
          label={ar ? "محادثة مطابقة الفواتير" : "Invoice reconciliation chat"}
          messages={[
            {
              id: "reconciliation-reply",
              role: "assistant",
              identity: ar ? "مساعد المالية" : "Finance assistant",
              content: <p>{reply(ar, longContent)}</p>,
            },
            ...sent,
          ]}
        />
      </SelectionActions>
      <ChatComposer
        value={draft}
        onValueChange={setDraft}
        label={ar ? "مسودة الرسالة" : "Message draft"}
        placeholder={
          ar
            ? "اكتب ردك أو أضف ما حدّدته من الرد…"
            : "Reply or add selected text…"
        }
        onSubmit={(text) => {
          setSent((items) => [
            ...items,
            {
              id: `sent-${items.length + 1}`,
              role: "user",
              content: <p>{text}</p>,
            },
          ]);
          setDraft("");
        }}
      />
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
      <ModelSelector
        models={sampleModels(ar, longContent)}
        value={value}
        onValueChange={setValue}
        disabled={disabled}
      />
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
        metadata={
          ar ? "حُدّث بعد آخر رسالة" : "Updated after your last message"
        }
      />
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
