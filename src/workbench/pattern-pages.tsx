import { Fragment, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChatThread, SystemProvider, numberLocale } from "../system";
import type { SystemConfig } from "../system";
import { formatCount, formatElapsed } from "../system/format";
import { agentTaskCopy } from "../system/agent-task-copy";
import { changeSummaryCopy } from "../system/change-summary-copy";
import {
  citedAnswerCopy,
  feedbackBarCopy,
  thinkingPanelCopy,
} from "../system/cited-answer-copy";
import {
  approvalCardCopy,
  approvalFlowCopy,
  askUserQuestionsCopy,
} from "../system/decision-copy";
import { imageGenerationCopy } from "../system/image-generation-copy";
import { suggestedEditsCopy } from "../system/suggested-edits-copy";
import { taskStarterCopy } from "../system/task-starter-copy";
import registrySource from "../system/ai/registry.json?raw";
import { catalog } from "./catalog";
import type { ComponentId } from "./catalog";
import { CopyControl } from "./CopyControl";
import { demoStates } from "./demo-states";
import { label, localize, words } from "./i18n";
import type { Language, Localized } from "./i18n";
import type { PlaygroundModel } from "./model";
import { Playground } from "./Playground";

/** The five zones every pattern shares (spec §9), in their order. */
export type Zone = "header" | "paper" | "evidence" | "decision" | "meta";
const zones: readonly Zone[] = [
  "header",
  "paper",
  "evidence",
  "decision",
  "meta",
];
const zoneNames: Record<Zone, Localized> = {
  header: ["الرأس", "Header"],
  paper: ["الورقة", "Paper"],
  evidence: ["الأدلة", "Evidence"],
  decision: ["القرار", "Decision"],
  meta: ["المعلومات", "Meta"],
};

/*
 * What each pattern page adds: the parts in each zone, by catalog id (a part
 * with its own page) or registry support id (a new shared part, documented in
 * the page's API reference), and the pattern's default copy. A zone the
 * pattern leaves out lists nothing. Not exported: a component file that
 * exports anything but components breaks fast refresh.
 */
const patternPages: Partial<
  Record<
    ComponentId,
    { zones: Record<Zone, readonly string[]>; copy: { ar: object; en: object } }
  >
> = {
  "task-starter": {
    zones: {
      header: [],
      paper: ["chat-composer", "model-selector", "context-meter", "tray"],
      evidence: [],
      decision: [],
      meta: ["status-pill"],
    },
    copy: taskStarterCopy,
  },
  "cited-answer": {
    zones: {
      header: [],
      paper: ["markdown", "streaming-text", "follow-ups", "tray"],
      evidence: ["thinking-panel"],
      decision: ["feedback-bar"],
      meta: ["sources"],
    },
    // The panel's and the bar's words are overridden through the answer's.
    copy: {
      ar: {
        ...citedAnswerCopy.ar,
        thinkingPanel: thinkingPanelCopy.ar,
        feedbackBar: feedbackBarCopy.ar,
      },
      en: {
        ...citedAnswerCopy.en,
        thinkingPanel: thinkingPanelCopy.en,
        feedbackBar: feedbackBarCopy.en,
      },
    },
  },
  "agent-task": {
    zones: {
      header: ["ai-mark", "status-pill"],
      paper: ["task-rows", "status-icon", "tray"],
      evidence: ["tool-call"],
      decision: ["approval-card", "button"],
      meta: ["countdown"],
    },
    copy: agentTaskCopy,
  },
  "ask-user-questions": {
    zones: {
      header: ["ai-mark", "status-pill"],
      paper: ["tray"],
      evidence: [],
      decision: ["button"],
      meta: [],
    },
    copy: askUserQuestionsCopy,
  },
  "approval-card": {
    zones: {
      header: ["ai-mark", "status-pill"],
      paper: ["tray"],
      evidence: [],
      decision: ["button"],
      meta: [],
    },
    copy: approvalCardCopy,
  },
  "approval-flow": {
    zones: {
      header: [],
      paper: ["approval-card", "tray"],
      evidence: [],
      decision: ["button"],
      meta: [],
    },
    copy: approvalFlowCopy,
  },
  "suggested-edits": {
    zones: {
      header: ["ai-mark"],
      paper: ["inline-diff", "tray"],
      evidence: [],
      decision: ["button"],
      meta: [],
    },
    copy: suggestedEditsCopy,
  },
  "image-generation": {
    zones: {
      header: ["ai-mark", "status-pill"],
      paper: ["weave-canvas", "image-result", "tray"],
      evidence: [],
      decision: ["button"],
      meta: [],
    },
    copy: imageGenerationCopy,
  },
  "change-summary": {
    zones: {
      header: ["ai-mark", "status-pill"],
      paper: ["sources", "tray"],
      evidence: [],
      decision: ["button"],
      meta: [],
    },
    copy: changeSummaryCopy,
  },
};

