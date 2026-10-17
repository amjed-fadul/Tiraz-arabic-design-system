import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import firstThread from "./assets/loom/first-thread.webp?url";
import weavingDraft from "./assets/loom/draft.webp?url";
import patternCards from "./assets/loom/pattern-cards.webp?url";
import { weftClip } from "./weft-clip";
import "./story.css";

const ACCENTS = ["#a5c9b4", "#a8c6ef", "#d6b6e5", "#e8baa3"];

export function WhyTiraz({ ar }: { ar: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [staticLayout, setStaticLayout] = useState(true);
  const stories = [
    {
      title: ar ? "العربية تبدأ من أول خيط" : "Arabic from the first thread",
      text: ar
        ? "حروف عربية بإيقاعها الطبيعي، واتجاه من اليمين. يبقى النص المختلط واضحًا، حتى في أدق التفاصيل."
        : "Arabic typography with its natural rhythm. Right-to-left layouts and mixed-language content, considered down to the details.",
      image: firstThread,
      alt: ar
        ? "خيط أخضر يعبر خيوط السدى العاجية من اليمين إلى اليسار"
        : "A green thread passing through ivory warp threads from right to left",
      caption: ar
        ? [
            "الخيط الأول.",
            "يعبر السدى من اليمين إلى اليسار، باتجاه قراءة العربية.",
          ]
        : [
            "The first thread.",
            "It crosses the warp from right to left, the direction Arabic is read.",
          ],
    },
    {
      title: ar
        ? "قواعد واحدة، ونسيج متّسق"
        : "One set of rules, one coherent cloth",
      text: ar
        ? "رموز تصميم مشتركة ومكوّنات مدمجة تعمل معًا. غيّر اللون وشاهد الأزرار والرسوم تتغيّر من إعداد واحد."
        : "Shared tokens and compact components that work together. One accent setting connects your controls, charts and live customization.",
      image: weavingDraft,
      alt: ar
        ? "مخطط نسج على ورق شبكي بجانب القطعة المنسوجة منه"
        : "A weaving draft on grid paper beside the swatch woven from it",
      caption: ar
        ? [
            "مخطّط النسج.",
            "قواعد على شبكة واحدة، تُنتج نسيجًا متّسقًا في كل مرة.",
          ]
        : [
            "The weaving draft.",
            "Rules on one grid that produce the same coherent cloth every time.",
          ],
    },
    {
      title: ar
        ? "تعليمات تقرؤها الآلة بدقّة"
        : "Instructions a machine can follow",
      text: ar
        ? "تعليمات تنتقل مع المصدر، وأمثلة وواجهات مكوّنات فعلية. ليبدأ مساعدك من النظام الذي تستخدمه."
        : "Portable instructions, working examples and real component APIs. Give your coding assistant the system you actually use.",
      image: patternCards,
      alt: ar
        ? "بطاقات نول مثقّبة متصلة توجّه نسج شريط هندسي"
        : "Laced punched loom cards guiding the weaving of a geometric band",
      caption: ar
        ? ["بطاقات النول.", "أول تعليمات قرأتها آلة لتنسج نقشًا دقيقًا."]
        : [
            "The pattern cards.",
            "The first instructions a machine read to weave a precise pattern.",
          ],
    },
  ];

  stories.forEach((story) => preload(story.image, { as: "image" }));

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const scene = section.querySelector<HTMLElement>(".lp-story-scene")!;
    const text = section.querySelector<HTMLElement>(".lp-story-text")!;
    const label = section.querySelector<HTMLElement>(".lp-story-title")!;
    const copies = [...section.querySelectorAll<HTMLElement>(".lp-story-copy")];
    const images = [
      ...section.querySelectorAll<HTMLImageElement>(".lp-story-visual img"),
    ];
    const media = matchMedia(
      "(prefers-reduced-motion: reduce), (max-height: 560px)",
    );
    let frame = 0;
    let stacked = true;
    let contentTooTall = false;
    let disposed = false;
    const ramp = (value: number, start: number, end: number) => {
      const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
      return t * t * (3 - 2 * t);
    };
    const update = () => {
      frame = 0;
      if (stacked) return;
      const bounds = section.getBoundingClientRect();
      const travel = bounds.height - scene.getBoundingClientRect().height;
      const progress =
        travel > 0 ? Math.max(0, Math.min(1, -bounds.top / travel)) : 0;
      // Readable holds surround two reversible, scroll-driven wipes. Texts never overlap.
      const reveal = [
        1,
        ramp(progress, 0.22, 0.38),
        ramp(progress, 0.62, 0.78),
      ];
      const enter = [1, ramp(progress, 0.3, 0.38), ramp(progress, 0.7, 0.78)];
      const leave = [ramp(progress, 0.22, 0.3), ramp(progress, 0.62, 0.7), 0];
      copies.forEach((copy, index) => {
        copy.style.setProperty(
          "--story-opacity",
          String(enter[index] * (1 - leave[index])),
        );
        copy.style.setProperty(
          "--story-shift",
          `${12 * (1 - enter[index] - leave[index])}px`,
        );
        images[index].style.setProperty(
          "--story-reveal",
          String(reveal[index]),
        );
        images[index].style.setProperty(
          "--story-scale",
          String(1 + 0.04 * (1 - reveal[index])),
        );
        if (index > 0) images[index].style.clipPath = weftClip(reveal[index]);
      });
      setActive(progress < 0.3 ? 0 : progress < 0.7 ? 1 : 2);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const configure = () => {
      if (disposed) return;
      const style = getComputedStyle(text);
      const needed =
        label.offsetHeight +
        24 +
        Math.max(...copies.map((copy) => copy.scrollHeight)) +
        parseFloat(style.paddingTop || "0") +
        parseFloat(style.paddingBottom || "0");
      const available = innerHeight * (innerWidth <= 760 ? 0.62 : 1);
      const ready = images.every(
        (image) => image.complete && image.naturalWidth > 0,
      );
      // Stacking widens the copy. Do not let that width change re-enable pinning
      // and create a ResizeObserver feedback loop. Recheck on viewport resize.
      contentTooTall ||= needed > available;
      stacked = media.matches || contentTooTall || !ready;
      setStaticLayout(stacked);
      schedule();
    };
    const resize = () => {
      contentTooTall = false;
      configure();
    };
    const observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(configure)
        : undefined;
    copies.forEach((copy) => observer?.observe(copy));
    observer?.observe(label);
    images.forEach((image) => {
      image.addEventListener("load", configure);
      image.addEventListener("error", configure);
    });
    configure();
    document.fonts?.ready.then(configure);
    media.addEventListener("change", configure);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      images.forEach((image) => {
        image.removeEventListener("load", configure);
        image.removeEventListener("error", configure);
      });
      media.removeEventListener("change", configure);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", schedule);
    };
  }, [ar]);

  return (
    <section
      ref={root}
      className="lp-why lp-story"
      id="why"
      aria-labelledby="why-title"
      data-static={staticLayout}
      data-active={active}
    >
      <div className="lp-story-scene">
        <div className="lp-story-text">
          <h2 id="why-title" className="lp-story-title">
            {ar ? "لماذا طِراز؟" : "Why Tiraz?"}
          </h2>
          <div className="lp-story-chapters">
            {stories.map((story, index) => (
              <article key={story.image} data-story-step={index}>
                <div className="lp-story-copy">
                  <span className="lp-story-number" aria-hidden="true">
                    {ar ? `٠${"١٢٣"[index]}` : `0${index + 1}`}
                  </span>
                  <h3>{story.title}</h3>
                  <p>{story.text}</p>
                  {index === 0 && (
                    <p className="lp-story-proof">
                      {ar ? "الطلب" : "Order"} <bdi dir="ltr">#A-1024</bdi> ·{" "}
                      {ar ? "١٢٠ ر.س" : "SAR 120"} ·{" "}
                      <bdi dir="ltr">Visa •• 4242</bdi>
                    </p>
                  )}
                  {index === 1 && (
                    <p className="lp-story-proof">
                      {ACCENTS.map((color) => (
                        <i
                          key={color}
                          className="lp-story-swatch"
                          style={{ background: color }}
                          aria-hidden="true"
                        />
                      ))}
                      <bdi dir="ltr">accent: "sage"</bdi>
                    </p>
                  )}
                  {index === 2 && (
                    <a
                      className="lp-story-reference"
                      tabIndex={staticLayout || active === 2 ? 0 : -1}
                      href="https://github.com/amjed-fadul/Tiraz-arabic-design-system/tree/main/src/system/ai/README.md"
                    >
                      <bdi dir="ltr">src/system/ai/README.md</bdi>
                    </a>
                  )}
                </div>
                <figure className="lp-story-inline" aria-hidden={!staticLayout}>
                  <img
                    src={story.image}
                    alt={story.alt}
                    width="960"
                    height="1280"
                    loading="eager"
                  />
                  <figcaption>
                    <b>{story.caption[0]}</b> {story.caption[1]}
                  </figcaption>
                </figure>
              </article>
            ))}
          </div>
        </div>
        <div className="lp-story-visual" aria-hidden={staticLayout}>
          {stories.map((story) => (
            <img
              key={story.image}
              src={story.image}
              alt={story.alt}
              width="960"
              height="1280"
              loading="eager"
              decoding="async"
            />
          ))}
          <p className="lp-story-caption" key={active}>
            <b>{stories[active].caption[0]}</b> {stories[active].caption[1]}
          </p>
        </div>
      </div>
    </section>
  );
}
