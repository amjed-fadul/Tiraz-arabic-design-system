import { useId } from "react";
import { Check, Search, Settings, Trash2 } from "lucide-react";
import { AIMark, Button, sidebarIconNames } from "../../system";
import { numberLocale } from "../../system/config";
import { sidebarIcons } from "../../system/sidebar-icons";
import { words } from "../i18n";
import { SiteLink } from "../SiteLink";
import { FoundationPage } from "./FoundationPage";
import type { FoundationPageProps } from "./FoundationPage";
import "./icons.css";

const importSnippet = `import { Settings } from "lucide-react";

<Settings size={18} aria-hidden="true" />`;

export function IconsPage({ language, navigate }: FoundationPageProps) {
  const t = words(language);
  const number = new Intl.NumberFormat(
    numberLocale({ numerals: "arab" }, language),
  );
  const id = useId();
  const sizes: { size: number; use: string }[] = [
    {
      size: 14,
      use: t(
        "الصغير: مسار التنقل وعلامات التحديد في القوائم والخطوات",
        "Small: breadcrumbs, check marks in menus and steps",
      ),
    },
    {
      size: 16,
      use: t(
        "الافتراضي: الأزرار وأسهم القوائم المنسدلة والأكورديون",
        "Default: buttons, select chevrons, accordions",
      ),
    },
    {
      size: 18,
      use: t(
        "الشريط الجانبي وزر إغلاق النافذة",
        "Sidebar items and the modal close button",
      ),
    },
    {
      size: 20,
      use: t("التنبيهات والإشعارات", "Alerts and toasts"),
    },
  ];
  const tones: { tone: string; label: string }[] = [
    { tone: "text", label: t("لون النص", "Text color") },
    { tone: "muted", label: t("نص خافت", "Muted text") },
    { tone: "action", label: t("لون الإجراء", "Action color") },
  ];
  return (
    <FoundationPage
      current="icons"
      language={language}
      navigate={navigate}
      title={t("الأيقونات", "Icons")}
      lede={t(
        "أيقونات خطية بسيطة من Lucide بحجم ولون يتبعان النص.",
        "Simple line icons from Lucide, sized and colored with the text.",
      )}
    >
      <section aria-labelledby={`${id}-library`}>
        <h2 id={`${id}-library`}>{t("المكتبة", "Library")}</h2>
        <p>
          {t(
            "تستخدم مكوّنات طِراز أيقونات Lucide عبر الحزمة ",
            "Tiraz components draw their icons from Lucide, through the ",
          )}
          <code>lucide-react</code>
          {t(
            ". استورد الأيقونة بالاسم في تطبيقك، فلا يُحمَّل إلا ما تستخدمه.",
            " package. Import an icon by name in your app and only what you use is bundled.",
          )}
        </p>
        <pre className="icons-code" dir="ltr" tabIndex={0}>
          <code>{importSnippet}</code>
        </pre>
      </section>

      <section aria-labelledby={`${id}-size`}>
        <h2 id={`${id}-size`}>
          {t("الحجم والسماكة واللون", "Size, stroke and color")}
        </h2>
        <p>
          {t(
            "تتدرج الأحجام مع النص المجاور. تُمرَّر القيمة بالخاصية ",
            "Sizes follow the text beside them. Pass the value with the ",
          )}
          <code>size</code>
          {t(
            ". وتبقى السماكة الافتراضية ",
            " prop. The stroke stays at the default ",
          )}
          <code>strokeWidth</code>
          {t(
            " (2) في معظم المواضع، وتزيد قليلًا في علامات التحديد الصغيرة جدًا.",
            " (2) almost everywhere, and goes a little heavier only on the smallest check marks.",
          )}
        </p>
        <ul className="icons-list" data-testid="icons-sizes">
          {sizes.map(({ size, use }) => (
            <li key={size} className="icons-sample">
              <Settings size={size} aria-hidden="true" />
              <code dir="ltr">size={`{${size}}`}</code>
              <span className="icons-note">{use}</span>
            </li>
          ))}
        </ul>
        <p>
          {t(
            "ترث الأيقونة لون النص عبر ",
            "An icon inherits the color of its text through ",
          )}
          <code>currentColor</code>
          {t(
            "، فلا حاجة إلى تلوينها بنفسك.",
            ", so you never color it separately.",
          )}
        </p>
        <ul className="icons-list" data-testid="icons-colors">
          {tones.map(({ tone, label }) => (
            <li key={tone} className="icons-sample" data-tone={tone}>
              <Check size={16} aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${id}-a11y`}>
        <h2 id={`${id}-a11y`}>{t("إتاحة الوصول", "Accessibility")}</h2>
        <p>
          {t(
            "الأيقونة المرافقة لنص زخرفية، فأضف لها ",
            "An icon beside text is decorative, so give it ",
          )}
          <code>aria-hidden="true"</code>
          {t(
            ". أما الزر الذي يحتوي أيقونة فقط فيحتاج اسمًا عبر ",
            ". A button with only an icon needs a name through ",
          )}
          <code>aria-label</code>
          {t("، وتفرض ذلك خاصية ", ", which the ")}
          <code>iconOnly</code>
          {t(" في الزر.", " prop on Button requires.")}
        </p>
        <div className="icons-row">
          <Button variant="secondary" iconOnly aria-label={t("بحث", "Search")}>
            <Search size={16} aria-hidden="true" />
          </Button>
          <Button variant="secondary" iconOnly aria-label={t("حذف", "Delete")}>
            <Trash2 size={16} aria-hidden="true" />
          </Button>
          <Button variant="secondary">
            <Settings size={16} aria-hidden="true" />
            {t("الإعدادات", "Settings")}
          </Button>
        </div>
        <p>
          {t(
            "لا تجعل الأيقونة وحدها تحمل المعنى: اقرنها بنص أو اسم متاح، خصوصًا للحالات كالنجاح والخطأ.",
            "Never let an icon alone carry meaning: pair it with text or an accessible name, especially for states such as success and error.",
          )}
        </p>
      </section>

      <section aria-labelledby={`${id}-direction`}>
        <h2 id={`${id}-direction`}>{t("الاتجاه", "Direction")}</h2>
        <p>
          {t(
            "الأيقونات الدالة على اتجاه، كالأسهم والأقواس، تنعكس في العربية. ",
            "Directional icons such as arrows and chevrons mirror in RTL. ",
          )}
          <SiteLink
            route={{ kind: "foundation", id: "arabic-rtl" }}
            navigate={navigate}
          >
            {t("صفحة العربية والاتجاه", "See Arabic and RTL")}
          </SiteLink>
        </p>
      </section>

      <section aria-labelledby={`${id}-names`}>
        <h2 id={`${id}-names`}>
          {t("أسماء أيقونات الشريط الجانبي", "Sidebar icon names")}
        </h2>
        <p>
          {t(
            "تقبل SidebarItem وSidebarAction وSidebarDisclosure الخاصية ",
            "SidebarItem, SidebarAction and SidebarDisclosure take ",
          )}
          <code>iconName</code>
          {t(
            "، وهي نص من قائمة مغلقة من ",
            ", a plain string from a closed list of ",
          )}
          {number.format(sidebarIconNames.length)}
          {t(
            " اسمًا ترسمها طِراز بنفسها، بدل تمرير عقدة ",
            " names that Tiraz draws itself, in place of an ",
          )}
          <code>icon</code>
          {t(
            ". مرّر واحدًا من الاثنين فقط.",
            " node. Pass exactly one of the two.",
          )}
        </p>
        <ul className="icons-grid" data-testid="icons-grid">
          {sidebarIconNames.map((name) => {
            const Icon = sidebarIcons[name];
            return (
              <li key={name} className="icons-cell">
                <Icon size={20} aria-hidden="true" />
                <code dir="ltr">{name}</code>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby={`${id}-ai`}>
        <h2 id={`${id}-ai`}>{t("علامة الذكاء الاصطناعي", "AI mark")}</h2>
        <p>
          {t(
            "نجمة بثماني نقاط تدل على حضور المساعد، بلون الذكاء الاصطناعي على بلاطة خفيفة. تستخدمها واجهات طِراز الذكية مثل التفكير والموافقات وصندوق القرارات. تأتي بثلاثة أحجام ",
            "An eight-point star that marks the assistant's presence, in the AI color on a soft tile. Tiraz's AI interfaces use it, such as thinking, approvals and the decision inbox. It comes in three sizes: ",
          )}
          <code>xs</code>
          {t("، ", ", ")}
          <code>sm</code>
          {t(" و", " and ")}
          <code>md</code>
          {t(
            "، وتكون زخرفية ومخفية إلا إن مررت ",
            ". It is decorative and hidden unless you pass ",
          )}
          <code>label</code>
          {t(". وتدور بخاصية ", ". Set ")}
          <code>working</code>
          {t(" أثناء عمل المساعد.", " to turn it while the assistant works.")}
        </p>
        <div className="icons-row" data-testid="ai-marks">
          <AIMark size="xs" />
          <AIMark size="sm" />
          <AIMark size="md" />
        </div>
      </section>
    </FoundationPage>
  );
}