const support = (
  JSON.parse(registrySource) as {
    support: readonly { id: string; exports: readonly string[] }[];
  }
).support;

interface PatternProps {
  component: ComponentId;
  model: PlaygroundModel;
  /** The playground's config, so the stills match the demo. */
  config: SystemConfig;
  language: Language;
}

const ignore = () => {};
function withAppearance(model: PlaygroundModel, appearance: "card" | "plain") {
  return "appearance" in model ? { ...model, appearance } : model;
}
/**
 * The page's example at its resting phase, as the demo opens. The page's own
 * canvas rules apply, as on the demo's stage: Suggested edits keeps room for
 * the card it opens below the text.
 */
function Example({ component, model, language }: Omit<PatternProps, "config">) {
  const states = demoStates[component];
  return (
    <div className={`playground-${component}`}>
      <Playground
        component={component}
        model={model}
        language={language}
        phase={
          states?.states.find((state) => state.id === states.resting)?.phase
        }
        onPatch={ignore}
        onEvent={ignore}
        onButtonAction={ignore}
      />
    </div>
  );
}
/**
 * A picture of the example: inert and hidden from assistive technology, in
 * its own provider so its portals and live regions stay inside.
 */
function Still({
  config,
  children,
}: {
  config: SystemConfig;
  children: ReactNode;
}) {
  return (
    <div className="pattern-still" inert aria-hidden="true">
      <SystemProvider config={config}>{children}</SystemProvider>
    </div>
  );
}

/** How deep a zone sits inside other zones, as a nested pattern's do. */
function depth(element: Element) {
  let count = 0;
  for (
    let zone = element.parentElement?.closest("[data-zone]");
    zone;
    zone = zone.parentElement?.closest("[data-zone]")
  )
    count++;
  return count;
}
/**
 * Where a zone's pin goes: its outermost element, since a pattern inside it,
 * such as Agent task's inline approval, brings zones of its own. Folded
 * evidence has no box, so the button that unfolds it stands in.
 */
function anchorOf(root: HTMLElement, zone: Zone) {
  const [element] = Array.from(
    root.querySelectorAll<HTMLElement>(`[data-zone="${zone}"]`),
  ).sort((a, b) => depth(a) - depth(b));
  if (!element?.hidden) return element;
  return (
    Array.from(root.querySelectorAll<HTMLElement>("[aria-controls]")).find(
      (control) => control.getAttribute("aria-controls") === element.id,
    ) ?? element
  );
}

/**
 * Anatomy: the card at rest with a numbered pin on each of its zones, and a
 * legend that names the parts in each zone. A part with a page opens it; a
 * new shared part opens the API reference at its table.
 */
