import { useEffect, useRef, useState } from "react";
import { ImageGeneration, numberLocale, useSystem } from "../../index";
import type { ImageGenerationProps } from "../../index";
import { story } from "./finance-story";
type Language = "ar" | "en";
type Status = ImageGenerationProps["status"];

// The page's phases are statuses of the pattern. Done is "completed".
const statusOf: Record<string, Status> = {
  weaving: "weaving",
  completed: "completed",
  failed: "failed",
};

// How the host paces the job: progress rises 12 points every 300 ms, and the
// host reports the images a moment after it reaches 100. With no progress to
// report, the first picture arrives after five ticks.
const tickMs = 300,
  stepBy = 12,
  lastTick = 8,
  settleMs = 600,
  arrivesAt = 5;

// The four versions are drawn here, so no image is ever fetched: dunes at
// sunset with a crescent and palms, in warm colors, as inline SVG data URIs.
interface Scene {
  sky: [string, string, string];
  sun: [color: string, x: number, y: number, radius: number];
  moon: [color: string, x: number, y: number, radius: number, tilt: number];
  dunes: [string, string, string];
  palm: string;
  palms: [x: number, y: number, height: number, lean: number][];
  stars?: [number, number][];
}
// A palm is a bent trunk under a crown of six drooping fronds.
function palm(
  [x, y, height, lean]: Scene["palms"][number],
  color: string,
): string {
  const [topX, topY, s] = [x + lean, y - height, height / 100];
  const fronds = [
    [-52, 18],
    [-36, 0],
    [-14, -12],
    [14, -12],
    [36, 0],
    [52, 18],
  ]
    .map(
      ([dx, dy]) =>
        `<path d="M${topX} ${topY}q${dx * s * 0.55} ${-26 * s} ${dx * s} ${dy * s}"/>`,
    )
    .join("");
  return `<g fill="none" stroke="${color}" stroke-linecap="round" stroke-width="${Math.max(2.5, height * 0.04)}"><path d="M${x} ${y}Q${x + lean * 0.2} ${y - height * 0.5} ${topX} ${topY}" stroke-width="${Math.max(3, height * 0.055)}"/>${fronds}</g>`;
}
function draw(scene: Scene): string {
  const [sun, moon] = [scene.sun, scene.moon];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${scene.sky[0]}"/><stop offset=".55" stop-color="${scene.sky[1]}"/><stop offset="1" stop-color="${scene.sky[2]}"/></linearGradient></defs>` +
    `<rect width="600" height="400" fill="url(#g)"/>` +
    (scene.stars ?? [])
      .map(
        ([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${moon[0]}"/>`,
      )
      .join("") +
    `<circle cx="${sun[1]}" cy="${sun[2]}" r="${sun[3] * 1.8}" fill="${sun[0]}" opacity=".22"/>` +
    `<circle cx="${sun[1]}" cy="${sun[2]}" r="${sun[3]}" fill="${sun[0]}"/>` +
    `<path transform="translate(${moon[1]} ${moon[2]}) rotate(${moon[4]}) scale(${moon[3]})" d="M0 -1A1 1 0 0 0 0 1A1.2 1.2 0 0 1 0 -1Z" fill="${moon[0]}"/>` +
    `<path d="M0 262Q150 214 300 252T600 238V400H0Z" fill="${scene.dunes[0]}"/>` +
    `<path d="M0 300Q170 252 340 292T600 276V400H0Z" fill="${scene.dunes[1]}"/>` +
    scene.palms.map((item) => palm(item, scene.palm)).join("") +
    `<path d="M0 346Q200 300 380 338T600 322V400H0Z" fill="${scene.dunes[2]}"/>` +
    `</svg>`
  );
}
const picture = (scene: Scene) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(draw(scene))}`;
const scenes: Scene[] = [
  {
    sky: ["#f9e1ae", "#f4b567", "#e0713f"],
    sun: ["#fff3d2", 330, 256, 54],
    moon: ["#fff8e6", 478, 96, 30, -28],
    dunes: ["#cf7a3a", "#a95a2c", "#7c3f1f"],
    palm: "#3a2012",
    palms: [
      [92, 338, 120, 16],
      [136, 346, 86, -10],
    ],
  },
  {
    sky: ["#f5cfb6", "#e8927a", "#b4546f"],
    sun: ["#ffe3c4", 166, 262, 46],
    moon: ["#fff2e2", 430, 104, 34, -20],
    dunes: ["#bf6a4a", "#8f4838", "#5d2c2b"],
    palm: "#2c1618",
    palms: [
      [470, 330, 126, -18],
      [522, 340, 92, 10],
    ],
  },
  {
    sky: ["#fdecc4", "#f8cd7e", "#ee9f48"],
    sun: ["#fffaf0", 300, 214, 40],
    moon: ["#fffdf5", 132, 92, 26, -34],
    dunes: ["#dc9a45", "#bd762f", "#8c5321"],
    palm: "#46290f",
    palms: [
      [300, 336, 112, 12],
      [356, 344, 82, -12],
    ],
  },
  {
    sky: ["#4e2432", "#9a4237", "#e0903f"],
    sun: ["#ffd9a0", 430, 274, 36],
    moon: ["#ffeab8", 160, 100, 38, -22],
    dunes: ["#8a3b2b", "#65291f", "#3d1914"],
    palm: "#1d0e0c",
    palms: [
      [124, 336, 122, 14],
      [80, 344, 88, -8],
    ],
    stars: [
      [60, 48],
      [250, 70],
      [330, 34],
      [520, 60],
      [570, 140],
    ],
  },
];

export function ImageGenerationExample({
  language = "ar",
  appearance = "card",
  knownProgress = true,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: "card" | "plain";
  /** Reports progress while weaving; without it the loom waits for the picture. */
  knownProgress?: boolean;
  /**
   * "weaving", "completed" or "failed", held as given. Try again and Similar
   * variations send the job back to weaving, which the host finishes on its own
   * and reports. Without a phase the example rests on completed.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const n = (value: number) =>
    new Intl.NumberFormat(numberLocale(config, language)).format(value);

  const [local, setLocal] = useState<Status>("completed"),
    [selected, setSelected] = useState("v1");
  const status = statusOf[phase ?? ""] ?? local;
  // How far the host's job has come in its status.
  const [run, setRun] = useState({ status, ticks: 0 });
  if (run.status !== status) setRun({ status, ticks: 0 });
  const ticks = run.status === status ? run.ticks : 0;
  const report = useRef(onPhaseChange);
  useEffect(() => {
    report.current = onPhaseChange;
  });
  useEffect(() => {
    if (status !== "weaving") return;
    const timer =
      ticks < lastTick
        ? setTimeout(
            () =>
              setRun((current) => ({ ...current, ticks: current.ticks + 1 })),
            tickMs,
          )
        : setTimeout(() => {
            setLocal("completed");
            report.current?.("completed");
          }, settleMs);
    return () => clearTimeout(timer);
  }, [status, ticks]);
  function move(next: Status) {
    setLocal(next);
    onPhaseChange?.(next);
  }

  const arrived = knownProgress || ticks >= arrivesAt;
  const alts = [
    t(
      "كثبان ذهبية عند الغروب، وهلال فوقها ونخيل على جانبها",
      "Golden dunes at sunset, a crescent above them and palms beside",
    ),
    t(
      "شفق وردي فوق الكثبان، مع هلال ونخيل",
      "A rose dusk over the dunes, with a crescent and palms",
    ),
    t(
      "رمال ذهبية في ضوء الظهيرة، مع هلال ونخيل",
      "Golden sands in noon light, with a crescent and palms",
    ),
    t(
      "ليل دافئ بنجوم وهلال فوق الكثبان والنخيل",
      "A warm night of stars and a crescent over dunes and palms",
    ),
  ];
  const images: ImageGenerationProps["images"] = scenes.map((scene, index) => ({
    id: `v${index + 1}`,
    src: status === "weaving" && !arrived ? undefined : picture(scene),
    alt: alts[index],
    width: 1536,
    height: 1024,
  }));

  return (
    <ImageGeneration
      status={status}
      prompt={t(
        "غلاف لحملة رمضان لمتجر تمور: كثبان عند الغروب، هلال ونخيل، بألوان دافئة",
        "A cover for a Ramadan campaign for a date shop: dunes at sunset, a crescent and palms, in warm colors",
      )}
      options={[
        { id: "ratio", label: `${n(3)}:${n(2)}` },
        { id: "style", label: t("رسم توضيحي", "Illustration") },
        { id: "count", label: t(`${n(4)} صور`, `${n(4)} images`) },
      ]}
      progress={knownProgress ? Math.min(100, 8 + ticks * stepBy) : null}
      images={images}
      selected={selected}
      onSelectedChange={setSelected}
      agent={story.agents.campaigns[language]}
      duration={status === "completed" ? 12 : undefined}
      // Use the picture in your own flow.
      onUse={() => {}}
      onVariations={() => move("weaving")}
      // Open your own composer with the description.
      onEditPrompt={() => {}}
      onRetry={() => move("weaving")}
      appearance={appearance}
    />
  );
}
