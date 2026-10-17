import { useId, useState } from "react";
import {
  Button,
  ImageResult,
  Sources,
  InlineCitation,
  InsightCards,
  Modal,
} from "../../index";
import type { ImageResultProps } from "../../index";
import sageImage from "../assets/results/coffee-sage.svg?url&no-inline";
import clayImage from "../assets/results/coffee-clay.svg?url&no-inline";
import nightImage from "../assets/results/coffee-night.svg?url&no-inline";
import { sampleSources } from "./ai-result-samples";

type Language = "ar" | "en";
const images = [
  { id: "sage", src: sageImage },
  { id: "clay", src: clayImage },
  { id: "night", src: nightImage },
];
export function ImageResultExample({
  language = "ar",
  state = "loaded",
  aspectRatio = "landscape",
}: {
  language?: Language;
  state?: ImageResultProps["state"];
  aspectRatio?: ImageResultProps["aspectRatio"];
}) {
  const ar = language === "ar",
    [recovered, setRecovered] = useState(false),
    [used, setUsed] = useState(false);
  return (
    <div className="tz-ai-results-example">
      <p className="tz-ai-results-note">
        {ar
          ? "رسم محلي للمثال؛ لا توليد صور."
          : "Local sample illustration; no image generation."}
      </p>
      <ImageResult
        src={sageImage}
        alt={
          ar
            ? "رسم لفنجان قهوة بجانب لوحة قائمة على خلفية خضراء"
            : "Illustration of a coffee cup beside a menu board on a sage background"
        }
        state={recovered ? "loaded" : state}
        aspectRatio={aspectRatio}
        caption={
          ar
            ? "اتجاه بصري لقائمة المقهى — عينة"
            : "A visual direction for the café menu — sample"
        }
        metadata={
          ar ? "رسم SVG محلي · 960 × 640" : "Local SVG illustration · 960 × 640"
        }
        onRetry={state === "error" ? () => setRecovered(true) : undefined}
        action={{
          label: ar ? "اختيار الصورة" : "Use image",
          onClick: () => setUsed(true),
        }}
      />
      <p role="status" className="tz-ai-results-note">
        {used
          ? ar
            ? "اختير الرسم الأخضر في هذا المثال."
            : "Sage illustration selected in this example."
          : ""}
      </p>
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
    [selected, setSelected] = useState("sage"),
    [used, setUsed] = useState("");
  const [phase, setPhase] = useState<"loading" | "error" | "loaded">("loading");
  const [revision, setRevision] = useState(0);
  return (
    <div className="tz-ai-results-example">
      <p className="tz-ai-results-note">
        {ar
          ? "حالات محلية صريحة وعينات مرسومة؛ لا خدمة صور."
          : "Explicit local states and original illustrations; no image service."}
      </p>
      <ImageResult
        key={revision}
        src={phase === "error" ? "data:image/png;base64,invalid" : clayImage}
        alt={
          ar
            ? "فنجان قهوة ولوحة قائمة بلون طيني"
            : "Coffee cup and menu board in clay tones"
        }
        state={phase === "loading" ? "loading" : "loaded"}
        caption={
          ar
            ? "إطار ثابت أثناء التحميل والخطأ والتعافي"
            : "The same frame during loading, failure and recovery"
        }
        onRetry={() => setPhase("loaded")}
      />
      <div className="tz-ai-results-controls">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setPhase("loading");
            setRevision((value) => value + 1);
          }}
        >
          {ar ? "عرض التحميل" : "Show loading"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setPhase("error");
            setRevision((value) => value + 1);
          }}
        >
          {ar ? "تعطيل الصورة" : "Break image"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setPhase("loaded");
            setRevision((value) => value + 1);
          }}
        >
          {ar ? "تحميل الصورة المحلية" : "Load local image"}
        </Button>
      </div>
      <fieldset
        className="tz-ai-results-example"
        style={{ border: 0, padding: 0, margin: 0, minInlineSize: 0 }}
      >
        <legend className="tz-field-label">
          {ar ? "ثلاثة اتجاهات — اختر واحدًا" : "Three directions — choose one"}
        </legend>
        <div className="tz-ai-image-grid">
          {images.map((image, i) => (
            <label className="tz-ai-image-choice" key={image.id}>
              <img
                src={image.src}
                alt={
                  ar
                    ? `لوحة قائمة وفنجان قهوة، اتجاه ${i + 1}`
                    : `Menu board and coffee cup, direction ${i + 1}`
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
                {ar ? `الاتجاه ${i + 1}` : `Direction ${i + 1}`}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Button size="sm" onClick={() => setUsed(selected)}>
          {ar ? "استخدام الاختيار" : "Use selected image"}
        </Button>
      </div>
      <p role="status" className="tz-ai-results-note">
        {used
          ? ar
            ? `اختير الاتجاه ${images.findIndex((i) => i.id === used) + 1} في المثال.`
            : `Direction ${images.findIndex((i) => i.id === used) + 1} selected in this example.`
          : ""}
      </p>
    </div>
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
    [reversed, setReversed] = useState(false),
    sources = sampleSources(language);
  if (longContent)
    sources[0] = {
      ...sources[0],
      title: (ar
        ? "عنوان مصدر عربي وEnglish طويل جدًا "
        : "A very long English / عربي source title "
      ).repeat(7),
      metadata: "https://sample.invalid/" + "long-path-".repeat(24),
    };
  return (
    <div className="tz-ai-results-example">
      <p className="tz-ai-results-note">
        {ar
          ? "رد ومصادر من سيناريو محلي خيالي؛ دون استرجاع مباشر."
          : "Response and sources from a fictional local scenario; no live retrieval."}
      </p>
      <p>
        {ar
          ? "ابدأ بأسماء الأصناف ثنائية اللغة"
          : "Start with bilingual item names"}
        <InlineCitation source={sources[0]} />
        {ar
          ? "، ثم اربط كل سعر بصنفه وفق الموجز."
          : ", then associate each price with its item as the brief specifies."}
        <InlineCitation source={sources[1]} />
      </p>
      <Sources
        key={String(defaultExpanded)}
        items={reversed ? [sources[1], sources[0]] : sources}
        defaultExpanded={defaultExpanded}
      />
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReversed(!reversed)}
        >
          {ar ? "عكس ترتيب المصادر" : "Reverse source order"}
        </Button>
      </div>
    </div>
  );
}
export function SourcesStates({ language = "ar" }: { language?: Language }) {
  const ar = language === "ar",
    sources = sampleSources(language);
  return (
    <div className="tz-ai-results-example">
      <SourcesExample language={language} defaultExpanded />
      <p>
        {ar ? "رابط مباشر للموجز" : "Direct link to the brief"}
        <InlineCitation source={sources[1]} mode="link" />
      </p>
      <Sources
        items={[
          {
            id: "pending-reference",
            number: 7,
            title: ar
              ? "مرجع بلا وجهة — عينة"
              : "Reference without a destination — sample",
          },
        ]}
        defaultExpanded
      />
      <Modal
        trigger={
          <Button size="sm" variant="secondary">
            {ar ? "مراجعة مصدر ضمن نافذة" : "Review source in modal"}
          </Button>
        }
        title={ar ? "مراجعة المصادر" : "Source review"}
        description={
          ar
            ? "المصدر نفسه داخل نافذة للمراجعة."
            : "The same source inside a review dialog."
        }
        closeLabel={ar ? "إغلاق المراجعة" : "Close review"}
      >
        <p>
          {ar ? "راجع الموجز" : "Review the brief"}
          <InlineCitation source={sources[1]} />
        </p>
      </Modal>
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
    sources = sampleSources(language);
  const findings = [
    {
      id: "names",
      title: ar
        ? "اجعل أسماء الأصناف ثنائية اللغة."
        : "Make item names bilingual.",
      details: (
        <>
          <p>
            {ar
              ? "في السيناريو، طلب ذلك خمسة من ثمانية مشاركين. هذه ملاحظات مثال مكتوب وليست بحثًا حيًا."
              : "In the scenario, five of eight participants requested this. These are scripted sample notes, not live research."}
            {longContent &&
              (ar
                ? " أسماء عربية وEnglish وأسعار مرتبطة بوضوح."
                : " Arabic and English names with clearly associated prices."
              ).repeat(12)}
            <InlineCitation source={sources[0]} />
          </p>
        </>
      ),
      action: {
        label: ar ? "عرض ملاحظات المثال" : "View sample notes",
        onClick: () => setDetail("names"),
      },
    },
    {
      id: "layout",
      title: ar
        ? "امنح الأسعار مكانًا واضحًا بجانب الأصناف."
        : "Give prices a clear place beside each item.",
      details: (
        <>
          <p>
            {ar
              ? "يتطلب موجز المثال قائمة سهلة القراءة بالعربية والإنجليزية."
              : "The sample brief asks for a readable Arabic and English menu."}
            <InlineCitation source={sources[1]} />
          </p>
        </>
      ),
      action: {
        label: ar ? "عرض تفاصيل الموجز" : "View brief details",
        onClick: () => setDetail("layout"),
      },
    },
    {
      id: "image",
      title: ar
        ? "استخدم رسمًا أفقيًا واترك النص للمحتوى."
        : "Use a landscape illustration and keep text in the content.",
      details: (
        <ImageResult
          src={nightImage}
          alt={
            ar
              ? "فنجان قهوة ولوحة قائمة على خلفية داكنة"
              : "Coffee cup and menu board on a dark background"
          }
          metadata={ar ? "رسم محلي أصلي" : "Original local illustration"}
        />
      ),
      action: {
        label: ar ? "عرض موجز الصورة" : "View image brief",
        onClick: () => setDetail("image"),
      },
    },
  ];
  return (
    <div className="tz-ai-results-example">
      <p className="tz-ai-results-note">
        {ar
          ? "نتائج مختصرة من محتوى المثال؛ يزوّدها التطبيق."
          : "Concise findings supplied by the application from sample content."}
      </p>
      <InsightCards items={findings} />
      {detail && (
        <section
          className="tz-card tz-insight-detail"
          aria-label={ar ? "تفاصيل النتيجة" : "Finding details"}
        >
          <h4 style={{ margin: 0 }}>
            {findings.find((i) => i.id === detail)!.title}
          </h4>
          <p>
            {detail === "names"
              ? sources[0].description
              : sources[1].description}
          </p>
          <Sources
            items={[detail === "names" ? sources[0] : sources[1]]}
            defaultExpanded
          />
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
