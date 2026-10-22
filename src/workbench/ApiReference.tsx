import type { ComponentId } from "./catalog";
import { catalog } from "./catalog";
import { fields } from "./fields";
import { contracts } from "../knowledge/contracts";
import { label, words } from "./i18n";
import type { Language } from "./i18n";
export function ApiReference({
  component,
  language,
}: {
  component: ComponentId;
  language: Language;
}) {
  const t = words(language);
  const file = catalog.find((item) => item.id === component)!.file;
  const rows: Record<ComponentId, Array<[string, string]>> = {
    button: [
      [
        "variant / state / size",
        t(
          "sm افتراضي. loading يمنع الضغط ويعلن aria-busy.",
          "sm is the default. Loading blocks clicks and manages aria-busy.",
        ),
      ],
      [
        "children / iconOnly / aria-label",
        t(
          "الاسم المعلن مطلوب عند iconOnly. الأيقونات تركيب داخل children.",
          "An accessible name is required for iconOnly. Icons compose inside children.",
        ),
      ],
      [
        "disabled / type / id / className / style",
        t(
          "سمات أصلية. النمط العريض مثال لـ style.",
          "Native attributes. The wide preset demonstrates style.",
        ),
      ],
      [
        "...HTML / ARIA / data-*",
        t(
          "يشمل title وname وvalue وform* وtabIndex وdir وautoFocus وغيرها. تُمرّرها في كود تطبيقك.",
          "Includes title, name, value, form*, tabIndex, dir, autoFocus and other native attributes. Pass these attributes in your application code.",
        ),
      ],
      [
        "onClick / ...native events",
        t(
          "المحاكاة أو التسجيل يوضحان onClick. المعالجات الأخرى دوال تُربط في تطبيقك.",
          "Simulation and logging demonstrate onClick. Other event handlers are functions supplied by your application.",
        ),
      ],
      [
        "ref",
        t(
          "ButtonProps لا يعلن ref. لا يوجد تحكّم وهمي لهذا التفصيل.",
          "ButtonProps has no explicit ref prop; there is no pretend editor for it.",
        ),
      ],
    ],
    tabs: [
      [
        "items",
        t(
          "value فريد؛ label وcontent من نوع ReactNode؛ disabled اختياري. يمكن تركيب ReactNode في كود تطبيقك.",
          "Unique value; label/content are ReactNode; disabled is optional. Compose ReactNode content in your application code.",
        ),
      ],
      [
        "label / variant / className",
        t(
          "label اسم قائمة التبويبات لقارئات الشاشة.",
          "label names the tab list for assistive technology.",
        ),
      ],
      [
        "value / defaultValue",
        t(
          "حالة متحكّم بها أو قيمة أولية؛ الافتراضي أول عنصر مفعّل.",
          "Controlled value or initial value; defaults to the first enabled item.",
        ),
      ],
      [
        "onValueChange",
        t(
          "تغيّر التحديد يظهر مباشرة في سجل الحدث والكود.",
          "Selection changes update the event record and usage code.",
        ),
      ],
      [
        "ref",
        t(
          "لا يعلن المكوّن ref في واجهته.",
          "The component does not expose a ref.",
        ),
      ],
    ],
    switch: [
      [
        "label / description",
        t(
          "label مرتبط بالمفتاح، وdescription مرتبط بـ aria-describedby.",
          "label is connected to the switch; description supplies aria-describedby.",
        ),
      ],
      [
        "checked / defaultChecked / onCheckedChange",
        t(
          "اختر حالة متحكّم بها أو داخلية. Space يغيّر الحالة.",
          "Choose controlled or internal state. Space toggles it.",
        ),
      ],
      [
        "disabled / required / name / value / type",
        t(
          "سمات النموذج الأصلية موروثة من Radix Switch.Root.",
          "Native form attributes inherited from Radix Switch.Root.",
        ),
      ],
      [
        "id / className / style / ...DOM attributes",
        t(
          "className على حاوية التسمية؛ style وسمات DOM على المفتاح نفسه.",
          "className styles the label wrapper; style and DOM attributes apply to the switch control.",
        ),
      ],
      [
        "children / asChild",
        t(
          "المكوّن يملك بنية Thumb. لا تُمرّر children أو asChild.",
          "The wrapper owns its Thumb structure. children and asChild are excluded from its public API.",
        ),
      ],
      [
        "ref / ...native events",
        t(
          "ref موروث ويصل إلى زر المفتاح. ليس قيمة قابلة للتحرير. باقي الأحداث دوال تطبيق.",
          "The inherited ref targets the switch button. It is not an editable value. Other native events are application functions.",
        ),
      ],
    ],
    dropdown: [
      [
        "trigger",
        t(
          "المثال يركّب Button مع تسمية ونوع وحجم.",
          "The preset composes a Button label, variant and size.",
        ),
      ],
      [
        "items",
        t(
          "id، label، icon: ReactNode، shortcut، disabled، destructive، separatorBefore، onSelect.",
          "id, label, icon: ReactNode, shortcut, disabled, destructive, separatorBefore, onSelect.",
        ),
      ],
      [
        "align / open / onOpenChange",
        t(
          "open اختياري. في الحالة الداخلية يفتح زر التفعيل القائمة.",
          "open is optional; in internal mode the trigger opens the menu.",
        ),
      ],
      [
        "items[].onSelect",
        t(
          "كل اختيار يسجّل معرّف العنصر. الدوال تُكتب في تطبيقك.",
          "Selections record item IDs. Callback functions belong to your application.",
        ),
      ],
      [
        "ref / children / className / side",
        t(
          "لا تضف هذه الخصائص. التحرير يتم عبر trigger وitems، والمحاذاة فقط.",
          "Do not add these props. Compose trigger/items and use alignment instead.",
        ),
      ],
    ],
    sheet: [
      [
        "trigger / children / footer",
        t(
          "تركيب زر، نصوص ممثلة، وتذييل اختياري. زر التذييل يستخدم SheetClose ليدعم الحالتين.",
          "Button composition, representative content and optional footer. The footer uses Radix Dialog.Close in both state modes.",
        ),
      ],
      [
        "title / description / closeLabel",
        t(
          "مطلوبة لتسمية اللوحة ووصفها وزر إغلاقها.",
          "Required to name/describe the dialog and its close button.",
        ),
      ],
      [
        "open / onOpenChange",
        t(
          "حالة متحكّم بها أو داخلية. الإغلاق يستعيد التركيز.",
          "Controlled or internal state. Dismissal restores focus.",
        ),
      ],
      [
        "side",
        t(
          "إذا حُذفت: اليمين في RTL واليسار في LTR. العرض غير قابل للتعديل في API.",
          "When omitted: right in RTL, left in LTR. Width is not an API prop.",
        ),
      ],
      [
        "ref / className",
        t(
          "لا توجد حقول تحرير لخصائص غير معروضة.",
          "No controls are fabricated for unexposed props.",
        ),
      ],
    ],
    toast: [
      [
        "ToastProvider.children / label / closeLabel",
        t(
          "children محتوى التطبيق. label يسمي الإعلانات ومنطقة التنبيهات.",
          "children is application content. label names announcements and the toast viewport.",
        ),
      ],
      [
        "useToast().toast",
        t(
          "أرسل الرسالة من داخل ToastProvider. سجل الحدث يعرض tone وduration.",
          "Call inside ToastProvider. The event record shows tone and duration.",
        ),
      ],
      [
        "title / description / tone",
        t(
          "title مطلوب، والافتراضي info. description اختياري.",
          "title is required; tone defaults to info; description is optional.",
        ),
      ],
      [
        "duration",
        t(
          "5000 افتراضي. تحكم المدة هنا يعرض 1000–60000ms.",
          "Defaults to 5000. The inspector demonstrates 1000–60000ms.",
        ),
      ],
      [
        "open / ref / placement / className",
        t(
          "الطابور والإغلاق داخليان. لا توجد خاصية لموضع التنبيه.",
          "Queue and dismissal are internal. Placement is not a configurable prop.",
        ),
      ],
    ],
  };
  const contract = contracts[component];
  return (
    <details className="api-reference">
      <summary>{label("api", language)}</summary>
      <p>
        {t(
          "خصائص مولّدة وإرشادات استخدام. المصدر:",
          "Generated API facts and usage guidance. Source:",
        )}{" "}
        <bdi dir="ltr">src/system/{file}</bdi>.
      </p>
      <div
        className="api-scroll"
        tabIndex={0}
        role="region"
        aria-label={label("api", language)}
      >
        <table>
          <thead>
            <tr>
              <th>{t("الخاصية", "Property")}</th>
              <th>{t("النوع والسلوك", "Type and behavior")}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(contract.props).map(([name, prop]) => (
              <tr key={name}>
                <td>
                  <code dir="ltr">{name}</code>
                </td>
                <td>
                  <code dir="ltr">{prop.type}</code>
                  <p>
                    {prop.required
                      ? t("مطلوب", "Required")
                      : t("اختياري", "Optional")}
                    {contract.defaults[name] !== undefined && (
                      <>
                        {" "}
                        · {t("الافتراضي", "Default")}:{" "}
                        <code dir="ltr">{contract.defaults[name]}</code>
                      </>
                    )}
                  </p>
                </td>
              </tr>
            ))}
            {rows[component].map(([name, note]) => (
              <tr key={name}>
                <td>
                  <code dir="ltr">{name}</code>
                </td>
                <td>
                  <p>{note}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="api-note">
        {t(
          "إعدادات المظهر مشتركة عبر SystemProvider. الخصائص غير المعروضة في المعاينة متاحة في API؛ تُربط الدوال وrefs في كود تطبيقك.",
          "Appearance is shared through SystemProvider. Properties omitted from the compact inspector remain available in the API; supply functions and refs in application code.",
        )}
      </p>
      <p className="sr-only">
        {fields[component].map((f) => f.api).join(", ")}
      </p>
    </details>
  );
}
