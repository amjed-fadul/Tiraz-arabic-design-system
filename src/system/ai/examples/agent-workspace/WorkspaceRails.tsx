import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { useReducedMotion } from "../../../useReducedMotion";
import type { ActivityPanel, ActivitySnapshot } from "./activity-runtime";
import { WorkspaceChip, WorkspacePanel } from "./WorkspacePanel";
import { panelCopy } from "./workspace-copy";
import type { WorkspacePanels } from "./useWorkspacePanels";

type Attached = {
  /** The reply whose activity hangs off the composer. */
  replyKey: string;
  snapshot: ActivitySnapshot | null;
  panels: WorkspacePanels;
  language: "ar" | "en";
  agentAvatar?: ReactNode;
};

// Evidence on the leading side, the agents doing the work on the trailing side.
const sides: Record<"start" | "end", ActivityPanel[]> = {
  start: ["folders", "research", "skills"],
  end: ["agent-0", "agent-1", "agent-2"],
};
const gap = 12;
const wires = [...sides.start, ...sides.end];

/** Plays a card back toward the composer before it becomes a chip. */
function leave(card: HTMLElement, reduced: boolean, done: () => void) {
  const composer = card
    .closest(".tz-workspace-stage")
    ?.querySelector(".tz-workspace-composer")
    ?.getBoundingClientRect();
  if (reduced || !composer || typeof card.animate !== "function") return done();
  const box = card.getBoundingClientRect();
  const x =
    box.right <= composer.left ? 12 : box.left >= composer.right ? -12 : 0;
  const y = box.bottom <= composer.top ? 12 : 0;
  card
    .animate(
      [
        { opacity: 1, filter: "blur(0)", transform: "none" },
        {
          opacity: 0,
          filter: "blur(4px)",
          transform: `translate(${x}px, ${y}px) scale(0.96)`,
        },
      ],
      {
        duration: 160,
        easing: "cubic-bezier(0.4, 0, 0.6, 1)",
        fill: "forwards",
      },
    )
    .finished.then(done, done);
}

/**
 * Wide containers: panels sit in rails beside the composer, outside the
 * conversation's flow, so opening, filling or closing one never moves a
 * message. Each stack centers on the composer and is drawn to it by a thread.
 */
