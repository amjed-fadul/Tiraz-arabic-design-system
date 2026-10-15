import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import arabicFirst from "./assets/story/arabic-first.webp?url";
import sharedSystem from "./assets/story/shared-system.webp?url";
import aiGuidance from "./assets/story/ai-guidance.webp?url";
import "./story.css";

export function WhyTiraz({ ar }: { ar: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [staticLayout, setStaticLayout] = useState(true);
  const stories = [
    {
      title: ar ? "العربية أولًا" : "Arabic first",
      text: ar
        ? "حروف عربية بإيقاعها الطبيعي، واتجاه من اليمين. يبقى النص المختلط واضحًا، حتى في أدق التفاصيل."
        : "Arabic typography with its natural rhythm. Right-to-left layouts and mixed-language content, considered down to the details.",
      image: arabicFirst,
      alt: ar
        ? "خيوط وأشرطة منسوجة تتدفق من اليمين إلى اليسار"
        : "Woven ribbons and threads flowing from right to left",
    },
    {
      title: ar ? "نظام واحد، بتفاصيل مترابطة" : "One coherent system",
      text: ar
        ? "رموز تصميم مشتركة ومكوّنات مدمجة تعمل معًا. غيّر اللون وشاهد الأزرار والرسوم تتغيّر من إعداد واحد."
        : "Shared tokens and compact components that work together. One accent setting connects your controls, charts and live customization.",
      image: sharedSystem,
      alt: ar
        ? "وحدات نسيج هندسية مترابطة في بناء واحد"
        : "Interlocking woven modules joined into one precise structure",
    },
    {
      title: ar ? "جاهز للعمل مع الذكاء الاصطناعي" : "Built to work with AI",
      text: ar
        ? "تعليمات تنتقل مع المصدر، وأمثلة وواجهات مكوّنات فعلية. ليبدأ مساعدك من النظام الذي تستخدمه."
        : "Portable instructions, working examples and real component APIs. Give your coding assistant the system you actually use.",
      image: aiGuidance,
      alt: ar
        ? "مسار أخضر واضح يوجّه الخيوط عبر تقاطعات النسيج"
        : "A clear green thread guiding fibers through structured textile junctions",
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
          String(1 + 0.03 * (1 - reveal[index])),
        );
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
                    0{index + 1}
                  </span>
                  <h3>{story.title}</h3>
                  <p>{story.text}</p>
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
                <img
                  className="lp-story-inline"
                  src={story.image}
                  alt={story.alt}
                  width="1200"
                  height="900"
                  loading="eager"
                  aria-hidden={!staticLayout}
                />
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
              width="1200"
              height="900"
              loading="eager"
              decoding="async"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
