/** Text in both languages, Arabic first. */
type Text = { ar: string; en: string };

/** The three sizes the brief offers, with the pixels each version is made at. */
export const shapes = [
  {
    id: "square",
    name: { ar: "مربّع", en: "Square" },
    ratio: [1, 1],
    size: [1024, 1024],
  },
  {
    id: "landscape",
    name: { ar: "أفقي", en: "Landscape" },
    ratio: [3, 2],
    size: [1536, 1024],
  },
  {
    id: "portrait",
    name: { ar: "عمودي", en: "Portrait" },
    ratio: [2, 3],
    size: [1024, 1536],
  },
] as const satisfies readonly {
  id: string;
  name: Text;
  ratio: readonly [number, number];
  size: readonly [number, number];
}[];
export type ShapeId = (typeof shapes)[number]["id"];

/** What the studio opens with: the brief of the four versions it starts on. */
export const brief = {
  prompt: {
    ar: "بطاقة تذكير ودّية بموعد سداد الفاتورة: تقويم وهلال ونقش هندسي، بألوان هادئة",
    en: "A friendly reminder card for an invoice due date: a calendar, a crescent and a geometric pattern, in calm colors",
  },
  tags: [
    { ar: "ودّي", en: "Friendly" },
    { ar: "هادئ", en: "Calm" },
  ],
  color: "#316746",
  shape: "landscape",
} as const satisfies {
  prompt: Text;
  tags: readonly Text[];
  color: string;
  shape: ShapeId;
};
/** How long a generation takes, in seconds, as the button says and the footer shows. */
export const seconds = 12;

/** The four versions of every generation, described for the page's readers. */
export const versions = [
  {
    id: "v1",
    alt: {
      ar: "بطاقة تقويم بعلامة صح وهلال ذهبي على نقش هندسي فاتح",
      en: "A calendar card with a check mark and a golden crescent on a light geometric pattern",
    },
  },
  {
    id: "v2",
    alt: {
      ar: "بطاقة تقويم بساعة وهلال على نقش هندسي داكن",
      en: "A calendar card with a clock and a crescent on a dark geometric pattern",
    },
  },
  {
    id: "v3",
    alt: {
      ar: "بطاقة تقويم بعملات مكدّسة على نقش هندسي بلونين",
      en: "A calendar card with a stack of coins on a two-tone geometric pattern",
    },
  },
  {
    id: "v4",
    alt: {
      ar: "بطاقة تقويم بجرس تنبيه على خلفية دافئة بنقش هندسي",
      en: "A calendar card with a notification bell on a warm geometric pattern",
    },
  },
] as const satisfies readonly { id: string; alt: Text }[];

// The versions are drawn here, so no image is ever fetched: a reminder
// calendar with a glyph on a geometric lattice, as inline SVG data URIs. The
// subject sits in the middle of a square canvas, and each shape is a window on
// it (its viewBox), so one drawing serves the square, the landscape and the
// portrait, and each picture has its frame's own ratio.
const gold = "#f0b64a";
const channel = (value: number) =>
  Math.round(Math.max(0, Math.min(255, value)))
    .toString(16)
    .padStart(2, "0");