export function WorkspaceRails({
  stage,
  replyKey,
  snapshot,
  panels,
  language,
  agentAvatar,
  idPrefix,
}: Attached & {
  stage: RefObject<HTMLDivElement | null>;
  idPrefix: string;
}) {
  const reduced = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const focusNext = useRef<string | null>(null);
  const seen = panels.seen(replyKey);
  const revision = `${replyKey}:${language}:${snapshot?.sequence}:${seen
    .map((panel) => `${panel}${panels.isOpen(replyKey, panel) ? "+" : "-"}`)
    .join(",")}`;
  useLayoutEffect(() => {
    const root = stage.current;
    const drawing = svg.current;
    if (!root || !drawing) return;
    let frame = 0;
    const composerOf = () =>
      root.querySelector<HTMLElement>(".tz-workspace-composer");
    function place() {
      const composer = composerOf();
      if (!composer) return;
      // Layout offsets ignore transforms, so stacks aim at where the composer
      // rests, even while it is still gliding into place.
      let top = 0;
      for (
        let node: HTMLElement | null = composer;
        node && node !== root;
        node = node.offsetParent as HTMLElement | null
      )
        top += node.offsetTop;
      const middle = top + composer.offsetHeight / 2;
      const height = top + composer.offsetHeight;
      root!
        .querySelectorAll<HTMLElement>("[data-workspace-rail]")
        .forEach((rail) => {
          const slots = [
            ...rail.querySelectorAll<HTMLElement>(
              ":scope > [data-workspace-slot]",
            ),
          ];
          const sizes = slots.map((slot) => slot.offsetHeight);
          const total =
            sizes.reduce((sum, size) => sum + size, 0) +
            gap * Math.max(0, slots.length - 1);
          // Center on the composer; never below its bottom edge.
          let y = Math.max(0, Math.min(middle - total / 2, height - total));
          slots.forEach((slot, index) => {
            slot.style.setProperty("--y", `${Math.round(y)}px`);
            if (!slot.dataset.placed) {
              // A new slot takes its place without gliding there.
              slot.getBoundingClientRect();
              slot.dataset.placed = "true";
            }
            y += sizes[index] + gap;
          });
        });
    }
    function draw() {
      const composer = composerOf()?.getBoundingClientRect();
      if (!composer) return;
      const origin = root!.getBoundingClientRect();
      const y1 = composer.top + composer.height / 2 - origin.top;
      const ports = { left: [] as string[], right: [] as string[] };
      const place = (node: Element, x: number, y: number) =>
        node.querySelectorAll("circle").forEach((circle) => {
          circle.setAttribute("cx", String(x));
          circle.setAttribute("cy", String(y));
        });
      for (const panel of wires) {
        const target = root!.querySelector<HTMLElement>(
          `[data-workspace-slot="${panel}"] > *`,
        );
        const box = target?.getBoundingClientRect();
        const open = !!box && box.width > 0;
        const parts = root!.querySelectorAll<SVGElement>(
          `[data-wire="${panel}"]`,
        );
        parts.forEach((part) => {
          if (part.dataset.open !== String(open))
            part.dataset.open = String(open);
          if (open) part.dataset.state = target!.dataset.state;
        });
        if (!open) continue;
        const left = box.left + box.width / 2 < composer.left;
        ports[left ? "left" : "right"].push(target!.dataset.state ?? "");
        const sign = left ? -1 : 1;
        const x1 = (left ? composer.left : composer.right) - origin.left;
        const x2 = (left ? box.right : box.left) - origin.left;
        const y2 = box.top + Math.min(box.height / 2, 22) - origin.top;
        const mid = (x1 + x2) / 2;
        const dy = Math.sign(y2 - y1);
        const radius = Math.min(
          12,
          Math.abs(x2 - x1) / 4,
          Math.abs(y2 - y1) / 2,
        );
        const d =
          radius < 0.5
            ? `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`
            : `M ${x1} ${y1} H ${mid - sign * radius} Q ${mid} ${y1} ${mid} ${y1 + dy * radius} V ${y2 - dy * radius} Q ${mid} ${y2} ${mid + sign * radius} ${y2} H ${x2}`;
        parts.forEach((part) =>
          part.tagName === "path"
            ? part.setAttribute("d", d)
            : place(part, x2, y2),
        );
      }
      // A side's port carries the most urgent state among its wires.
      const urgent = ["error", "needs-input", "running", "complete", "stopped"];
      root!.querySelectorAll<SVGGElement>("[data-port]").forEach((port) => {
        const left = port.dataset.port === "left";
        const states = ports[left ? "left" : "right"];
        port.dataset.open = String(states.length > 0);
        port.dataset.state =
          urgent.find((state) => states.includes(state)) ?? "idle";
        place(port, (left ? composer.left : composer.right) - origin.left, y1);
      });
    }
    // Threads follow cards while they glide, emerge or leave.
    function follow() {
      cancelAnimationFrame(frame);
      const tick = () => {
        draw();
        const moving =
          typeof root!.getAnimations === "function" &&
          root!
            .getAnimations({ subtree: true })
            .some(
              (animation) =>
                animation.playState === "running" &&
                animation.effect?.getTiming().iterations !== Infinity,
            );
        if (moving) frame = requestAnimationFrame(tick);
      };
      tick();
    }
    const update = () => {
      place();
      follow();
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    root
      .querySelectorAll(".tz-workspace-composer, [data-workspace-slot] > *")
      .forEach((node) => observer.observe(node));
    root.addEventListener("animationstart", follow);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener("animationstart", follow);
    };
  }, [stage, revision]);
  useLayoutEffect(() => {
    if (!focusNext.current) return;
    const [kind, panel] = focusNext.current.split(":");
    focusNext.current = null;
    (kind === "card"
      ? document.getElementById(`${idPrefix}-${panel}`)
      : stage.current?.querySelector<HTMLElement>(
          `[data-workspace-rail] [data-workspace-chip="${panel}"]`,
        )
    )?.focus();
  });
  const copy = panelCopy(language);
  return (
    <>
      {(["start", "end"] as const).map((side) => (
        <div
          key={side}
          className="tz-workspace-rail"
          data-workspace-rail={side}
          role="group"
          aria-label={
            side === "start"
              ? language === "ar"
                ? "القراءة والبحث والفحوص"
                : "Reading, research and checks"
              : language === "ar"
                ? "الوكلاء"
                : "Agents"
          }
          hidden={!sides[side].some((panel) => seen.includes(panel))}
        >
          {sides[side]
            .filter((panel) => seen.includes(panel))
            .map((panel) => (
              <div
                key={`${replyKey}-${panel}`}
                className="tz-workspace-slot"
                data-workspace-slot={panel}
              >
                {panels.isOpen(replyKey, panel) ? (
                  <WorkspacePanel
                    id={`${idPrefix}-${panel}`}
                    panel={panel}
                    snapshot={snapshot}
                    language={language}
                    agentAvatar={agentAvatar}
                    onClose={(card) =>
                      leave(card, reduced, () => {
                        focusNext.current = `chip:${panel}`;
                        panels.close(replyKey, panel);
                      })
                    }
                  />
                ) : (
                  <WorkspaceChip
                    panel={panel}
                    snapshot={snapshot}
                    language={language}
                    agentAvatar={agentAvatar}
                    label={copy.names[panel]!}
                    onOpen={() => {
                      focusNext.current = `card:${panel}`;
                      panels.open(replyKey, panel);
                    }}
                  />
                )}
              </div>
            ))}
        </div>
      ))}
      {/* Pipes run behind the cards: an edge, a core in the card colour, and the
          activity flowing inside. Each layer holds every wire, so branches
          merge into one pipe without seams. */}
      <svg className="tz-workspace-threads" aria-hidden="true" ref={svg}>
        {(["edge", "core", "flow"] as const).map((layer) => (
          <g key={layer} className={`tz-workspace-pipe-${layer}`}>
            {wires.map((panel) => (
              <path
                key={panel}
                data-wire={panel}
                data-open="false"
                pathLength={layer === "flow" ? undefined : 1}
              />
            ))}
          </g>
        ))}
      </svg>
      {/* Sockets sit above: where a pipe meets a card, and where it leaves the composer. */}
      <svg className="tz-workspace-sockets" aria-hidden="true">
        {wires.map((panel) => (
          <g
            key={panel}
            className="tz-workspace-socket"
            data-wire={panel}
            data-open="false"
          >
            <circle r="4.5" />
            <circle r="1.75" />
          </g>
        ))}
        {(["left", "right"] as const).map((side) => (
          <g
            key={side}
            className="tz-workspace-socket"
            data-port={side}
            data-open="false"
          >
            <circle r="4.5" />
            <circle r="1.75" />
          </g>
        ))}
      </svg>
    </>
  );
}

