import { useId } from "react";
import { accentColors, numberLocale } from "../../system/config";
import type { Accent } from "../../system/config";
import { useSystem } from "../../system/useSystem";
import { optionNames } from "../fields";
import type { Language } from "../i18n";
import { localize, words } from "../i18n";
import { contrastLevel, contrastRatio } from "./contrast";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";
import { TokenRow, TokenTable } from "./TokenRow";
import { useTokenValues } from "./useTokenValues";
import "./colors.css";

type Use = [ar: string, en: string];
type Group = {
  id: string;
  title: Use;
  /** Text tokens carry a contrast badge against --surface. */
  contrast?: boolean;
  tokens: [name: string, use: Use][];
};

const groups: Group[] = [
  {
    id: "text",
    title: ["النص", "Text"],
    contrast: true,
    tokens: [
      ["--text", ["العناوين والمحتوى الأساسي", "Headings and primary content"]],
      [
        "--text-secondary",
        ["الوصف والنص الداعم", "Descriptions and supporting text"],
      ],
      ["--text-muted", ["الملاحظات والبيانات الوصفية", "Hints and metadata"]],
    ],
  },
  {
    id: "surfaces",
    title: ["الأسطح", "Surfaces"],
    tokens: [
      ["--surface-page", ["خلفية الصفحة", "The page background"]],
      [
        "--surface",
        ["الورقة التي يجلس عليها المحتوى", "The paper content sits on"],
      ],
      [
        "--surface-subtle",
        ["مناطق خافتة داخل الورقة", "Quiet areas inside paper"],
      ],
      [
        "--surface-hover",
        ["حالة التمرير على العناصر", "Hover state of rows and items"],
      ],
      [
        "--surface-tray",
        ["الحالة والبيانات الوصفية والقرارات", "Status, meta and decisions"],
      ],
      [
        "--surface-well",
        [
          "الشيفرة والمخرجات في حوض داخل الورقة",
          "Code and output in a well cut into the paper",
        ],
      ],
    ],
  },
  {
    id: "borders",
    title: ["الحدود", "Borders"],
    tokens: [
      ["--border", ["الفواصل وحدود البطاقات", "Dividers and card edges"]],
      [
        "--border-strong",
        ["حدود أوضح للفصل بين المناطق", "Firmer edges between areas"],
      ],
      [
        "--border-field",
        [
          "حدود الحقول، بتباين 3:1 على الأسطح",
          "Field edges, 3:1 against surfaces",
        ],
      ],
    ],
  },
  {
    id: "action",
    title: ["الإجراء", "Action"],
    tokens: [
      [
        "--action",
        [
          "الزر الأساسي والروابط والعناصر المحدّدة، ويتبع اللون المميّز",
          "Primary buttons, links and selected items; follows the accent",
        ],
      ],
      [
        "--action-hover",
        ["حالة التمرير على عنصر الإجراء", "Hover state of an action"],
      ],
      [
        "--action-soft",
        ["خلفية خافتة للعنصر المحدّد", "A soft fill for selected items"],
      ],
      [
        "--action-border",
        ["حد عنصر الإجراء الخافت", "A soft edge for action surfaces"],
      ],
      ["--action-text", ["النص فوق لون الإجراء", "Text on the action color"]],
    ],
  },
  {
    id: "status",
    title: ["الحالة", "Status"],
    tokens: [
      ["--success", ["النجاح والاكتمال", "Success and completion"]],
      [
        "--success-soft",
        ["خلفية رسائل النجاح", "Fill behind success messages"],
      ],
      [
        "--danger",
        ["الأخطاء والإجراءات الهدّامة", "Errors and destructive actions"],
      ],
      ["--danger-soft", ["خلفية رسائل الخطأ", "Fill behind error messages"]],
      ["--info", ["المعلومات والتلميحات", "Information and tips"]],
      [
        "--info-soft",
        ["خلفية الرسائل المعلوماتية", "Fill behind informational messages"],
      ],
      ["--attention", ["التنبيه والتحذير", "Warnings and attention"]],
      ["--attention-soft", ["خلفية التنبيهات", "Fill behind warnings"]],
      [
        "--ai",
        [
          "كل ما يصدر عن المساعد، ولا يتبع اللون المميّز",
          "Anything from the assistant; does not follow the accent",
        ],
      ],
      ["--ai-soft", ["خلفية عناصر المساعد", "Fill behind assistant elements"]],
    ],
  },
  {
    id: "focus",
    title: ["التركيز", "Focus"],
    tokens: [
      [
        "--focus",
        [
          "حلقة التركيز بلوحة المفاتيح، وتتبع لون الإجراء",
          "The keyboard focus ring; follows the action color",
        ],
      ],
    ],
  },
  {
    id: "charts",
    title: ["المخطّطات", "Charts"],
    tokens: [
      ["--chart-sage", ["السلسلة الأولى في المخطّط", "First chart series"]],
      ["--chart-blue", ["السلسلة الثانية", "Second series"]],
      ["--chart-plum", ["السلسلة الثالثة", "Third series"]],
      ["--chart-clay", ["السلسلة الرابعة", "Fourth series"]],
    ],
  },
];

