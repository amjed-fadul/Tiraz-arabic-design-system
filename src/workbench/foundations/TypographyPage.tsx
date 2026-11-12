import { useLayoutEffect, useRef, useState } from "react";
import { numberLocale } from "../../system/config";
import { useSystem } from "../../system/useSystem";
import { words } from "../i18n";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";
import "./typography.css";

interface Role {
  id: string;
  leading: string;
  weight: string;
  use: readonly [string, string];
}

const roles: readonly Role[] = [
  {
    id: "display",
    leading: "--leading-display",
    weight: "--weight-semibold",
    use: ["أرقام وعناوين الصفحات الترحيبية", "Welcome pages and hero headings"],
  },
  {
    id: "title",
    leading: "--leading-title",
    weight: "--weight-semibold",
    use: ["عناوين الصفحات", "Page titles"],
  },
  {
    id: "heading",
    leading: "--leading-heading",
    weight: "--weight-semibold",
    use: ["عناوين الأقسام", "Section headings"],
  },
  {
    id: "subheading",
    leading: "--leading-heading",
    weight: "--weight-semibold",
    use: ["عناوين البطاقات والمجموعات", "Card and group headings"],
  },
  {
    id: "reading",
    leading: "--leading-reading",
    weight: "--weight-regular",
    use: ["النصوص الطويلة والإجابات", "Long text and answers"],
  },
  {
    id: "body",
    leading: "--line-height",
    weight: "--weight-regular",
    use: ["نص الواجهة العادي", "Everyday interface text"],
  },
  {
    id: "label",
    leading: "--line-height",
    weight: "--weight-medium",
    use: ["تسميات الحقول والأزرار", "Field and button labels"],
  },
  {
    id: "meta",
    leading: "--leading-meta",
    weight: "--weight-regular",
    use: ["التواريخ والنصوص المساعدة", "Dates and helper text"],
  },
  {
    id: "micro",
    leading: "--leading-micro",
    weight: "--weight-medium",
    use: ["الشارات والتسميات الصغيرة", "Badges and tiny captions"],
  },
  {
    id: "figure",
    leading: "--leading-figure",
    weight: "--weight-semibold",
    use: ["الأرقام الكبيرة في المؤشرات", "Large numbers in metrics"],
  },
  {
    id: "figure-small",
    leading: "--leading-figure",
    weight: "--weight-semibold",
    use: ["أرقام البطاقات المدمجة", "Numbers in compact cards"],
  },
];

const samples: Record<string, readonly [string, string]> = {
  display: ["مرحبًا بك في لوحة المبيعات", "Welcome to your sales dashboard"],
  title: ["نظرة عامة على الطلبات", "Orders overview"],
  heading: ["الطلبات المتأخرة هذا الأسبوع", "Late orders this week"],
  subheading: ["ملخص العميل", "Customer summary"],
  reading: [
    "تم شحن الطلب صباح اليوم، ومن المتوقع أن يصل خلال يومين عمل إلى عنوان التسليم المسجّل.",
    "Your order shipped this morning and should reach the saved delivery address within two working days.",
  ],
  body: [
    "تحديث حالة الطلب ورقم الشحنة",
    "Update the order status and tracking",
  ],
  label: ["اسم العميل", "Customer name"],
  meta: ["آخر تحديث قبل ٣ دقائق", "Last updated 3 minutes ago"],
  micro: ["جديد", "New"],
};

const weights = [
  {
    token: "--weight-regular",
    ar: ["عادي", "نص الواجهة والقراءة الطويلة"],
    en: ["Regular", "Interface text and long reading"],
  },
  {
    token: "--weight-medium",
    ar: ["متوسط", "التسميات والأزرار"],
    en: ["Medium", "Labels and buttons"],
  },
  {
    token: "--weight-semibold",
    ar: ["نصف عريض", "العناوين والأرقام"],
    en: ["Semibold", "Headings and figures"],
  },
] as const;

interface Measured {
  size: string;
  leading: string;
  weight: string;
}

const cleanPx = (value: string) =>
  value.endsWith("px") ? `${parseFloat(value)}px` : value;

