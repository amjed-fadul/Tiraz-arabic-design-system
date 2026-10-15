import { useEffect, useState } from "react";
import { Button, SystemProvider, defaultConfig } from "../../system";
import warp from "./assets/01-warp.svg?url";
import crossing from "./assets/02-crossing.svg?url";
import loom from "./assets/03-loom.svg?url";

const concepts = [
  {
    id: "01",
    ar: "السدى",
    en: "Warp",
    src: warp,
    noteAr: "إطار من خيطين بزوايا مستقيمة وعبور مركزي.",
    noteEn: "Two angular threads form a frame with a central crossing.",
  },
  {
    id: "02",
    ar: "العبور",
    en: "Crossing",
    src: crossing,
    noteAr: "خيطان متقابلان يلتقيان بإيقاع واضح.",
    noteEn: "Opposing threads meet in a clear, compact rhythm.",
  },
  {
    id: "03",
    ar: "النول",
    en: "Loom",
    src: loom,
    noteAr: "خطوط سدى ولحمة تختصر فكرة النسيج.",
    noteEn: "Warp and weft reduced to a few strong strokes.",
  },
];
export function BrandPreview() {
  const [ar, setAr] = useState(true);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [ar, dark]);
  return (
    <div lang={ar ? "ar" : "en"}>
      <SystemProvider
        config={{
          ...defaultConfig,
          direction: ar ? "rtl" : "ltr",
          theme: dark ? "dark" : "light",
        }}
      >
        <div className="brand-page">
          <header>
            <a href="/landing.html">
              {ar ? "العودة إلى صفحة طِراز" : "Back to Tiraz landing"}
            </a>
            <div>
              <Button variant="secondary" onClick={() => setAr(!ar)}>
                {ar ? "English" : "العربية"}
              </Button>
              <Button variant="secondary" onClick={() => setDark(!dark)}>
                {ar ? "فاتح / داكن" : "Light / dark"}
              </Button>
            </div>
          </header>
          <main>
            <p className="brand-kicker">TIRAZ / BRAND EXPLORATION</p>
            <h1>
              {ar
                ? "ثلاث أفكار، من خيط واحد."
                : "Three ideas, from one thread."}
            </h1>
            <p className="brand-intro">
              {ar
                ? "تم اختيار السدى، الخيار الأول، ليُرافق العلامة الكتابية في صفحة طِراز. نحتفظ بالخيارين الآخرين هنا للمقارنة."
                : "Warp, option 1, is selected to accompany the Tiraz wordmark. The other two concepts remain here for comparison."}
            </p>
            <div className="brand-grid">
              {concepts.map((c) => (
                <article key={c.id}>
                  <div className="brand-label">
                    <span>{c.id}</span>
                    <h2>{ar ? c.ar : c.en}</h2>
                    {c.id === "01" && (
                      <strong className="brand-selected">
                        {ar ? "المختار" : "Selected"}
                      </strong>
                    )}
                  </div>
                  <div className="brand-lockup">
                    <img src={c.src} alt="" />
                    <strong lang="ar">طِراز</strong>
                    <span lang="en">Tiraz</span>
                  </div>
                  <p>{ar ? c.noteAr : c.noteEn}</p>
                  <div
                    className="brand-sizes"
                    aria-label={ar ? "أحجام الرمز" : "Symbol sizes"}
                  >
                    {[16, 24, 32].map((size) => (
                      <figure key={size}>
                        <img
                          src={c.src}
                          alt={`${c.en} ${size}px`}
                          style={{ width: size, height: size }}
                        />
                        <figcaption>{size}px</figcaption>
                      </figure>
                    ))}
                  </div>
                  <div
                    className="brand-inverse"
                    aria-label={
                      ar
                        ? "معاينة أحادية معكوسة"
                        : "Reversed monochrome preview"
                    }
                  >
                    <img src={c.src} alt="" />
                    <span lang="ar">طِراز</span>
                    <span lang="en">Tiraz</span>
                  </div>
                  <a
                    className="brand-download"
                    href={c.src}
                    download={`tiraz-${c.en.toLowerCase()}-concept.svg`}
                  >
                    {ar ? "تنزيل الرمز SVG" : "Download symbol SVG"}
                    <span aria-hidden="true">↓</span>
                  </a>
                </article>
              ))}
            </div>
            <section className="brand-header-samples">
              <h2>{ar ? "في رأس الواجهة" : "In a header"}</h2>
              {concepts.map((c) => (
                <div key={c.id}>
                  <div className="brand-mini-lockup">
                    <img src={c.src} alt="" />
                    <strong lang="ar">طِراز</strong>
                    <span lang="en">Tiraz</span>
                  </div>
                  <span>
                    {ar ? "المكوّنات　التوثيق" : "Components　Documentation"}
                  </span>
                  <span>{c.id}</span>
                </div>
              ))}
            </section>
          </main>
          <footer>
            {ar
              ? "رموز SVG أصلية · خط IBM Plex Sans Arabic · السدى هو الرمز المختار."
              : "Original SVG concepts · IBM Plex Sans Arabic · Warp is the selected symbol."}
          </footer>
        </div>
      </SystemProvider>
    </div>
  );
}
