import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Tabs, useSystem } from "../system";
import { screenPath, screens } from "../examples/frame/screen";
import type { ScreenSlug } from "../examples/frame/screen";
import "./screen-showcase.css";

const featured = ["dashboard", "invoices"] as const;

function ScreenPreview({ slug, ar }: { slug: ScreenSlug; ar: boolean }) {
  const { config } = useSystem();
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const exit = useRef<HTMLAnchorElement>(null);
  const id = useId();
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver !== "function",
  );
  const [viewport, setViewport] = useState({ width: 0, height: 0, scale: 1 });
  const item = screens.find((screen) => screen.slug === slug)!;
  const name = item.name[ar ? 0 : 1];
  const query = new URLSearchParams({
    lang: ar ? "ar" : "en",
    theme: config.theme,
    accent: config.accent,
  });
  const standalone = `${screenPath(slug)}?${query}`;
  query.set("embed", "1");
  const source = `${screenPath(slug)}?${query}`;

  useLayoutEffect(() => {
    const node = stage.current;
    if (!node) return;
    const measure = () => {
      const width = node.clientWidth;
      if (!width) return;
      // Small stages use the screen's real phone layout. Larger stages fit
      // a tablet or desktop viewport, with the same visible stage height.
      const windowWidth = width < 640 ? width : width < 960 ? 768 : 1280;
      const scale = Math.min(1, width / windowWidth);
      setViewport({
        width: windowWidth,
        height: node.clientHeight / scale,
        scale,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    if (typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function openScreen(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.type !== "tiraz:open-screen"
      )
        return;
      const target = screens.find((screen) => screen.slug === event.data.slug);
      if (target) window.location.assign(`/library/screens/${target.slug}`);
    }
    window.addEventListener("message", openScreen);
    return () => window.removeEventListener("message", openScreen);
  }, []);

  return (
    <div className="lp-screen-example">
      <a
        className="lp-screen-skip"
        href={`#${id}`}
        onClick={(event) => {
          event.preventDefault();
          exit.current?.focus();
        }}
      >
        {ar ? "تجاوز معاينة الشاشة" : "Skip screen preview"}
      </a>
      <div ref={stage} className="lp-screen-stage">
        {visible && viewport.width > 0 && (
          <iframe
            key={source}
            ref={frame}
            src={source}
            title={
              ar ? `معاينة تفاعلية: ${name}` : `Interactive preview: ${name}`
            }
            style={
              {
                "--lp-screen-width": `${viewport.width}px`,
                "--lp-screen-height": `${viewport.height}px`,
                "--lp-screen-scale": viewport.scale,
              } as CSSProperties
            }
          />
        )}
      </div>
      <div className="lp-screen-caption">
        <p>{item.description[ar ? 0 : 1]}</p>
        <a
          id={id}
          ref={exit}
          className="lp-text-link"
          href={standalone}
          target="_blank"
          rel="noopener"
        >
          {ar ? "افتح الشاشة كاملة" : "Open full screen"}
          <ArrowUpRight
            className="tz-mirror-rtl"
            size={16}
            aria-hidden="true"
          />
          <span className="lp-visually-hidden">
            {ar ? "، في نافذة جديدة" : ", in a new tab"}
          </span>
        </a>
      </div>
    </div>
  );
}

/** The same routes used by the workbench, with no duplicate screen markup. */
export function ScreenShowcase({ ar }: { ar: boolean }) {
  const [selected, setSelected] = useState<string>(featured[0]);
  return (
    <Tabs
      className="lp-screen-showcase"
      label={ar ? "جرّب شاشة" : "Try a screen"}
      value={selected}
      onValueChange={setSelected}
      items={featured.map((slug) => ({
        value: slug,
        label: screens.find((screen) => screen.slug === slug)!.name[ar ? 0 : 1],
        content: <ScreenPreview slug={slug} ar={ar} />,
      }))}
    />
  );
}
