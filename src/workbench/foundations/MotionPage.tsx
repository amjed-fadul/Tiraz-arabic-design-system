import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../system";
import { useSystem } from "../../system/useSystem";
import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";
import "./motion.css";

type Row = readonly [token: string, ar: string, en: string];
interface Group {
  id: string;
  ar: string;
  en: string;
  /** The curve the demo pairs with this group. */
  ease: string;
  /** Stagger and word are gaps between items, not durations. */
  gap?: boolean;
  rows: readonly Row[];
}

const groups: readonly Group[] = [
  {
    id: "press",
    ar: "الضغط والتحرير",
    en: "Press and release",
    ease: "--ease-out",
    rows: [
      [
        "--motion-press",
        "ضغط الزر: شبه فوري",
        "A control being pressed: near-instant",
      ],
      ["--motion-release", "ترك الزر بعد الضغط", "Letting go after a press"],
      ["--motion-fast", "تغيّرات صغيرة سريعة", "Small, quick changes"],
    ],
  },
  {
    id: "state",
    ar: "الحالات",
    en: "State",
    ease: "--ease-out",
    rows: [
      [
        "--motion-state",
        "تبدّل حالة العنصر: تحويم، تحديد، تفعيل",
        "A control changing state: hover, selected, on",
      ],
      [
        "--motion-status",
        "رسم علامة الصح أو الخطأ عند تعيين الحالة",
        "A status glyph drawing its check or cross",
      ],
    ],
  },
  {
    id: "enter-exit",
    ar: "الدخول والخروج",
    en: "Enter and exit",
    ease: "--ease-exit",
    rows: [
      [
        "--motion-enter",
        "ظهور القوائم والعناصر العائمة",
        "Menus and floating elements appearing",
      ],
      [
        "--motion-exit",
        "اختفاؤها: أقصر من الدخول",
        "Leaving: shorter than entering",
      ],
      ["--motion-tooltip-exit", "اختفاء التلميح", "A tooltip leaving"],
    ],
  },
  {
    id: "surfaces",
    ar: "الحوارات واللوحات والتنبيهات",
    en: "Dialogs, panels and toasts",
    ease: "--ease-drawer",
    rows: [
      ["--motion-dialog-enter", "فتح الحوار", "A dialog opening"],
      ["--motion-dialog-exit", "إغلاق الحوار", "A dialog closing"],
      ["--motion-panel", "دخول اللوحة الجانبية", "A side sheet sliding in"],
      [
        "--motion-panel-exit",
        "خروج اللوحة الجانبية",
        "A side sheet sliding out",
      ],
      ["--motion-toast", "ظهور التنبيه", "A toast appearing"],
      ["--motion-toast-exit", "اختفاء التنبيه", "A toast leaving"],
    ],
  },
  {
    id: "collapse",
    ar: "الطيّ",
    en: "Collapse",
    ease: "--ease-out",
    rows: [
      [
        "--motion-collapse",
        "فتح المحتوى القابل للطي",
        "Collapsible content opening",
      ],
      ["--motion-collapse-exit", "طيّه", "Collapsible content closing"],
      [
        "--motion-receipt",
        "طيّ موافقة محسومة إلى إيصال من سطر واحد",
        "A decided approval folding into its one-line receipt",
      ],
    ],
  },
  {
    id: "progress",
    ar: "التقدّم والكشف",
    en: "Progress and reveal",
    ease: "--ease-out",
    rows: [
      [
        "--motion-progress",
        "امتلاء شريط التقدّم",
        "The progress fill advancing",
      ],
      [
        "--motion-reveal",
        "ظهور صورة مولَّدة بعد تحميلها",
        "A generated image crossfading in once loaded",
      ],
    ],
  },
  {
    id: "stagger",
    ar: "التتابع والكلمات",
    en: "Stagger and words",
    ease: "--ease-out",
    gap: true,
    rows: [
      [
        "--motion-stagger",
        "الفاصل بين عناصر تظهر تباعًا",
        "The gap between items appearing in turn",
      ],
      [
        "--motion-word",
        "الفاصل بين كلمات النص المتدفق",
        "The gap between streamed words",
      ],
      [
        "--motion-word-settle",
        "استقرار الكلمة المتدفقة",
        "A streamed word settling",
      ],
    ],
  },
];