/** `from` moved `amount` of the way to `to`, both as #rrggbb. */
function mix(from: string, to: string, amount: number): string {
  const read = (color: string) =>
    [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16));
  const [a, b] = [read(from), read(to)];
  return `#${a.map((value, at) => channel(value + (b[at] - value) * amount)).join("")}`;
}
const glyphs: Record<string, (ink: string, soft: string) => string> = {
  check: (ink, soft) =>
    `<circle cx="300" cy="338" r="66" fill="${soft}"/><path d="M268 340l24 24 44-52" fill="none" stroke="${ink}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>`,
  clock: (ink, soft) =>
    `<circle cx="300" cy="338" r="66" fill="${soft}" stroke="${ink}" stroke-width="10"/><path d="M300 338V296M300 338l30 18" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round"/><circle cx="300" cy="338" r="7" fill="${ink}"/>`,
  coins: (ink, soft) =>
    [372, 342, 312]
      .map(
        (y) =>
          `<path d="M238 ${y}v-30M362 ${y}v-30" stroke="${ink}" stroke-width="8"/><ellipse cx="300" cy="${y}" rx="62" ry="20" fill="${soft}" stroke="${ink}" stroke-width="8"/>`,
      )
      .join(""),
  bell: (ink, soft) =>
    `<path d="M300 272c-36 0-60 26-60 62v30l-20 28h160l-20-28v-30c0-36-24-62-60-62z" fill="${soft}" stroke="${ink}" stroke-width="9" stroke-linejoin="round"/><path d="M278 400a22 22 0 0 0 44 0" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/><circle cx="300" cy="262" r="8" fill="${ink}"/>`,
};
const windows: Record<ShapeId, string> = {
  square: "0 0 600 600",
  landscape: "0 100 600 400",
  portrait: "100 0 400 600",
};
function draw(version: number, brand: string, shape: ShapeId): string {
  const dark = version === 2,
    duo = version === 3,
    warm = version === 4;
  const background = dark
    ? mix(brand, "#000000", 0.62)
    : warm
      ? mix(gold, "#ffffff", 0.78)
      : mix(brand, "#ffffff", 0.86);
  const lattice = dark
    ? mix(brand, "#000000", 0.42)
    : warm
      ? mix(gold, "#ffffff", 0.55)
      : mix(brand, "#ffffff", 0.7);
  const head = dark ? gold : warm ? mix(brand, "#000000", 0.1) : brand;
  const ink = dark
    ? mix(brand, "#000000", 0.3)
    : warm
      ? mix(brand, "#000000", 0.1)
      : brand;
  const ring = mix(brand, "#000000", 0.5);
  const moon = dark ? "#fff3d2" : gold;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${windows[shape]}">` +
    `<defs><pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30 6l6 18 18 6-18 6-6 18-6-18-18-6 18-6z" fill="none" stroke="${lattice}" stroke-width="2"/></pattern>` +
    `<radialGradient id="g" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#ffffff" stop-opacity=".7"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="600" height="600" fill="${background}"/>` +
    (duo
      ? `<path d="M0 600V0h600z" fill="${mix(brand, "#ffffff", 0.7)}" opacity=".7"/>`
      : "") +
    `<rect width="600" height="600" fill="url(#p)"/>` +
    (dark ? "" : `<circle cx="300" cy="300" r="260" fill="url(#g)"/>`) +
    `<rect x="156" y="156" width="300" height="330" rx="28" fill="#000000" opacity=".14"/>` +
    `<rect x="150" y="140" width="300" height="330" rx="28" fill="#ffffff"/>` +
    `<path d="M150 230V168a28 28 0 0 1 28-28h244a28 28 0 0 1 28 28v62z" fill="${head}"/>` +
    `<rect x="214" y="118" width="16" height="44" rx="8" fill="${ring}"/><rect x="370" y="118" width="16" height="44" rx="8" fill="${ring}"/>` +
    `<rect x="190" y="176" width="90" height="12" rx="6" fill="#ffffff" opacity=".85"/><rect x="190" y="198" width="60" height="10" rx="5" fill="#ffffff" opacity=".55"/>` +
    glyphs[["check", "clock", "coins", "bell"][version - 1]](
      ink,
      mix(ink, "#ffffff", 0.84),
    ) +
    `<g transform="translate(470 150) rotate(-24) scale(34)"><path d="M0 -1A1 1 0 0 0 0 1A1.2 1.2 0 0 1 0 -1Z" fill="${moon}"/></g>` +
    `<path d="M120 420l6 16 16 6-16 6-6 16-6-16-16-6 16-6z" fill="${gold}" opacity=".9"/><circle cx="486" cy="418" r="6" fill="${gold}"/><circle cx="104" cy="206" r="5" fill="${lattice}"/>` +
    `</svg>`
  );
}
/** The four versions' pictures in one brand color and shape, as data URIs. */
export const pictures = (color: string, shape: ShapeId): string[] =>
  versions.map(
    (_, index) =>
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(draw(index + 1, color, shape))}`,
  );

/** The campaign's caption, wordy on purpose, and what the two actions do to it. */
export const caption: Text = {
  ar: "أهلًا بكم! حبّينا نذكّركم بأن موعد سداد فاتورتكم قد حان، ونرجو التكرّم بتحويل المبلغ في أقرب فرصة ممكنة حتى نتمكن من مواصلة خدمتكم بأفضل شكل. شكرًا جزيلًا لكم على تعاونكم الدائم معنا.",
  en: "Hi there! We just wanted to remind you that your invoice is now due, and we'd be grateful if you could transfer the amount as soon as you possibly can so that we can keep serving you in the best way. Thank you so much for your continued cooperation with us.",
};
/**
 * Each action rewrites phrases of the caption, in the order they appear:
 * [what it says, what it would say]. A real host sends the text and the action
 * to its model; this one answers with the same rewrite whatever is selected.
 */
export const actions = [
  {
    id: "shorter",
    label: { ar: "أقصر", en: "Shorter" },
    title: { ar: "اجعله أقصر", en: "Make it shorter" },
    rewrites: {
      ar: [
        ["حبّينا نذكّركم بأن موعد", "موعد"],
        [
          "في أقرب فرصة ممكنة حتى نتمكن من مواصلة خدمتكم بأفضل شكل",
          "في أقرب وقت",
        ],
        ["شكرًا جزيلًا لكم على تعاونكم الدائم معنا", "شكرًا لتعاونكم"],
      ],
      en: [
        ["We just wanted to remind you that your", "Your"],
        [
          "as soon as you possibly can so that we can keep serving you in the best way",
          "as soon as possible",
        ],
        [
          "Thank you so much for your continued cooperation with us",
          "Thank you",
        ],
      ],
    },
  },
  {
    id: "formal",
    label: { ar: "أكثر رسمية", en: "More formal" },
    title: { ar: "اجعله أكثر رسمية", en: "Make it more formal" },
    rewrites: {
      ar: [
        ["أهلًا بكم!", "السادة العملاء الكرام،"],
        ["حبّينا نذكّركم", "نود تذكيركم"],
        ["شكرًا جزيلًا لكم على تعاونكم الدائم معنا", "نشكر لكم تعاونكم الدائم"],
      ],
      en: [
        ["Hi there!", "Dear customer,"],
        ["We just wanted to remind you", "We would like to remind you"],
        [
          "Thank you so much for your continued cooperation with us",
          "We thank you for your continued cooperation",
        ],
      ],
    },
  },
] as const satisfies readonly {
  id: string;
  label: Text;
  title: Text;
  rewrites: {
    ar: readonly (readonly [string, string])[];
    en: readonly (readonly [string, string])[];
  };
}[];