/**
 * Narrow containers: panels wait as chips plugged into the composer's top
 * edge. A chip opens its card over the conversation, never inside it.
 */
export function WorkspaceDock({
  replyKey,
  snapshot,
  panels,
  language,
  agentAvatar,
  idPrefix,
}: Attached & { idPrefix: string }) {
  const reduced = useReducedMotion();
  const [peek, setPeek] = useState<ActivityPanel | null>(null);
  const dock = useRef<HTMLDivElement>(null);
  const focusNext = useRef<string | null>(null);
  const seen = panels.seen(replyKey);
  const copy = panelCopy(language);
  useLayoutEffect(() => {
    if (!focusNext.current) return;
    const [kind, panel] = focusNext.current.split(":");
    focusNext.current = null;
    (kind === "card"
      ? document.getElementById(`${idPrefix}-${panel}`)
      : dock.current?.querySelector<HTMLElement>(
          `[data-workspace-chip="${panel}"]`,
        )
    )?.focus();
  });
  if (!seen.length) return null;
  const open = peek && seen.includes(peek) ? peek : null;
  return (
    <div
      className="tz-workspace-dock"
      ref={dock}
      role="group"
      aria-label={language === "ar" ? "نشاط الرد" : "Reply activity"}
    >
      {open && (
        <div className="tz-workspace-peek" key={open}>
          <WorkspacePanel
            id={`${idPrefix}-${open}`}
            panel={open}
            snapshot={snapshot}
            language={language}
            agentAvatar={agentAvatar}
            onClose={(card) =>
              leave(card, reduced, () => {
                focusNext.current = `chip:${open}`;
                setPeek(null);
              })
            }
          />
        </div>
      )}
      <div className="tz-workspace-dock-chips">
        {seen.map((panel) => (
          <WorkspaceChip
            key={panel}
            panel={panel}
            snapshot={snapshot}
            language={language}
            agentAvatar={agentAvatar}
            label={copy.names[panel]!}
            expanded={open === panel}
            onOpen={() => {
              if (open === panel) return setPeek(null);
              focusNext.current = `card:${panel}`;
              setPeek(panel);
            }}
          />
        ))}
      </div>
    </div>
  );
}