export function PatternAnatomy({
  component,
  model,
  config,
  language,
  onOpenPage,
}: PatternProps & { onOpenPage: (id: ComponentId) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<
    readonly { zone: Zone; x: number; y: number }[]
  >([]);
  const rtl = config.direction === "rtl";
  useLayoutEffect(() => {
    const node = stage.current;
    const still = node?.querySelector(".pattern-still");
    if (!node || !still) return;
    const measure = () => {
      const box = node.getBoundingClientRect();
      const next = zones.flatMap((zone) => {
        const anchor = anchorOf(node, zone);
        if (!anchor) return [];
        const rect = anchor.getBoundingClientRect();
        return [
          {
            zone,
            // The zone's inline-start edge, level with its first line, from
            // the padding edge, where the pins are placed.
            x:
              (rtl ? box.right - rect.right : rect.left - box.left) -
              node.clientLeft,
            y:
              rect.top -
              box.top -
              node.clientTop +
              Math.min(rect.height / 2, 16),
          },
        ];
      });
      // Pins that have not moved keep their state, so nothing renders again.
      setPins((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
      );
    };
    measure();
    // The stage's size, and whatever moves inside the still, such as a card
    // its popover places once it has mounted.
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    const moves = new MutationObserver(measure);
    moves.observe(still, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style", "hidden"],
    });
    return () => {
      resize.disconnect();
      moves.disconnect();
    };
  }, [rtl]);
  const page = patternPages[component];
  if (!page) return null;
  const digits = new Intl.NumberFormat(numberLocale(config));
  const number = (zone: Zone) => digits.format(zones.indexOf(zone) + 1);
  const showPart = (id: string) => {
    const heading = document.getElementById(`api-part-${id}`);
    const reference = heading?.closest("details");
    if (reference) reference.open = true;
    heading?.focus();
  };
  return (
    <section className="pattern-section" aria-labelledby="pattern-anatomy">
      <div className="section-title-row">
        <h2 id="pattern-anatomy">{label("anatomy", language)}</h2>
      </div>
      <div className="pattern-anatomy" ref={stage}>
        <Still config={config}>
          <Example
            component={component}
            model={withAppearance(model, "card")}
            language={language}
          />
        </Still>
        <div className="pattern-pins" aria-hidden="true">
          {pins.map((pin) => (
            <span
              key={pin.zone}
              className="pattern-pin"
              style={{ insetInlineStart: pin.x, insetBlockStart: pin.y }}
            >
              {number(pin.zone)}
            </span>
          ))}
        </div>
      </div>
      <ol className="pattern-legend">
        {pins.map(({ zone }) => (
          <li key={zone}>
            <span className="pattern-legend-number">{number(zone)}</span>
            <span className="pattern-legend-zone">
              {localize(zoneNames[zone], language)}
            </span>
            <span className="pattern-legend-parts">
              {page.zones[zone].map((id, index) => {
                const part = catalog.find((item) => item.id === id);
                return (
                  <Fragment key={id}>
                    {index > 0 && (language === "ar" ? "، " : ", ")}
                    <button
                      type="button"
                      className="note-link"
                      onClick={() =>
                        part ? onOpenPage(part.id) : showPart(id)
                      }
                    >
                      {part ? (
                        localize(part.name, language)
                      ) : (
                        <bdi dir="ltr">
                          {support.find((item) => item.id === id)?.exports[0]}
                        </bdi>
                      )}
                    </button>
                  </Fragment>
                );
              })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Placements: as a card where the pattern has one, then plain in an
 * assistant message and in a 360 px side panel on the tray.
 */
export function PatternPlacements({
  component,
  model,
  config,
  language,
}: PatternProps) {
  const t = words(language);
  const card = "appearance" in model;
  const plain = (
    <Example
      component={component}
      model={withAppearance(model, "plain")}
      language={language}
    />
  );
  const prop = (value: string) =>
    card && <code dir="ltr">{`appearance="${value}"`}</code>;
  return (
    <section className="pattern-section" aria-labelledby="pattern-placements">
      <div className="section-title-row">
        <h2 id="pattern-placements">{label("placements", language)}</h2>
      </div>
      <div className="pattern-placements">
        {card && (
          <figure className="pattern-placement">
            <figcaption>
              {t("بطاقة", "Card")} {prop("card")}
            </figcaption>
            <Still config={config}>
              <Example
                component={component}
                model={withAppearance(model, "card")}
                language={language}
              />
            </Still>
          </figure>
        )}
        <figure className="pattern-placement">
          <figcaption>
            {t("داخل محادثة", "In a conversation")} {prop("plain")}
          </figcaption>
          <Still config={config}>
            <ChatThread
              messages={[
                {
                  id: "ask",
                  role: "user",
                  content: t("ساعدني في إقفال أكتوبر", "Help me close October"),
                },
                { id: "reply", role: "assistant", content: plain },
              ]}
            />
          </Still>
        </figure>
        <figure className="pattern-placement">
          <figcaption>
            {t("في لوحة جانبية", "In a side panel")} {prop("plain")}
          </figcaption>
          <Still config={config}>
            <div className="pattern-panel">{plain}</div>
          </Still>
        </figure>
      </div>
    </section>
  );
}

/** Copy: every default label, with each function shown on sample values. */
export function PatternCopy({
  component,
  config,
  language,
}: Omit<PatternProps, "model">) {
  const page = patternPages[component];
  if (!page) return null;
  const t = words(language);
  const show = (value: unknown, key: string, lang: Language) => {
    if (typeof value !== "function") return String(value);
    const format = {
      direction: lang === "ar" ? "rtl" : "ltr",
      numerals: config.numerals,
    } as const;
    const digits = new Intl.NumberFormat(numberLocale(format));
    // A count shows 3 and a time 72 seconds; a name or a passage the host
    // passes shows as «…».
    const one = digits.format(1),
      three = digits.format(3);
    const samples: Record<string, unknown[]> = {
      autoStart: [formatElapsed(72, format)],
      thought: [formatElapsed(72, format)],
      position: [one, three],
      hint: [one, three],
      used: [percent(format)],
      weavingAt: [percent(format)],
      attached: [3, formatCount(3, "record", format)],
      reviewing: [3, formatCount(3, "edit", format)],
      applied: [3, formatCount(3, "edit", format), three],
      waiting: [three],
      failedAt: [three],
      stoppedAt: [three],
      more: [three],
      version: [three],
    };
    const name = key.slice(key.lastIndexOf(".") + 1);
    return String(
      value(
        ...(samples[name] ?? Array.from({ length: value.length }, () => "…")),
      ),
    );
  };
  return (
    <section className="pattern-section" aria-labelledby="pattern-copy">
      <div className="section-title-row">
        <h2 id="pattern-copy">{label("copyStates", language)}</h2>
        <CopyControl
          text={JSON.stringify(strings(page.copy[language]), null, 2)}
          caption={t("نسخ النصوص العربية", "Copy English labels")}
          language={language}
        />
      </div>
      <div
        className="api-scroll pattern-copy"
        tabIndex={0}
        role="region"
        aria-label={t("جدول النصوص", "Labels table")}
      >
        <table>
          <thead>
            <tr>
              <th>{t("المفتاح", "Key")}</th>
              <th>{t("العربية", "Arabic")}</th>
              <th>{t("الإنجليزية", "English")}</th>
            </tr>
          </thead>
          <tbody>
            {rows(page.copy.ar, page.copy.en).map(({ key, ar, en }) => (
              <tr key={key}>
                <th scope="row">
                  <code dir="ltr">
                    {typeof ar === "function" ? `${key}()` : key}
                  </code>
                </th>
                <td>
                  <span lang="ar" dir="rtl">
                    {show(ar, key, "ar")}
                  </span>
                </td>
                <td>
                  <span lang="en" dir="ltr">
                    {show(en, key, "en")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function percent(format: Parameters<typeof numberLocale>[0]) {
  // Intl marks the sign's direction with format characters; the text
  // around it already has a direction.
  return new Intl.NumberFormat(numberLocale(format), { style: "percent" })
    .format(0.03)
    .replace(/\p{Cf}/gu, "");
}
/** Each label in both languages; a nested group's keys are dotted. */
function rows(
  ar: object,
  en: object,
  path = "",
): { key: string; ar: unknown; en: unknown }[] {
  return Object.entries(ar).flatMap(([key, value]) => {
    const other = (en as Record<string, unknown>)[key];
    return value && typeof value === "object"
      ? rows(value, other as object, `${path}${key}.`)
      : [{ key: `${path}${key}`, ar: value, en: other }];
  });
}
/** The string labels, as a `labels` object; functions stay in code. */
function strings(copy: object): object {
  return Object.fromEntries(
    Object.entries(copy).flatMap(([key, value]) =>
      typeof value === "function"
        ? []
        : [[key, value && typeof value === "object" ? strings(value) : value]],
    ),
  );
}