const tokenNames = [...groups.flatMap((g) => g.tokens.map(([name]) => name))];

/** "AA 14.7:1" with the language's digits; empty when the ratio is unknown. */
export function contrastBadge(
  value: string,
  surface: string,
  language: Language,
  numerals: "arab" | "latn" = "arab",
): { text: string; failed: boolean } | undefined {
  const ratio = contrastRatio(value, surface);
  if (!Number.isFinite(ratio)) return undefined;
  const number = new Intl.NumberFormat(numberLocale({ numerals }, language), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const one = new Intl.NumberFormat(
    numberLocale({ numerals }, language),
  ).format(1);
  const level = contrastLevel(ratio);
  const t = words(language);
  const name =
    level === "AA large"
      ? t("AA للنص الكبير", "AA large")
      : level === "Fails"
        ? t("لا يجتاز", "Fails")
        : level;
  const figure = `${number.format(Math.floor(ratio * 10) / 10)}:${one}`;
  return {
    text: `${name} ${language === "ar" ? `‏${figure}` : figure}`,
    failed: level === "Fails",
  };
}

export function ColorsPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  const id = useId();
  const { config } = useSystem();
  const theme = config.theme;
  const values = useTokenValues(tokenNames);
  const byName = new Map(values.map((value) => [value.name, value]));
  const surface = byName.get("--surface")?.[theme] ?? "";
  return (
    <FoundationPage
      current="colors"
      language={language}
      navigate={navigate}
      title={t("الألوان", "Colors")}
      lede={t(
        "ألوان دلالية للأسطح والنص والحدود والحالة. كل قيمة تُقرأ من الـCSS الحي، فتتبع لونك المميّز ووضعك.",
        "Semantic colors for surfaces, text, borders and status. Every value is read from the live CSS, so it follows your accent and theme.",
      )}
    >
      <section aria-labelledby={`${id}-accent`}>
        <h2 id={`${id}-accent`}>{t("اللون المميّز", "Accent")}</h2>
        <ul
          className="accent-strip"
          aria-label={t("الألوان المميّزة", "Accent colors")}
        >
          {(Object.keys(accentColors) as Accent[]).map((accent) => {
            const current = accent === config.accent;
            return (
              <li key={accent}>
                <span
                  className="accent-swatch"
                  role="img"
                  aria-label={localize(optionNames[accent], language)}
                  aria-current={current ? "true" : undefined}
                  data-current={current ? "true" : undefined}
                  style={{ backgroundColor: accentColors[accent][theme] }}
                />
              </li>
            );
          })}
        </ul>
        <p>
          {t("اللون المميّز يحدّد ", "The accent drives ")}
          <code>--action</code>
          {t(
            " ودرجاته الخافتة وحالة التمرير والحد. غيّره من الإعدادات.",
            " and its soft, hover and border variants. Change it in Settings.",
          )}
        </p>
      </section>
      {groups.map((group) => {
        const title = t(group.title[0], group.title[1]);
        return (
          <section key={group.id} aria-labelledby={`${id}-${group.id}`}>
            <h2 id={`${id}-${group.id}`}>{title}</h2>
            <TokenTable language={language} label={title}>
              {group.tokens.map(([name, use]) => {
                const value = byName.get(name);
                const badge = group.contrast
                  ? contrastBadge(
                      value?.[theme] ?? "",
                      surface,
                      language,
                      config.numerals,
                    )
                  : undefined;
                return (
                  <TokenRow
                    key={name}
                    name={name}
                    light={value?.light ?? ""}
                    dark={value?.dark ?? ""}
                    use={t(use[0], use[1])}
                    language={language}
                    badge={
                      badge && (
                        <span
                          className="contrast-badge"
                          data-failed={badge.failed ? "true" : undefined}
                          title={t(
                            "التباين مع --surface",
                            "Contrast against --surface",
                          )}
                        >
                          {badge.text}
                        </span>
                      )
                    }
                  />
                );
              })}
            </TokenTable>
          </section>
        );
      })}
    </FoundationPage>
  );
}
