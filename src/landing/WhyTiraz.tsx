import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const media = matchMedia(
      "(max-width: 900px), (prefers-reduced-motion: reduce)",
    );
    const chapters = [
      ...section.querySelectorAll<HTMLElement>("[data-story-step]"),
    ];
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const configure = () => {
      observer?.disconnect();
      const stacked =
        media.matches || typeof IntersectionObserver !== "function";
      setStaticLayout(stacked);
      if (stacked) return;
      const ratios = new Map<Element, number>();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) =>
            ratios.set(
              entry.target,
              entry.isIntersecting ? entry.intersectionRatio : 0,
            ),
          );
          let next = 0,
            best = 0;
          chapters.forEach((chapter, index) => {
            const ratio = ratios.get(chapter) ?? 0;
            if (ratio > best) {
              best = ratio;
              next = index;
            }
          });
          if (best > 0) setActive(next);
        },
        {
          rootMargin: `-${Math.round(innerHeight * 0.22)}px 0px -${Math.round(innerHeight * 0.38)}px 0px`,
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        },
      );
      chapters.forEach((chapter) => observer?.observe(chapter));
    };
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(configure);
    };
    configure();
    media.addEventListener("change", configure);
    window.addEventListener("resize", resize);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      media.removeEventListener("change", configure);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      ref={root}
      className="lp-why lp-story"
      id="why"
      aria-labelledby="why-title"
      data-static={staticLayout}
    >
      <div className="lp-container">
        <h2 id="why-title" className="lp-story-title">
          {ar ? "لماذا طِراز؟" : "Why Tiraz?"}
        </h2>
        <div className="lp-story-layout">
          <div className="lp-story-chapters">
            {stories.map((story, index) => (
              <article
                key={story.image}
                data-story-step={index}
                data-active={index === active}
              >
                <div className="lp-story-copy">
                  <span className="lp-story-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <h3>{story.title}</h3>
                  <p>{story.text}</p>
                  {index === 2 && (
                    <a
                      className="lp-story-reference"
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
                  loading="lazy"
                  aria-hidden={!staticLayout}
                />
              </article>
            ))}
          </div>
          <div
            className="lp-story-visual"
            data-active={active}
            aria-hidden={staticLayout}
          >
            {stories.map((story, index) => (
              <img
                key={story.image}
                src={story.image}
                alt={story.alt}
                width="1200"
                height="900"
                loading="lazy"
                data-current={index === active}
                aria-hidden={index !== active}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
