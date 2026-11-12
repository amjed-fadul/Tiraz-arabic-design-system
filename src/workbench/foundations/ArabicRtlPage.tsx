import { useId } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ChevronsRight,
  Clock,
  Play,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Button, useSystem } from "../../system";
import { numberLocale } from "../../system/config";
import type { Numerals } from "../../system/config";
import { words } from "../i18n";
import type { Language } from "../i18n";
import { SiteLink } from "../SiteLink";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";
import "./arabic-rtl.css";

const providerSnippet = `<div lang="ar" dir="rtl">
  <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
    <App />
  </SystemProvider>
</div>`;

const mirrored: [string, ReactNode][] = [
  ["ArrowRight", <ArrowRight key="a" size={18} className="tz-mirror-rtl" />],
  [
    "ChevronRight",
    <ChevronRight key="c" size={18} className="tz-mirror-rtl" />,
  ],
  [
    "ChevronsRight",
    <ChevronsRight key="d" size={18} className="tz-mirror-rtl" />,
  ],
];
const fixed: [string, ReactNode][] = [
  ["Search", <Search key="s" size={18} />],
  ["Check", <Check key="k" size={18} />],
  ["Clock", <Clock key="t" size={18} />],
  ["Play", <Play key="p" size={18} />],
];

const sample = {
  integer: 1234567,
  decimal: 1234.56,
  percent: 0.375,
  currency: 2450,
  date: new Date(Date.UTC(2026, 10, 12)),
};

function formats(locale: string) {
  const timeZone = "UTC";
  return [
    new Intl.NumberFormat(locale).format(sample.integer),
    new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
      sample.decimal,
    ),
    new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(sample.percent),
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "SAR",
    }).format(sample.currency),
    new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone }).format(
      sample.date,
    ),
  ];
}

function Pair({
  language,
  render,
}: {
  language: Language;
  render: (direction: "rtl" | "ltr") => ReactNode;
}) {
  const t = words(language);
  return (
    <div className="arabic-pair">
      {(["rtl", "ltr"] as const).map((direction) => (
        <figure key={direction} className="arabic-box-figure">
          <figcaption>
            {direction === "rtl"
              ? t("من اليمين إلى اليسار", "Right to left")
              : t("من اليسار إلى اليمين", "Left to right")}
          </figcaption>
          <div
            className="arabic-box"
            data-testid={`box-${direction}`}
            dir={direction}
            lang={direction === "rtl" ? "ar" : "en"}
          >
            {render(direction)}
          </div>
        </figure>
      ))}
    </div>
  );
}

