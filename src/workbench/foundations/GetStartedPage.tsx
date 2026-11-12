import { useId } from "react";
import { numberLocale } from "../../system/config";
import { localize, words } from "../i18n";
import { sectionEntries, sectionNames } from "../navigation-model";
import { SiteLink } from "../SiteLink";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";

export function GetStartedPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  const id = useId();
  const number = new Intl.NumberFormat(
    numberLocale({ numerals: "arab" }, language),
  );
  // The same entries the sidebar counts for its sections.
  const counts = [
    {
      value: sectionEntries("components", language).length,
      label: localize(sectionNames.components, language),
    },
    {
      value: sectionEntries("ai", language).length,
      label: localize(sectionNames.ai, language),
    },
    {
      value: sectionEntries("screens", language).length,
      label: localize(sectionNames.screens, language),
    },
  ];
  const installation = (
    <SiteLink route={{ kind: "start" }} navigate={navigate}>
      {t("طريقة التثبيت", "See installation")}
    </SiteLink>
  );
  return (
    <FoundationPage
      current="get-started"
      language={language}
      navigate={navigate}
      title={t("ابدأ هنا", "Get started")}
      lede={t(
        "نظام تصميم لـ React يبدأ من العربية، تنسخه إلى تطبيقك وتملكه.",
        "An Arabic-first React design system that you copy into your app and own.",
      )}
    >
      <section aria-labelledby={`${id}-what`}>
        <h2 id={`${id}-what`}>{t("ما هو طِراز؟", "What is Tiraz?")}</h2>
        <p>
          {t(
            "طِراز مجموعة من مكوّنات React والشاشات وواجهات المساعد، مصمَّمة للعربية أولًا ولاتجاه الكتابة من اليمين إلى اليسار. والإنجليزية فيها بالمرتبة نفسها. يقوم كل شيء على رموز قليلة للألوان والخطوط والمسافات والأشكال.",
            "Tiraz is a set of React components, screens and assistant interfaces designed for Arabic and right-to-left layouts first, with English as an equal. Everything is built on a small set of tokens for color, type, space and shape.",
          )}
        </p>
      </section>
      <section aria-labelledby={`${id}-ways`}>
        <h2 id={`${id}-ways`}>
          {t("طريقتان للاستخدام", "Two ways to use it")}
        </h2>
        <div className="foundation-cards">
          <div className="foundation-card">
            <h3>{t("ثبّت الحزمة", "Install the package")}</h3>
            <p>
              {t(
                "أضف الحزمة واستورد الأنماط، ثم استخدم المكوّنات كأي مكتبة أخرى.",
                "Add the package, import the styles and use the components like any other library.",
              )}
            </p>
            <p>{installation}</p>
          </div>
          <div className="foundation-card">
            <h3>{t("امتلك الشيفرة", "Own the source")}</h3>
            <p>
              {t(
                "انسخ المكوّنات إلى مشروعك وعدّلها كما تشاء. ويجلب الأمر ",
                "Copy the components into your project and change them freely. ",
              )}
              {language === "ar" ? (
                <>
                  <code dir="ltr">tiraz update</code>
                  {" الإصدارات الجديدة دون أن يمحو تعديلاتك."}
                </>
              ) : (
                <>
                  Run <code>tiraz update</code> to bring in new versions without
                  losing your edits.
                </>
              )}
            </p>
            <p>{installation}</p>
          </div>
        </div>
      </section>
      <section aria-labelledby={`${id}-inside`}>
        <h2 id={`${id}-inside`}>{t("ماذا في الداخل", "What's inside")}</h2>
        <p>
          {t(
            "كل ما في المكتبة اليوم، بالأعداد نفسها الظاهرة في القائمة الجانبية.",
            "Everything in the library today, counted the same way as the sidebar.",
          )}
        </p>
        <ul className="foundation-counts">
          {counts.map((item) => (
            <li key={item.label}>
              <strong>{number.format(item.value)}</strong>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby={`${id}-principles`}>
        <h2 id={`${id}-principles`}>{t("المبادئ", "Principles")}</h2>
        <ul className="foundation-principles">
          <li>
            <strong>{t("العربية أولًا. ", "Arabic first. ")}</strong>
            {t(
              "نبدأ من الكتابة العربية واتجاهها، ثم نتأكد أن الإنجليزية تعمل بالجودة نفسها.",
              "We start from Arabic text and its direction, then make sure English works just as well.",
            )}
          </li>
          <li>
            <strong>{t("الشيفرة لك. ", "You own it. ")}</strong>
            {t(
              "تعيش المكوّنات في مشروعك، فتعدّلها دون انتظار أحد.",
              "Components live in your project, so you can change them without waiting on anyone.",
            )}
          </li>
          <li>
            <strong>{t("جاهز للمساعدين. ", "Ready for agents. ")}</strong>
            {t(
              "فهرس وأمثلة ترشد مساعد البرمجة إلى المكوّن المناسب.",
              "A registry and examples guide your coding agent to the right component.",
            )}
          </li>
          <li>
            <strong>{t("متاح للجميع. ", "Accessible. ")}</strong>
            {t(
              "لوحة المفاتيح وقارئات الشاشة والتباين جزء من كل مكوّن.",
              "Keyboard, screen readers and contrast are part of every component.",
            )}
          </li>
        </ul>
      </section>
    </FoundationPage>
  );
}
