import { useEffect, useId, useState } from "react";
import {
  Button,
  ImageResult,
  Sources,
  InlineCitation,
  InsightCards,
  Modal,
  useSystem,
} from "../../index";
import type { ImageResultProps, SourceReference } from "../../index";
import sageImage from "../assets/results/coffee-sage.svg?url&no-inline";
import clayImage from "../assets/results/coffee-clay.svg?url&no-inline";
import nightImage from "../assets/results/coffee-night.svg?url&no-inline";
import { sampleSources } from "./ai-result-samples";

type Language = "ar" | "en";
const images = [
  { id: "sage", src: sageImage, ar: "الأخضر", en: "Sage" },
  { id: "clay", src: clayImage, ar: "الطيني", en: "Clay" },
  { id: "night", src: nightImage, ar: "الليلي", en: "Night" },
];
function usePrefersReducedMotion() {
  const { config } = useSystem();
  return (
    config.reducedMotion ||
    (typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}
export function ImageResultExample({
  language = "ar",
  state = "loaded",
  progress = 42,
  aspectRatio = "landscape",
}: {
  language?: Language;
  state?: ImageResultProps["state"];
  progress?: number;
  aspectRatio?: ImageResultProps["aspectRatio"];
}) {
  const ar = language === "ar",
    [recovered, setRecovered] = useState(false),
    [used, setUsed] = useState(false);
  return (
    <div
      className="tz-ai-results-example"
      style={{
        inlineSize: "100%",
        maxInlineSize: aspectRatio === "portrait" ? 320 : 640,
      }}
    >
      <ImageResult
        src={sageImage}
        alt={
          ar
            ? "رسم لفنجان قهوة بجانب لوحة قائمة على خلفية خضراء"
            : "Illustration of a coffee cup beside a menu board on a sage background"
        }
        state={recovered ? "loaded" : state}
        progress={progress}
        aspectRatio={aspectRatio}
        caption={
          ar
            ? "قائمة نخلة الشتوية — الطابع الأخضر"
            : "Nakhla winter menu — sage direction"
        }
        metadata="960 × 640 · SVG"
        onRetry={state === "error" ? () => setRecovered(true) : undefined}
        action={{
          label: used
            ? ar
              ? "أُضيفت إلى القائمة"
              : "Added to menu"
            : ar
              ? "إضافة إلى القائمة"
              : "Use in menu",
          onClick: () => setUsed(true),
        }}
      />
    </div>
  );
}
export function ImageResultStates({
  language = "ar",
}: {
  language?: Language;
}) {
  const ar = language === "ar",
    name = useId(),
    reduced = usePrefersReducedMotion(),
    [selected, setSelected] = useState("sage"),
    [progress, setProgress] = useState(8),
    [retried, setRetried] = useState(false);
  const generated = reduced || progress >= 100;
  useEffect(() => {
    if (generated) return;
    const timer = setTimeout(
      () => setProgress((value) => Math.min(100, value + 12)),
      260,
    );
    return () => clearTimeout(timer);
  }, [generated, progress]);
  return (
    <div className="tz-ai-results-example">
      <div
        className="tz-ai-image-grid"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
        }}
      >
        <ImageResult
          src={clayImage}
          alt={
            ar
              ? "فنجان قهوة ولوحة قائمة بلون طيني"
              : "Coffee cup and menu board in clay tones"
          }
          state={generated ? "loaded" : "loading"}
          progress={generated ? 100 : progress}
          caption={ar ? "الطابع الطيني" : "Clay direction"}
          metadata="960 × 640 · SVG"
          labels={{ loading: ar ? "جارٍ إنشاء الصورة" : "Generating image" }}
        />
        <ImageResult
          src={nightImage}
          alt={
            ar
              ? "فنجان قهوة ولوحة قائمة على خلفية داكنة"
              : "Coffee cup and menu board on a dark background"
          }
          state={retried ? "loaded" : "error"}
          caption={ar ? "الطابع الليلي" : "Night direction"}
          metadata="960 × 640 · SVG"
          onRetry={() => setRetried(true)}
          labels={{
            error: ar ? "تعذّر إنشاء الصورة" : "Couldn’t generate this image",
          }}
        />
      </div>
      <fieldset
        className="tz-ai-results-example"
        style={{ border: 0, padding: 0, margin: 0, minInlineSize: 0 }}
      >
        <legend className="tz-field-label">
          {ar ? "اختر طابع القائمة" : "Choose a menu direction"}
        </legend>
        <div className="tz-ai-image-grid">
          {images.map((image) => (
            <label className="tz-ai-image-choice" key={image.id}>
              <img
                src={image.src}
                alt={
                  ar
                    ? `لوحة قائمة وفنجان قهوة بالطابع ${image.ar}`
                    : `Menu board and coffee cup, ${image.en.toLowerCase()} direction`
                }
              />
              <span>
                <input
                  type="radio"
                  className="tz-choice-input tz-radio"
                  name={name}
                  value={image.id}
                  checked={selected === image.id}
                  onChange={() => setSelected(image.id)}
                />
                {ar ? `الطابع ${image.ar}` : image.en}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
function citedAnswer(ar: boolean, sources: SourceReference[]) {
  return (
    <p>
      {ar
        ? "اكتب أسماء الأصناف بالعربية والإنجليزية"
        : "Start with bilingual item names"}
      <InlineCitation source={sources[0]} />
      {ar
        ? "، ثم ضع كل سعر بجانب صنفه كما يطلب الموجز."
        : ", then place each price beside its item, as the brief asks."}
      <InlineCitation source={sources[1]} />
    </p>
  );
}
export function SourcesExample({
  language = "ar",
  defaultExpanded = false,
  longContent = false,
}: {
  language?: Language;
  defaultExpanded?: boolean;
  longContent?: boolean;
}) {
  const ar = language === "ar",
    sources = sampleSources(language);
  if (longContent)
    sources[0] = {
      ...sources[0],
      title: ar
        ? "مراجعة سهولة استخدام قائمة نخلة الشتوية — Winter menu usability review: ثماني جلسات مع زوار فروع الرياض وجدة والخبر عن الأسعار والأسماء باللغتين وترتيب المشروبات الموسمية"
        : "Nakhla winter menu usability review — مراجعة قائمة الشتاء: eight sessions with guests in Riyadh, Jeddah and Khobar on prices, bilingual names and the order of seasonal drinks",
      metadata:
        "https://docs.nakhla.sa/research/2026/winter-menu/usability-review/sessions/riyadh-jeddah-khobar/final-report-v3-bilingual-names-and-prices",
    };
  return (
    <div className="tz-ai-results-example">
      {citedAnswer(ar, sources)}
      <Sources
        key={String(defaultExpanded)}
        items={sources}
        defaultExpanded={defaultExpanded}
      />
    </div>
  );
}
export function SourcesStates({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar",
    [audit, brief] = sampleSources(language);
  const workshop: SourceReference = {
    id: "workshop-notes",
    number: 3,
    title: ar ? "ملاحظات ورشة فريق الفروع" : "Branch team workshop notes",
    metadata: ar ? "داخلي · ٣ أكتوبر ٢٠٢٦" : "Internal · Oct 3, 2026",
  };
  return (
    <div className="tz-ai-results-example">
      <p>
        {ar
          ? "اكتب أسماء الأصناف بالعربية والإنجليزية"
          : "Start with bilingual item names"}
        <InlineCitation source={audit} />
        {ar
          ? "، ثم ضع كل سعر بجانب صنفه كما يطلب موجز التصميم"
          : ", then place each price beside its item, as the design brief asks"}
        <InlineCitation source={brief} mode="link" />
        {ar
          ? ". واقترح فريق الفروع تمييز المشروبات الموسمية بلون مختلف."
          : ". The branch team also suggested setting seasonal drinks apart with their own color."}
        <InlineCitation source={workshop} />
      </p>
      <Sources items={[audit, brief, workshop]} defaultExpanded />
      <div>
        <Modal
          trigger={
            <Button size="sm" variant="secondary">
              {ar ? "عرض المراجع" : "View references"}
            </Button>
          }
          title={ar ? "المراجع" : "References"}
          description={
            ar
              ? "المصادر التي بُنيت عليها توصيات القائمة."
              : "Sources behind the menu recommendations."
          }
          closeLabel={ar ? "إغلاق المراجع" : "Close references"}
        >
          <p>
            {ar
              ? "يشترط موجز التصميم أسعارًا واضحة"
              : "Clear prices are a core requirement of the design brief"}
            <InlineCitation source={brief} />
          </p>
        </Modal>
      </div>
    </div>
  );
}
export function InsightCardsExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  longContent?: boolean;
}) {
  const ar = language === "ar",
    [detail, setDetail] = useState<string | null>(null),
    [audit, brief] = sampleSources(language);
  const findings = [
    {
      id: "names",
      title: ar
        ? "اكتب أسماء الأصناف بالعربية والإنجليزية."
        : "Make item names bilingual.",
      evidence: ar
        ? "أراد خمسة زوار من ثمانية أن يروا الاسم العربي بجانب الإنجليزي، خاصة في المشروبات الموسمية."
        : "Five of eight guests wanted the Arabic name beside the English one, especially for seasonal drinks.",
      source: audit,
      details: (
        <p>
          {ar
            ? "طلب ذلك خمسة زوار من ثمانية في جلسات الاختبار."
            : "Five of eight guests asked for this in testing sessions."}
          {longContent &&
            (ar
              ? " قال أحد الزوار: «I couldn’t tell which price belonged to which drink»، ووجد آخرون الأسماء الإنجليزية الطويلة صعبة القراءة على لوحة الطلب من مترين، خاصة في الفروع خافتة الإضاءة. وطلب ثلاثة زوار ذكر السعرات الحرارية بجانب كل صنف، واقترح اثنان وضع المشروبات الموسمية في عمود خاص بها."
              : " One guest said «ما عرفت أي سعر لأي مشروب», and others found long English names hard to read on the order board from two meters away, especially in dimly lit branches. Three guests asked for calories beside each item, and two suggested giving seasonal drinks their own column.")}
          <InlineCitation source={audit} />
        </p>
      ),
      action: {
        label: ar ? "عرض ملاحظات الجلسات" : "View session notes",
        onClick: () => setDetail("names"),
      },
    },
    {
      id: "layout",
      title: ar
        ? "ضع كل سعر في مكان واضح بجانب صنفه."
        : "Give prices a clear place beside each item.",
      evidence: brief.description ?? "",
      source: brief,
      details: (
        <p>
          {ar
            ? "يطلب موجز التصميم قائمة سهلة القراءة بالعربية والإنجليزية."
            : "The design brief asks for a menu that reads easily in Arabic and English."}
          <InlineCitation source={brief} />
        </p>
      ),
      action: {
        label: ar ? "عرض الموجز" : "View brief",
        onClick: () => setDetail("layout"),
      },
    },
    {
      id: "image",
      title: ar
        ? "استخدم رسمًا أفقيًا، وأبقِ النص خارج الصورة."
        : "Use a landscape illustration and keep text in the content.",
      evidence: ar
        ? "يطلب الموجز رسمًا أفقيًا وتعليقًا موجزًا وعناوين بالعربية والإنجليزية."
        : "The brief calls for a landscape illustration, a quiet caption and Arabic/English headings.",
      source: brief,
      details: (
        <ImageResult
          src={nightImage}
          alt={
            ar
              ? "فنجان قهوة ولوحة قائمة على خلفية داكنة"
              : "Coffee cup and menu board on a dark background"
          }
          metadata={
            ar ? "الطابع الليلي · 960 × 640" : "Night direction · 960 × 640"
          }
        />
      ),
      action: {
        label: ar ? "عرض موجز الصورة" : "View image brief",
        onClick: () => setDetail("image"),
      },
    },
  ];
  const open = findings.find((finding) => finding.id === detail);
  return (
    <div className="tz-ai-results-example">
      <InsightCards items={findings} />
      {open && (
        <section
          className="tz-card tz-insight-detail"
          aria-label={ar ? "تفاصيل النتيجة" : "Finding details"}
        >
          <h4 style={{ margin: 0 }}>{open.title}</h4>
          <p>{open.evidence}</p>
          <Sources items={[open.source]} defaultExpanded />
          <div>
            <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>
              {ar ? "إخفاء التفاصيل" : "Hide details"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