export function ArabicRtlPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  const id = useId();
  const { config } = useSystem();
  const numerals: Numerals = config.numerals ?? "arab";
  const columns: { key: string; label: string; locale: string; dir: string }[] =
    [
      {
        key: "arab",
        label: t("عربي، أرقام هندية", "Arabic, Arabic-Indic"),
        locale: numberLocale({ numerals: "arab" }, "ar"),
        dir: "rtl",
      },
      {
        key: "latn",
        label: t("عربي، أرقام لاتينية", "Arabic, Latin"),
        locale: numberLocale({ numerals: "latn" }, "ar"),
        dir: "rtl",
      },
      {
        key: "en",
        label: t("إنجليزي", "English"),
        locale: numberLocale({ numerals: "latn" }, "en"),
        dir: "ltr",
      },
    ];
  const rows = [
    t("عدد صحيح", "Integer"),
    t("عدد عشري", "Decimal"),
    t("نسبة", "Percentage"),
    t("مبلغ بالريال", "Currency (SAR)"),
    t("تاريخ", "Date"),
  ];
  const values = columns.map((column) => formats(column.locale));
  return (
    <FoundationPage
      current="arabic-rtl"
      language={language}
      navigate={navigate}
      title={t("العربية والاتجاه", "Arabic and RTL")}
      lede={t(
        "العربية هي نقطة البداية، وكل مكوّن يعمل من اليمين إلى اليسار ومن اليسار إلى اليمين.",
        "Arabic is the starting point; every component works right-to-left and left-to-right.",
      )}
    >
      <section aria-labelledby={`${id}-direction`}>
        <h2 id={`${id}-direction`}>
          {t("الاتجاه والتخطيط", "Direction and layout")}
        </h2>
        <p>
          {t(
            "يعتمد طِراز على خصائص منطقية مثل بداية السطر ونهايته، فينعكس التخطيط وحده عند تغيّر الاتجاه. ضع ",
            "Tiraz uses logical properties such as inline start and end, so layout mirrors on its own when direction changes. Put ",
          )}
          <code>lang</code>
          {t(" و", " and ")}
          <code>dir</code>
          {t(
            " على عنصر يحيط بالتطبيق كله.",
            " on an ancestor that wraps the whole app.",
          )}
        </p>
        <pre className="arabic-code" dir="ltr" tabIndex={0}>
          <code>{providerSnippet}</code>
        </pre>
        <Pair
          language={language}
          render={(direction) => (
            <div className="arabic-row">
              <Button variant="secondary">
                {direction === "rtl" ? "التالي" : "Next"}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="tz-mirror-rtl"
                />
              </Button>
              <Badge tone="success">
                {direction === "rtl" ? "جاهز" : "Ready"}
              </Badge>
            </div>
          )}
        />
      </section>

      <section aria-labelledby={`${id}-icons`}>
        <h2 id={`${id}-icons`}>{t("الأيقونات", "Icons")}</h2>
        <p>
          {t(
            "تنعكس الأيقونات التي تدل على اتجاه، كالأسهم والأقواس والسابق والتالي، عبر الصنف ",
            "Icons that point somewhere flip: arrows, chevrons, back and next. Tiraz does it with the ",
          )}
          <code>tz-mirror-rtl</code>
          {t(
            ". أما البحث والتحقق والساعة وتشغيل الوسائط فلا تنعكس.",
            " class. Search, check, clock and media play keep their shape.",
          )}
        </p>
        <div className="arabic-pair">
          <figure className="arabic-box-figure">
            <figcaption>{t("تنعكس", "Mirrored")}</figcaption>
            <ul
              className="arabic-box arabic-icons"
              dir="rtl"
              data-testid="icons-mirrored"
            >
              {mirrored.map(([name, icon]) => (
                <li key={name}>
                  {icon}
                  <code dir="ltr">{name}</code>
                </li>
              ))}
            </ul>
          </figure>
          <figure className="arabic-box-figure">
            <figcaption>{t("لا تنعكس", "Not mirrored")}</figcaption>
            <ul className="arabic-box arabic-icons" dir="rtl">
              {fixed.map(([name, icon]) => (
                <li key={name}>
                  {icon}
                  <code dir="ltr">{name}</code>
                </li>
              ))}
            </ul>
          </figure>
        </div>
      </section>

      <section aria-labelledby={`${id}-numbers`}>
        <h2 id={`${id}-numbers`}>{t("الأرقام", "Numbers and digits")}</h2>
        <p>
          {t(
            "يختار الإعداد numerals الأرقام الهندية (arab) أو اللاتينية (latn) في النص العربي، والإنجليزية لاتينية دائمًا. صيغ أرقام تطبيقك بالدالة numberLocale.",
            "The numerals setting picks Arabic-Indic (arab) or Latin (latn) digits for Arabic text; English is always Latin. Format your own figures with numberLocale.",
          )}{" "}
          {t("الإعداد الحالي: ", "Current setting: ")}
          <code>{numerals}</code>
        </p>
        {/* Scrolls sideways on phones, so keyboards must be able to reach it. */}
        <div
          className="arabic-table-wrap"
          role="region"
          aria-labelledby={`${id}-numbers`}
          tabIndex={0}
        >
          <table className="arabic-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="arabic-visually-hidden">
                    {t("القيمة", "Value")}
                  </span>
                </th>
                {columns.map((column) => (
                  <th key={column.key} scope="col">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row}>
                  <th scope="row">{row}</th>
                  {columns.map((column, c) => (
                    <td
                      key={column.key}
                      data-column={column.key}
                      dir={column.dir}
                      lang={column.key === "en" ? "en" : "ar"}
                    >
                      <bdi>{values[c][index]}</bdi>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {t(
            "أرقام Plex الهندية متناسبة العرض، فاختر latn إن كانت الأعمدة تحتاج محاذاة.",
            "Plex's Arabic-Indic digits are proportional, so choose latn where columns must align.",
          )}
        </p>
      </section>

      <section aria-labelledby={`${id}-mixed`}>
        <h2 id={`${id}-mixed`}>{t("النص المختلط", "Mixed text")}</h2>
        <p>
          {t(
            'لف الأسماء التي يكتبها المستخدم بالوسم bdi، والمعرّفات اللاتينية بـ bdi dir="ltr"، فيبقى ترتيب الكلمات وعلامات الترقيم سليمًا.',
            'Wrap user-provided names in bdi, and Latin identifiers in bdi dir="ltr", so word order and punctuation stay correct.',
          )}
        </p>
        <div
          className="arabic-box arabic-mixed"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {language === "ar" ? (
            <p data-testid="mixed">
              أُرسلت الفاتورة <bdi dir="ltr">INV-42</bdi> إلى{" "}
              <bdi>Sara Ahmed</bdi>، والموعد <bdi dir="ltr">2026-11-12</bdi>.
            </p>
          ) : (
            <p data-testid="mixed">
              Invoice <bdi dir="ltr">INV-42</bdi> was sent to{" "}
              <bdi>سارة أحمد</bdi>, due <bdi dir="ltr">2026-11-12</bdi>.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby={`${id}-type`}>
        <h2 id={`${id}-type`}>{t("الخط العربي", "Arabic typography")}</h2>
        <p>
          {t(
            "خط IBM Plex Sans Arabic، بتباعد أسطر أوسع للعربية. لا تضف تباعدًا بين الحروف فهو يقطع اتصالها، ولا تستخدم الخط المائل. ",
            "IBM Plex Sans Arabic, with generous line height for Arabic. Never add letter-spacing, which breaks letter joining, and never use italics. ",
          )}
          <SiteLink
            route={{ kind: "foundation", id: "typography" }}
            navigate={navigate}
          >
            {t("صفحة الخطوط", "See Typography")}
          </SiteLink>
        </p>
      </section>
    </FoundationPage>
  );
}
