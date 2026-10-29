import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const wireIds = [
  "repo",
  "folders",
  "skills",
  "refs",
  "agent-0",
  "agent-1",
  "agent-2",
  "research",
  "folder-picker",
];

function elbow(x1: number, y1: number, x2: number, y2: number, offset: number) {
  if (Math.abs(y2 - y1) < 4) return `M${x1},${y1} L${x2},${y2}`;
  const dx = Math.sign(x2 - x1),
    dy = Math.sign(y2 - y1);
  const mid = (x1 + x2) / 2 + offset;
  const r = Math.min(9, Math.abs(y2 - y1) / 2, Math.abs(x2 - x1) / 3);
  return `M${x1},${y1} H${mid - dx * r} Q${mid},${y1} ${mid},${y1 + dy * r} V${y2 - dy * r} Q${mid},${y2} ${mid + dx * r},${y2} H${x2}`;
}

/** Sockets follow measured panel geometry throughout interrupted transitions. */
export function Connections({
  stage,
  revision,
  activeSources = "",
}: {
  stage: RefObject<HTMLDivElement | null>;
  revision: string;
  activeSources?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const root = stage.current,
      drawing = svg.current;
    if (!root || !drawing) return;
    let frame = 0,
      until = 0;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const compact = matchMedia("(max-width: 1000px)");
    function draw() {
      if (compact.matches) return;
      const origin = root!.getBoundingClientRect();
      const anchor = root!
        .querySelector<HTMLElement>("[data-composer-anchor]")
        ?.getBoundingClientRect();
      if (!anchor) return;
      drawing!.querySelectorAll<SVGGElement>("[data-wire]").forEach((group) => {
        const id = group.dataset.wire!;
        const panel = root!.querySelector<HTMLElement>(`[data-socket="${id}"]`);
        if (!panel) {
          group.dataset.open = "false";
          return;
        }
        const shell = panel.closest<HTMLElement>("[data-open]")!;
        const box = panel.getBoundingClientRect();
        group.dataset.open = shell.dataset.open;
        group.dataset.active = String(
          id.startsWith("agent")
            ? shell.dataset.state === "running"
            : activeSources.split(",").includes(id),
        );
        let path: string;
        if (id === "folder-picker") {
          const parent = root!
            .querySelector('[data-socket="folders"]')!
            .getBoundingClientRect();
          const trigger = root!
            .querySelector("[data-folder-trigger]")!
            .getBoundingClientRect();
          const onLeft = box.left < parent.left;
          const x1 = (onLeft ? parent.left : parent.right) - origin.left;
          const x2 = (onLeft ? box.right : box.left) - origin.left;
          path = elbow(
            x1,
            trigger.top + trigger.height / 2 - origin.top,
            x2,
            box.top + 53 - origin.top,
            0,
          );
        } else if (id === "research") {
          const rtl = root!.closest("[dir]")?.getAttribute("dir") === "rtl";
          const x1 = (rtl ? anchor.right - 44 : anchor.left + 44) - origin.left;
          const x2 = (rtl ? box.right - 44 : box.left + 44) - origin.left;
          const y1 = anchor.bottom - origin.top,
            y2 = box.top - origin.top;
          path = `M${x1},${y1} C${x1},${y1 + 20} ${x2},${y2 - 20} ${x2},${y2}`;
        } else {
          const onLeft = box.left < anchor.left;
          const index = id.startsWith("agent")
            ? Number(id.slice(-1))
            : wireIds.indexOf(id);
          const x1 = (onLeft ? anchor.left : anchor.right) - origin.left;
          const y1 =
            anchor.top +
            (id.startsWith("agent") ? 61 + index * 19 : 57 + index * 13) -
            origin.top;
          const x2 = (onLeft ? box.right : box.left) - origin.left;
          const y2 = box.top + (id.startsWith("agent") ? 48 : 53) - origin.top;
          path = elbow(x1, y1, x2, y2, (index - 1) * 4 * (onLeft ? 1 : -1));
        }
        group
          .querySelectorAll("path")
          .forEach((line) => line.setAttribute("d", path));
      });
    }
    function tick() {
      draw();
      if (performance.now() < until) frame = requestAnimationFrame(tick);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      until = performance.now() + (motion.matches ? 0 : 420);
      tick();
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    root
      .querySelectorAll<HTMLElement>("[data-socket], [data-composer-anchor]")
      .forEach((node) => observer.observe(node));
    root.addEventListener("transitionrun", schedule);
    motion.addEventListener("change", schedule);
    compact.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener("transitionrun", schedule);
      motion.removeEventListener("change", schedule);
      compact.removeEventListener("change", schedule);
    };
  }, [stage, revision, activeSources]);
  return (
    <svg className="ac-connections" aria-hidden="true" ref={svg}>
      {wireIds.map((id) => (
        <g key={id} data-wire={id}>
          <path className="ac-wire-tube" />
          <path className="ac-wire-flow" />
        </g>
      ))}
    </svg>
  );
}