const eases: readonly Row[] = [
  [
    "--ease-out",
    "المنحنى الأساسي: الدخول وتغيّر الحالة والتحرير",
    "The main curve: entrances, state changes, release",
  ],
  [
    "--ease-in-out",
    "حركة تبقى على الشاشة: مقبض المفتاح والتكرار",
    "Movement that stays on screen: switch thumbs and loops",
  ],
  [
    "--ease-exit",
    "الخروج: القوائم والتراكبات المغادرة",
    "Leaving: menus and overlays going away",
  ],
  ["--ease-drawer", "اللوحات الجانبية والتنبيهات", "Side sheets and toasts"],
  [
    "--ease-spring",
    "ارتداد خفيف؛ المكوّنات لا تستخدمه افتراضيًا",
    "A slight overshoot; the components do not use it by default",
  ],
];

const loops: readonly Row[] = [
  [
    "--motion-loop-spinner",
    "دوران مؤشر التحميل",
    "The loading spinner turning",
  ],
  ["--motion-loop-skeleton", "لمعان الهياكل المؤقتة", "The skeleton shimmer"],
  [
    "--motion-loop-shimmer",
    "لمعان نص الذكاء الاصطناعي أثناء العمل",
    "Assistant text shimmering while it works",
  ],
  [
    "--motion-loop-progress",
    "شريط التقدّم غير المحدد",
    "The indeterminate progress bar",
  ],
  ["--motion-loop-caret", "وميض مؤشر الكتابة", "The typing caret blinking"],
  ["--motion-loop-turn", "دوران نجمة المساعد", "The assistant mark turning"],
  ["--motion-loop-stitch", "غرز خيط المحادثة", "The thread stitches"],
  ["--motion-loop-pixel", "نبض مؤشر البكسلات", "The pixel loader pulsing"],
  ["--motion-loop-orbit", "مدار مؤشر الانتظار", "The orbit loader"],
];

const tokenNames = [
  ...groups.flatMap((group) => group.rows.map(([token]) => token)),
  ...loops.map(([token]) => token),
  ...eases.map(([token]) => token),
];

/** "cubic-bezier(a, b, c, d)" to four numbers, or null when not a bezier. */
function bezier(value: string | undefined) {
  const match = /^cubic-bezier\(([^)]+)\)$/.exec(value ?? "");
  if (!match) return null;
  const numbers = match[1].split(",").map((part) => parseFloat(part));
  return numbers.length === 4 && numbers.every(Number.isFinite)
    ? numbers
    : null;
}

function Curve({ value }: { value: string | undefined }) {
  const points = bezier(value);
  if (!points) return <span className="motion-curve" aria-hidden="true" />;
  const [x1, y1, x2, y2] = points.map((n) => Math.round(n * 48 * 100) / 100);
  return (
    <svg
      className="motion-curve"
      viewBox="-2 -16 52 68"
      aria-hidden="true"
      focusable="false"
    >
      <path className="motion-curve-box" d="M0 48H48V0H0Z" />
      <path
        className="motion-curve-line"
        d={`M0 48C${x1} ${48 - y1} ${x2} ${48 - y2} 48 0`}
      />
    </svg>
  );
}

