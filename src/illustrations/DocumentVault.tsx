import { useId, useState } from "react";

export interface DocumentVaultProps {
  language?: "ar" | "en";
  animated?: boolean;
  interactive?: boolean;
  className?: string;
}

/* One file, React and Tiraz tokens. The pocket blurs the actual papers behind
   it; its tint, edge and thickness are separate from that optical layer. */
const styles = `
.document-vault {
  --dv-pigment: var(--chart-sage);
  --dv-back-light: color-mix(in srgb, var(--dv-pigment) 39%, var(--surface));
  --dv-back-deep: color-mix(in srgb, var(--dv-pigment) 83%, var(--surface));
  --dv-glass-light: color-mix(in srgb, var(--surface) 26%, transparent);
  --dv-glass-mid: color-mix(in srgb, var(--dv-pigment) 17%, transparent);
  --dv-glass-deep: color-mix(in srgb, var(--dv-pigment) 61%, transparent);
  --dv-rim: color-mix(in srgb, var(--surface) 88%, transparent);
  --dv-rim-soft: color-mix(in srgb, var(--surface) 38%, transparent);
  --dv-edge: color-mix(in srgb, var(--dv-pigment) 62%, transparent);
  --dv-shade: color-mix(in srgb, var(--text) 23%, transparent);
  --dv-contact: color-mix(in srgb, var(--text) 37%, transparent);
  --dv-paper: var(--surface);
  --dv-paper-bottom: color-mix(in srgb, var(--surface) 91%, var(--dv-pigment));
  --dv-paper-back: color-mix(in srgb, var(--surface) 81%, var(--dv-pigment));
  --dv-paper-edge: color-mix(in srgb, var(--dv-pigment) 16%, var(--surface));
  --dv-print: color-mix(in srgb, var(--dv-pigment) 75%, var(--text));
  --dv-print-muted: color-mix(in srgb, var(--dv-pigment) 30%, var(--surface));
  --dv-stamp: color-mix(in srgb, var(--dv-pigment) 80%, var(--text));
  --dv-ground: color-mix(in srgb, var(--dv-pigment) 16%, transparent);
  --dv-paper-shadow: 0 .2cqi .3cqi var(--dv-shade), .6cqi 1.3cqi 1.8cqi -.7cqi var(--dv-shade);
  --dv-back-shadow: inset .15cqi .2cqi .2cqi var(--dv-rim-soft), inset -.35cqi -.4cqi .5cqi var(--dv-edge), .35cqi .6cqi .65cqi -.2cqi var(--dv-shade);
  --dv-tab-shadow: inset .15cqi .18cqi .2cqi var(--dv-rim-soft);
  --dv-pocket-shadow: inset .35cqi .1cqi .6cqi var(--dv-rim-soft), inset -.45cqi -.65cqi .55cqi var(--dv-edge), inset 0 -1.4cqi 2cqi var(--dv-glass-deep);
  --dv-stamp-shadow: 0 .15cqi var(--dv-rim-soft);
  --dv-duration: calc(var(--motion-panel) * 2.2);
  --dv-ease: var(--ease-out);
  container-type: inline-size;
  inline-size: 100%;
  font-family: var(--font);
}
.document-vault:where(.tiraz-system[data-theme="dark"] *) {
  --dv-back-light: color-mix(in srgb, var(--dv-pigment) 62%, var(--surface));
  --dv-back-deep: color-mix(in srgb, var(--dv-pigment) 27%, var(--surface-tray));
  --dv-glass-light: color-mix(in srgb, var(--dv-pigment) 21%, transparent);
  --dv-glass-mid: color-mix(in srgb, var(--dv-pigment) 10%, transparent);
  --dv-glass-deep: color-mix(in srgb, var(--surface-tray) 68%, transparent);
  --dv-rim: color-mix(in srgb, var(--dv-pigment) 87%, transparent);
  --dv-rim-soft: color-mix(in srgb, var(--dv-pigment) 35%, transparent);
  --dv-edge: color-mix(in srgb, var(--surface-tray) 76%, transparent);
  --dv-shade: color-mix(in srgb, var(--surface-tray) 72%, transparent);
  --dv-contact: color-mix(in srgb, var(--surface-tray) 94%, transparent);
  --dv-paper: color-mix(in srgb, var(--text) 88%, var(--surface));
  --dv-paper-bottom: color-mix(in srgb, var(--text) 72%, var(--dv-pigment));
  --dv-paper-back: color-mix(in srgb, var(--text) 45%, var(--surface));
  --dv-paper-edge: color-mix(in srgb, var(--text) 66%, var(--surface));
  --dv-print: color-mix(in srgb, var(--surface-tray) 82%, var(--dv-pigment));
  --dv-print-muted: color-mix(in srgb, var(--surface) 24%, var(--dv-paper));
  --dv-stamp: var(--dv-pigment);
  --dv-ground: color-mix(in srgb, var(--dv-pigment) 11%, transparent);
}
.document-vault .document-vault__art {
  position: relative;
  isolation: isolate;
  aspect-ratio: 3 / 2;
  inline-size: 100%;
  overflow: hidden;
  direction: ltr;
  pointer-events: none;
}
.document-vault .document-vault__definitions {
  position: absolute;
  inline-size: 0;
  block-size: 0;
}
.document-vault .document-vault__ground {
  position: absolute;
  inset-inline-start: 19%;
  inset-block-start: 76%;
  inline-size: 66%;
  block-size: 12%;
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--dv-ground), transparent 70%);
  transform: rotate(-5deg);
  filter: blur(1cqi);
}
.document-vault .document-vault__contact {
  position: absolute;
  inset-inline-start: 27%;
  inset-block-start: 77%;
  inline-size: 49%;
  block-size: 3.5%;
  border-radius: 50%;
  background: var(--dv-contact);
  transform: rotate(-7deg);
  filter: blur(1.6cqi);
  opacity: .56;
  transition: opacity var(--dv-duration) var(--dv-ease), transform var(--dv-duration) var(--dv-ease);
}
.document-vault .document-vault__folder {
  position: absolute;
  inset-inline-start: 22%;
  inset-block-start: 27%;
  inline-size: 57%;
  block-size: 54%;
  transform: rotate(-7deg);
  perspective: 150cqi;
}
.document-vault .document-vault__back {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-paper);
  background: linear-gradient(132deg, var(--dv-back-light), var(--dv-back-deep) 84%);
  box-shadow: var(--dv-back-shadow);
}
.document-vault .document-vault__back::before {
  content: "";
  position: absolute;
  inset-inline-start: 5%;
  inset-block-start: -7%;
  inline-size: 38%;
  block-size: 18%;
  border-start-start-radius: var(--radius-control);
  border-start-end-radius: var(--radius-control);
  background: linear-gradient(135deg, var(--dv-back-light), var(--dv-back-deep));
  box-shadow: var(--dv-tab-shadow);
  z-index: -1;
}
.document-vault .document-vault__paper {
  position: absolute;
  inline-size: 78%;
  block-size: 98%;
  inset-inline-start: 11%;
  inset-block-start: -12%;
  box-sizing: border-box;
  border: .12cqi solid var(--dv-paper-edge);
  border-radius: var(--radius-small);
  background: linear-gradient(150deg, var(--dv-paper) 52%, var(--dv-paper-bottom));
  box-shadow: var(--dv-paper-shadow);
  transform-origin: 50% 95%;
  transition: transform var(--dv-duration) var(--dv-ease);
  overflow: hidden;
}
.document-vault .document-vault__paper--back {
  inset-inline-start: 15%;
  inset-block-start: -15%;
  transform: rotate(8deg);
  background: linear-gradient(150deg, var(--dv-paper-back), var(--dv-paper-bottom));
}
.document-vault .document-vault__paper--middle {
  inset-inline-start: 8%;
  inset-block-start: -10%;
  transform: rotate(-7deg);
}
.document-vault .document-vault__paper--front {
  transform: rotate(1deg);
}
.document-vault .document-vault__paper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2cqi;
  margin: 5.8% 8% 0;
  color: var(--dv-print);
  font-size: var(--text-meta);
  font-weight: var(--weight-medium);
  line-height: var(--leading-meta);
  white-space: nowrap;
}
.document-vault .document-vault__paper-symbol {
  inline-size: 5cqi;
  block-size: 5cqi;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
}
.document-vault .document-vault__paper-rule {
  margin: 4% 8%;
  block-size: .2cqi;
  background: var(--dv-paper-edge);
}
.document-vault .document-vault__paper-lines {
  display: grid;
  gap: 1.7cqi;
  margin: 7% 8%;
}
.document-vault .document-vault__paper-lines span {
  display: block;
  block-size: .65cqi;
  border-radius: var(--radius-pill);
  background: var(--dv-print-muted);
}
.document-vault .document-vault__paper-lines span:nth-child(2) { inline-size: 86%; }
.document-vault .document-vault__paper-lines span:nth-child(3) { inline-size: 94%; }
.document-vault .document-vault__paper-lines span:nth-child(4) { inline-size: 61%; }
.document-vault .document-vault__paper-chart {
  position: absolute;
  inset-inline: 8%;
  inset-block-end: 12%;
  block-size: 26%;
  display: flex;
  align-items: end;
  gap: 7%;
  border-block-end: .18cqi solid var(--dv-paper-edge);
}
.document-vault .document-vault__paper-chart span {
  inline-size: 19%;
  block-size: 42%;
  border-radius: var(--radius-small) var(--radius-small) 0 0;
  background: var(--dv-print-muted);
}
.document-vault .document-vault__paper-chart span:nth-child(2) { block-size: 69%; }
.document-vault .document-vault__paper-chart span:nth-child(3) { block-size: 56%; }
.document-vault .document-vault__paper-chart span:nth-child(4) { block-size: 90%; background: var(--dv-pigment); }
.document-vault .document-vault__inside-shadow {
  position: absolute;
  inset-inline: 3%;
  inset-block-end: 2%;
  block-size: 18%;
  border-radius: 0 0 var(--radius-paper) var(--radius-paper);
  background: linear-gradient(transparent, var(--dv-contact));
  opacity: .5;
}
.document-vault .document-vault__pocket {
  position: absolute;
  inset-inline-start: -1%;
  inset-block-start: 26%;
  inline-size: 102%;
  block-size: 76%;
  transform-origin: 50% 96%;
  transform: rotateX(-4deg);
  transition: transform var(--dv-duration) var(--dv-ease);
}
.document-vault .document-vault__glass {
  position: absolute;
  inset: 0;
  background: linear-gradient(130deg, var(--dv-glass-light), var(--dv-glass-mid) 41%, var(--dv-glass-deep) 100%);
  -webkit-backdrop-filter: blur(1.25cqi) saturate(1.25);
  backdrop-filter: blur(1.25cqi) saturate(1.25);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
.document-vault .document-vault__glass::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(118deg, var(--dv-rim-soft), transparent 23%, transparent 77%, var(--dv-edge));
  opacity: .65;
}
.document-vault .document-vault__glass::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius-paper);
  box-shadow: var(--dv-pocket-shadow);
}
.document-vault .document-vault__rim {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
  fill: none;
}
.document-vault .document-vault__stamp {
  position: absolute;
  inset-inline-start: 9%;
  inset-block-end: 14%;
  display: flex;
  align-items: center;
  gap: 1.6cqi;
  color: var(--dv-stamp);
  opacity: .64;
  text-shadow: var(--dv-stamp-shadow);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  line-height: var(--leading-meta);
}
.document-vault .document-vault__stamp svg {
  inline-size: 4.5cqi;
  block-size: 4.5cqi;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.35;
}
.document-vault[data-open="true"] .document-vault__pocket { transform: rotateX(-24deg); }
.document-vault[data-open="true"] .document-vault__paper--back { transform: translate(7%, -13%) rotate(12deg); }
.document-vault[data-open="true"] .document-vault__paper--middle { transform: translate(-7%, -20%) rotate(-11deg); }
.document-vault[data-open="true"] .document-vault__paper--front { transform: translate(1%, -29%) rotate(2deg); }
.document-vault[data-open="true"] .document-vault__contact { opacity: .7; transform: translateY(1cqi) rotate(-7deg) scaleX(1.06); }
.document-vault .document-vault__controls {
  display: flex;
  justify-content: center;
  padding-block: var(--space-2) var(--space-5);
  padding-inline: var(--space-4);
}
.document-vault .document-vault__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-block-size: var(--control-height);
  min-inline-size: 9em;
  padding-block: var(--space-2);
  padding-inline: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--surface);
  color: var(--text-secondary);
  box-shadow: var(--shadow-control);
  font: inherit;
  font-size: var(--text-label);
  cursor: pointer;
  transition: background var(--motion-state) var(--ease-out), color var(--motion-state) var(--ease-out);
}
.document-vault .document-vault__toggle svg { inline-size: 16px; block-size: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; }
.document-vault .document-vault__toggle:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }
.document-vault .document-vault__toggle:active { background: var(--surface-hover); }
@media (hover: hover) and (pointer: fine) {
  .document-vault .document-vault__toggle:hover { background: var(--surface-subtle); color: var(--text); }
}
@media (prefers-reduced-motion: reduce) {
  .document-vault .document-vault__paper,
  .document-vault .document-vault__pocket,
  .document-vault .document-vault__contact,
  .document-vault .document-vault__toggle { transition: none; }
}
`;