export function TypographyPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  const { config } = useSystem();
  const root = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<Record<string, Measured>>({});
  useLayoutEffect(() => {
    const next: Record<string, Measured> = {};
    root.current
      ?.querySelectorAll<HTMLElement>("[data-role]")
      .forEach((element) => {
        const style = getComputedStyle(element);
        next[element.dataset.role ?? ""] = {
          size: cleanPx(style.fontSize),
          leading: cleanPx(style.lineHeight),
          weight: style.fontWeight,
        };
      });
    setMeasured(next);
  }, [config.typography, config.direction, language]);

  const figures = (id: string, locale: "ar" | "en") => {
    const format = (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(numberLocale(config, locale), options).format(
        value,
      );
    if (id === "figure")
      return locale === "ar"
        ? `${format(128450, { style: "currency", currency: "SAR", maximumFractionDigits: 0 })}`
        : format(128450, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          });
    return locale === "ar"
      ? `${format(0.92, { style: "percent" })} تسليم في الوقت`
      : `${format(0.92, { style: "percent" })} on-time delivery`;
  };
  const large = config.typography === "large";

  return (
    <FoundationPage
      current="typography"
      language={language}
      navigate={navigate}
      title={t("الخطوط", "Typography")}
      lede={t(
        "خط IBM Plex Sans Arabic بثلاثة أوزان؛ كل دور يحدد الحجم وارتفاع السطر والوزن معًا.",
        "IBM Plex Sans Arabic in three weights; each role sets size, line height and weight together.",
      )}
    >
      <div ref={root}>
        <section>
          <h2>{t("الخط", "Typeface")}</h2>
          <p>
            <code dir="ltr">--font</code>
            {t(" = ", " = ")}
            <bdi>IBM Plex Sans Arabic</bdi>
            {t(
              "، ويعود إلى خط النظام عند غيابه.",
              ", falling back to the system font when it is missing.",
            )}
          </p>
          <ul className="type-weights">
            {weights.map((weight) => (
              <li
                key={weight.token}
                style={{ fontWeight: `var(${weight.token})` }}
              >
                <span lang="ar" dir="rtl">
                  {weight.ar[0]} · {weight.ar[1]}
                </span>
                <span lang="en" dir="ltr">
                  {weight.en[0]} · {weight.en[1]}
                </span>
                <code dir="ltr">{weight.token}</code>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>{t("الأدوار", "Roles")}</h2>
          <p>
            {t(
              "اختر الدور حسب وظيفة النص، لا حسب الحجم. كل سطر أدناه يستخدم الرموز الفعلية.",
              "Pick a role by what the text does, not by its size. Each line below uses the real tokens.",
            )}
          </p>
          <ul className="type-roles">
            {roles.map((role) => {
              const live = measured[role.id];
              const style = {
                fontSize: `var(--text-${role.id})`,
                lineHeight: `var(${role.leading})`,
                fontWeight: `var(${role.weight})`,
              };
              const lines = samples[role.id];
              return (
                <li key={role.id} className="type-role">
                  <div className="type-specimen">
                    <p lang="ar" dir="rtl" data-role={role.id} style={style}>
                      {lines ? lines[0] : figures(role.id, "ar")}
                    </p>
                    <p lang="en" dir="ltr" style={style}>
                      {lines ? lines[1] : figures(role.id, "en")}
                    </p>
                  </div>
                  <div className="type-spec">
                    <code dir="ltr">{`--text-${role.id}`}</code>
                    <span dir="ltr" className="type-values">
                      {live
                        ? `${live.size} · ${live.leading} · ${live.weight}`
                        : "—"}
                    </span>
                    <code dir="ltr">{role.leading}</code>
                    <span>{t(role.use[0], role.use[1])}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2>{t("الخط الكبير", "Large type")}</h2>
          <p>
            {t(
              "إعداد الخط الكبير يرفع حجم كل الأدوار بدرجة أو أكثر، ويبقي نسب ارتفاع السطر كما هي. الإعداد الحالي: ",
              "The Large type setting raises every role by a step or more and keeps the line-height ratios. Current setting: ",
            )}
            <strong>
              {large ? t("كبير", "Large") : t("عادي", "Standard")}
            </strong>
            .
          </p>
        </section>
      </div>
    </FoundationPage>
  );
}