function Demo({ group, on }: { group: Group; on: boolean }) {
  return (
    <ul className="motion-demo" aria-hidden="true">
      {group.rows.map(([token]) => (
        <li
          key={token}
          className="motion-track"
          data-on={on}
          data-gap={group.gap ? "true" : undefined}
        >
          <span
            className="motion-dot"
            style={
              group.gap && token !== "--motion-word-settle"
                ? {
                    transitionDuration: "var(--motion-enter)",
                    transitionDelay: `calc(var(${token}) * 3)`,
                    transitionTimingFunction: `var(${group.ease})`,
                  }
                : {
                    transitionDuration: `var(${token})`,
                    transitionTimingFunction: `var(${group.ease})`,
                  }
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function MotionPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  const { config } = useSystem();
  const root = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [system, setSystem] = useState(false);
  const [played, setPlayed] = useState<Record<string, boolean>>({});
  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const style = getComputedStyle(scope);
    const next: Record<string, string> = {};
    for (const token of tokenNames) {
      const value = style.getPropertyValue(token).trim();
      if (value) next[token] = value;
    }
    setValues(next);
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setSystem(!!media?.matches);
    const changed = () => setSystem(!!media?.matches);
    media?.addEventListener("change", changed);
    return () => media?.removeEventListener("change", changed);
  }, [config.reducedMotion, language]);
  const reduced = config.reducedMotion || system;

  const principles: readonly (readonly [string, string])[] = [
    [
      "الضغط شبه فوري ويُترك ببطء أكبر قليلًا، دائمًا بمنحنى الخروج الهادئ لا بالارتداد.",
      "Presses are near-instant and release a little slower, on the ease-out curve, never the spring.",
    ],
    [
      "الدخول أبطأ من الخروج: العنصر يُلاحَظ حين يظهر ويغادر بسرعة.",
      "Entering is slower than exiting: an element is noticed as it arrives and leaves quickly.",
    ],
    [
      "إجراءات لوحة المفاتيح لا تتحرك أبدًا: عند استخدام المفتاح تصبح حركة التفاعل فورية ولا يتقلّص الزر عند الضغط.",
      "Keyboard actions never animate: under keyboard use, interaction motion is instant and presses do not scale.",
    ],
    [
      "تقليل الحركة يزيل الحركة: تنتقل المدد إلى 0ms وتتوقف الحلقات الزخرفية.",
      "Reduced motion removes movement: durations go to 0ms and decorative loops stop.",
    ],
  ];

  return (
    <FoundationPage
      current="motion"
      language={language}
      navigate={navigate}
      title={t("الحركة", "Motion")}
      lede={t(
        "حركة قصيرة وهادئة تشرح ما تغيّر، وتختفي عند تقليل الحركة.",
        "Short, calm motion that explains what changed, and steps aside when motion is reduced.",
      )}
    >
      <div ref={root}>
        <section>
          <h2>{t("المبادئ", "Principles")}</h2>
          <ul className="motion-principles">
            {principles.map(([ar, en]) => (
              <li key={en}>{t(ar, en)}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>{t("المدد", "Durations")}</h2>
          <p>
            {t(
              "كل مدة رمز --motion-*. زر «تشغيل» يحرّك عيّنة بمدة كل رمز في مجموعته ومنحنى مناسب. العيّنات تستخدم الرموز نفسها، فتصبح فورية عند تقليل الحركة، وعند التشغيل بلوحة المفاتيح لأن حركة التفاعل هناك فورية.",
              "Every duration is a --motion-* token. Play moves a sample using each token in its group and a matching curve. The samples use the tokens themselves, so they become instant when motion is reduced, and when played from the keyboard, where interaction motion is instant.",
            )}
          </p>
          {groups.map((group) => (
            <div key={group.id} className="motion-group">
              <div className="motion-group-head">
                <h3>{t(group.ar, group.en)}</h3>
                <Button
                  variant="secondary"
                  aria-label={`${t("تشغيل", "Play")}: ${t(group.ar, group.en)}`}
                  onClick={() =>
                    setPlayed((state) => ({
                      ...state,
                      [group.id]: !state[group.id],
                    }))
                  }
                >
                  {t("تشغيل", "Play")}
                </Button>
              </div>
              <ul className="motion-rows">
                {group.rows.map(([token, ar, en]) => (
                  <li key={token} className="motion-row">
                    <code dir="ltr">{token}</code>
                    <span className="motion-value" dir="ltr">
                      {values[token] ?? "—"}
                    </span>
                    <span className="motion-use">{t(ar, en)}</span>
                  </li>
                ))}
              </ul>
              <Demo group={group} on={!!played[group.id]} />
              <p className="motion-ease">
                {t("المنحنى: ", "Curve: ")}
                <code dir="ltr">{group.ease}</code>
                {group.gap
                  ? t(
                      " — الفاصل يؤخّر ظهور كل نقطة عن التي قبلها.",
                      " — each dot is delayed by the gap after the one before.",
                    )
                  : null}
              </p>
            </div>
          ))}
        </section>

        <section>
          <h2>{t("المنحنيات", "Easing")}</h2>
          <p>
            {t("خمسة منحنيات. ", "Five curves. ")}
            <code dir="ltr">--ease</code>
            {t(" اسم مستعار لـ --ease-out.", " is an alias of --ease-out.")}
          </p>
          <ul className="motion-rows motion-eases">
            {eases.map(([token, ar, en]) => (
              <li key={token} className="motion-row">
                <code dir="ltr">{token}</code>
                <Curve value={values[token]} />
                <span className="motion-value" dir="ltr">
                  {values[token] ?? "—"}
                </span>
                <span className="motion-use">{t(ar, en)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>{t("الحلقات", "Loops")}</h2>
          <p>
            {t(
              "حلقات زخرفية تدل على أن العمل جارٍ. تتوقف عند تقليل الحركة.",
              "Decorative loops that show work is in progress. They stop when motion is reduced.",
            )}
          </p>
          <ul className="motion-rows">
            {loops.map(([token, ar, en]) => (
              <li key={token} className="motion-row">
                <code dir="ltr">{token}</code>
                <span className="motion-value" dir="ltr">
                  {values[token] ?? "—"}
                </span>
                <span className="motion-use">{t(ar, en)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>{t("تقليل الحركة", "Reduced motion")}</h2>
          <p className="motion-state" data-reduced={reduced}>
            {t("الحالة الحالية: ", "Current state: ")}
            <strong>
              {reduced
                ? t("الحركة مُقلَّلة", "Motion is reduced")
                : t("الحركة كاملة", "Full motion")}
            </strong>
            {" — "}
            {config.reducedMotion
              ? t("من إعداد النظام في التطبيق", "from the application setting")
              : system
                ? t(
                    "من تفضيل نظام التشغيل",
                    "from the operating system preference",
                  )
                : t(
                    "لا إعداد ولا تفضيل يطلب تقليلها",
                    "neither the setting nor the system asks for it",
                  )}
            .
          </p>
          <ul className="motion-principles">
            <li>
              {t(
                "كل رموز --motion-* تصبح 0ms، والانتقالات والرسوم تُنفَّذ فورًا وتنتهي الحلقات بدورة واحدة.",
                "Every --motion-* token becomes 0ms, transitions and animations run instantly, and loops end after a single cycle.",
              )}
            </li>
            <li>
              {t(
                "يبقى تلاشي الصورة المنسوجة: تظهر الصورة كاملة بتغيّر في الشفافية خلال ",
                "The woven-image fade survives: an image that would have been woven in fades in whole, an opacity change over ",
              )}
              <code dir="ltr">--weave-fade</code>
              {t(
                "، وليس حركة، ولذلك ليس رمز --motion-.",
                ", not movement, so it is not a --motion- token.",
              )}
            </li>
            <li>
              {t(
                "يُفعَّل عبر تفضيل نظام التشغيل ",
                "It switches on through the operating system's ",
              )}
              <code dir="ltr">prefers-reduced-motion</code>
              {t(" أو عبر إعداد ", ", or through the ")}
              <code dir="ltr">reducedMotion</code>
              {t(
                " في إعدادات النظام لدى المزوّد.",
                " setting in the provider's config.",
              )}
            </li>
          </ul>
        </section>
      </div>
    </FoundationPage>
  );
}