const pocketContour =
  "M21 3H119C130 3 135 6 142 14L154 28C160 35 167 38 177 38H337C348 38 357 47 357 58V187C357 198 348 207 337 207H23C12 207 3 198 3 187V21C3 11 11 3 21 3Z";
const pocketMask = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" preserveAspectRatio="none"><path d="${pocketContour}"/></svg>`,
)}")`;

/** A frosted document pocket. `animated` follows a host's hover/focus preview;
 * `interactive` adds an explicit local toggle below the decorative art. */
export function DocumentVault({
  language = "ar",
  animated = false,
  interactive = false,
  className,
}: DocumentVaultProps) {
  const id = `document-vault-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [opened, setOpened] = useState(false);
  const open = animated || (interactive && opened);
  const arabic = language === "ar";
  const toggleLabel = arabic
    ? open
      ? "إغلاق المجلد"
      : "فتح المجلد"
    : open
      ? "Close folder"
      : "Open folder";

  return (
    <div
      className={["document-vault", className].filter(Boolean).join(" ")}
      data-illustration="document-vault"
      data-animated={animated}
      data-open={open}
      lang={language}
      dir={arabic ? "rtl" : "ltr"}
    >
      <style href="tiraz-document-vault" precedence="components">
        {styles}
      </style>
      <div className="document-vault__art" aria-hidden="true">
        <svg className="document-vault__definitions" focusable="false">
          <defs>
            <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".8" y2="1">
              <stop stopColor="var(--dv-rim)" />
              <stop offset=".48" stopColor="var(--dv-rim-soft)" />
              <stop offset="1" stopColor="var(--dv-edge)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="document-vault__ground" />
        <div className="document-vault__contact" />
        <div className="document-vault__folder">
          <div className="document-vault__back" />
          <div className="document-vault__paper document-vault__paper--back">
            <div className="document-vault__paper-lines">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="document-vault__paper document-vault__paper--middle">
            <div className="document-vault__paper-header">
              <svg
                className="document-vault__paper-symbol"
                viewBox="0 0 24 24"
                focusable="false"
              >
                <path d="M5 17V7m7 10V4m7 13v-6M3 21h18" />
              </svg>
            </div>
            <div className="document-vault__paper-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="document-vault__paper document-vault__paper--front">
            <div
              className="document-vault__paper-header"
              dir={arabic ? "rtl" : "ltr"}
            >
              <span>{arabic ? "خطة المشروع" : "Project notes"}</span>
              <svg
                className="document-vault__paper-symbol"
                viewBox="0 0 24 24"
                focusable="false"
              >
                <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
                <path d="M9 8h6M9 12h6M9 16h3" />
              </svg>
            </div>
            <div className="document-vault__paper-rule" />
            <div className="document-vault__paper-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="document-vault__paper-chart">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="document-vault__inside-shadow" />
          <div className="document-vault__pocket">
            <div
              className="document-vault__glass"
              style={{ maskImage: pocketMask, WebkitMaskImage: pocketMask }}
            />
            <svg
              className="document-vault__rim"
              viewBox="0 0 360 210"
              preserveAspectRatio="none"
              focusable="false"
            >
              <path
                d={pocketContour}
                stroke="var(--dv-edge)"
                strokeWidth="2.4"
                transform="translate(.8 1.4)"
              />
              <path
                d={pocketContour}
                stroke={`url(#${id}-rim)`}
                strokeWidth="1.4"
              />
              <path
                d="M21 6H119C128 6 133 9 139 16L151 30C158 38 166 41 177 41H337"
                stroke="var(--dv-rim-soft)"
                strokeWidth="1"
              />
              <path
                d="M12 189C12 195 17 199 24 199H332"
                stroke="var(--dv-rim-soft)"
                strokeWidth="1"
                opacity=".5"
              />
            </svg>
            <div className="document-vault__stamp" dir={arabic ? "rtl" : "ltr"}>
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M5 8h14v12H5zM4 4h16v4H4zM9 12h6" />
              </svg>
              <span>{arabic ? "مستنداتي" : "My documents"}</span>
            </div>
          </div>
        </div>
      </div>
      {interactive && (
        <div className="document-vault__controls">
          <button
            type="button"
            className="document-vault__toggle"
            aria-expanded={open}
            onClick={() => setOpened(!open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d={open ? "M7 14l5-5 5 5" : "M7 10l5 5 5-5"} />
            </svg>
            {toggleLabel}
          </button>
        </div>
      )}
    </div>
  );
}
