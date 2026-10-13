import type { ComponentId } from "./catalog";
import { catalog } from "./catalog";
import { fields } from "./fields";
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
  const rows: Record<ComponentId, Array<[string, string, string]>> = {
    field: [
      [
        "label / helper / error",
        "string / string? / string?",
        t(
          "التطبيق يملك قواعد التحقق. error يعرض الرسالة ويعلن عدم الصلاحية فقط.",
          "The application owns validation rules. error only displays feedback and marks the control invalid.",
        ),
      ],
      [
        "children",
        "(control: FieldControlProps) => ReactNode",
        t(
          "عنصر واحد: مرر control عبر field إلى Input أو Select؛ لا نسخ تلقائيًا للعناصر.",
          "One control: pass control as field to Input or Select; children are never cloned.",
        ),
      ],
      [
        "required / id / className / aria-describedby",
        "boolean? / string? / string? / string?",
        t(
          "معرف ثابت مولّد، أو id فريد من التطبيق. تجمع معرفات الأوصاف الخارجية.",
          "Stable generated ID or unique caller ID. External description IDs are merged.",
        ),
      ],
      [
        "FieldControlProps",
        "id, aria-labelledby, aria-describedby?, aria-invalid?, required?",
        t(
          "يربط التسمية والمساعدة والخطأ؛ field يملك id. required يعلن النجمة ويمرر القيد الأصلي.",
          "Associates label, help and error; field owns id. required shows an indicator and forwards the native constraint.",
        ),
      ],
    ],
    input: [
      [
        "type / size",
        "InputType / sm | md",
        t(
          "text افتراضي. يدعم text/email/password/search/tel/url فقط. sm افتراضي.",
          "Defaults to text and sm. Supports text/email/password/search/tel/url only.",
        ),
      ],
      [
        "value / defaultValue / onChange",
        "Native input props",
        t(
          "القيمة المتحكم بها تحتاج onChange. reset أصلي للقيم الداخلية؛ عالج onReset في التطبيق للقيم المتحكم بها.",
          "Controlled value requires onChange. Uncontrolled reset is native; handle onReset in the application for controlled values.",
        ),
      ],
      [
        "field / invalid",
        "FieldControlProps? / boolean?",
        t(
          "الاسم من Field أو label/aria-label/aria-labelledby خارجي. الوصف الخارجي يُجمع.",
          "Name with Field or an external label/aria-label/aria-labelledby. External descriptions are merged.",
        ),
      ],
      [
        "placeholder / disabled / readOnly / required / name / form / autoComplete",
        "Native input attributes",
        t(
          "يحافظ على التحرير والتحديد والملء التلقائي وسلوك النموذج الأصلي.",
          "Preserves native editing, selection, autofill and form behavior.",
        ),
      ],
      [
        "ref / id / className / style / ARIA / data-* / native events",
        "Ref<HTMLInputElement> / ComponentPropsWithRef<input>",
        t(
          "React 19: ref يصل إلى input. excludes size/type/children تستبدل الواجهة الأصلية.",
          "React 19 ref targets input. Native size/type/children are excluded in favor of the typed component API.",
        ),
      ],
    ],
    select: [
      [
        "options",
        "SelectOption[]: value, label, disabled?",
        t(
          "قيم فريدة غير فارغة وتسميات واضحة. القيمة الفارغة تعرض placeholder. لا بحث أو اختيار متعدد.",
          "Unique nonempty values and meaningful labels. Empty value shows the placeholder. Single select; no search or multi-select.",
        ),
      ],
      [
        "value / defaultValue / onValueChange",
        "string / string? / (string) => void",
        t(
          "طِراز يدير القيمة الداخلية. reset الناجح يطلب القيمة الأولية بعد اكتمال الحدث؛ الإلغاء يحفظ القيمة دون callback. يتبع النموذج الحالي عند استبداله أو إضافته لاحقًا دون إعادة تركيب Select.",
          "Tiraz manages uncontrolled values. Successful reset requests the initial value after event dispatch; cancellation preserves the value without a callback. Reset follows the current form after replacement or late insertion without remounting Select.",
        ),
      ],
      [
        "size / placeholder / disabled / required / invalid / field",
        "sm | md / string? / booleans / FieldControlProps?",
        t(
          "sm افتراضي؛ تسمية خارجية أو Field. لا يحقق قواعد التطبيق.",
          "sm default; name with an external label or Field. Does not perform application validation.",
        ),
      ],
      [
        "name / form / autoComplete",
        "string?",
        t(
          "select أصلي مخفي يدعم FormData وreset وrequired. checkValidity لا يغير التركيز. يُعاد التركيز لزر الاختيار عند التركيز الأصلي فقط؛ يمكن للتطبيق إلغاء invalid وتحديد ملخص الأخطاء عبر حاوية الحقل.",
          "The hidden select supports FormData, reset and required. checkValidity does not move focus. Actual native focus redirects to the trigger; ancestor invalid handlers can cancel reporting and focus an error summary. onInvalid remains a trigger-button prop.",
        ),
      ],
      [
        "ref / id / className / style / ARIA / data-* / button events",
        "Ref<HTMLButtonElement> / native button props",
        t(
          "ref يصل لزر الفتح. children/type/value/defaultValue/onChange مستبدلة؛ name/form للعنصر الأصلي. لا open/defaultOpen أو تخصيص popup في هذه الواجهة.",
          "ref targets trigger. children/type/value/defaultValue/onChange are replaced; name/form target native form participation. No open/defaultOpen or popup customization API.",
        ),
      ],
      [
        "keyboard / popup",
        "Radix Select 2.4.1",
        t(
          "أسهم وHome/End والكتابة وEnter/Escape، واستعادة التركيز. محتوى داخل SystemProvider وSheet، وتمرر القائمة داخليًا. الحركة شفافية فقط وتحترم تقليل الحركة.",
          "Arrows, Home/End, typeahead, Enter/Escape and focus restoration. Popup stays within SystemProvider/Sheet and scrolls internally. Opacity motion respects app and OS reduction.",
        ),
      ],
    ],
    button: [
      [
        "variant / state / size",
        "ButtonVariant / ButtonState / sm | md",
        t(
          "sm افتراضي. loading يمنع الضغط ويعلن aria-busy.",
          "sm is the default. Loading blocks clicks and manages aria-busy.",
        ),
      ],
      [
        "children / iconOnly / aria-label",
        "ReactNode / boolean / string",
        t(
          "الاسم المعلن مطلوب عند iconOnly. الأيقونات تركيب داخل children.",
          "An accessible name is required for iconOnly. Icons compose inside children.",
        ),
      ],
      [
        "disabled / type / id / className / style",
        "HTML button attributes",
        t(
          "سمات أصلية. النمط العريض مثال لـ style.",
          "Native attributes. The wide preset demonstrates style.",
        ),
      ],
      [
        "...HTML / ARIA / data-*",
        "ButtonHTMLAttributes",
        t(
          "يشمل title وname وvalue وform* وtabIndex وdir وautoFocus وغيرها. تُمرّرها في كود تطبيقك.",
          "Includes title, name, value, form*, tabIndex, dir, autoFocus and other native attributes. Pass these attributes in your application code.",
        ),
      ],
      [
        "onClick / ...native events",
        "React event handlers",
        t(
          "المحاكاة أو التسجيل يوضحان onClick. المعالجات الأخرى دوال تُربط في تطبيقك.",
          "Simulation and logging demonstrate onClick. Other event handlers are functions supplied by your application.",
        ),
      ],
      [
        "ref",
        "No explicit typed ref prop",
        t(
          "ButtonProps لا يعلن ref. لا يوجد تحكّم وهمي لهذا التفصيل.",
          "ButtonProps has no explicit ref prop; there is no pretend editor for it.",
        ),
      ],
    ],
    tabs: [
      [
        "items",
        "TabItem[]",
        t(
          "value فريد؛ label وcontent من نوع ReactNode؛ disabled اختياري. يمكن تركيب ReactNode في كود تطبيقك.",
          "Unique value; label/content are ReactNode; disabled is optional. Compose ReactNode content in your application code.",
        ),
      ],
      [
        "label / variant / className",
        "string / underline | segment / string",
        t(
          "label اسم قائمة التبويبات لقارئات الشاشة.",
          "label names the tab list for assistive technology.",
        ),
      ],
      [
        "value / defaultValue",
        "string",
        t(
          "حالة متحكّم بها أو قيمة أولية؛ الافتراضي أول عنصر مفعّل.",
          "Controlled value or initial value; defaults to the first enabled item.",
        ),
      ],
      [
        "onValueChange",
        "(value: string) => void",
        t(
          "تغيّر التحديد يظهر مباشرة في سجل الحدث والكود.",
          "Selection changes update the event record and usage code.",
        ),
      ],
      [
        "ref",
        "Not exposed",
        t(
          "لا يعلن المكوّن ref في واجهته.",
          "The component does not expose a ref.",
        ),
      ],
    ],
    switch: [
      [
        "label / description",
        "string",
        t(
          "label مرتبط بالمفتاح، وdescription مرتبط بـ aria-describedby.",
          "label is connected to the switch; description supplies aria-describedby.",
        ),
      ],
      [
        "checked / defaultChecked / onCheckedChange",
        "boolean / boolean / (boolean) => void",
        t(
          "اختر حالة متحكّم بها أو داخلية. Space يغيّر الحالة.",
          "Choose controlled or internal state. Space toggles it.",
        ),
      ],
      [
        "disabled / required / name / value / type",
        "Native switch/button props",
        t(
          "سمات النموذج الأصلية موروثة من Radix Switch.Root.",
          "Native form attributes inherited from Radix Switch.Root.",
        ),
      ],
      [
        "id / className / style / ...DOM attributes",
        "ComponentProps<Switch.Root>",
        t(
          "className على حاوية التسمية؛ style وسمات DOM على المفتاح نفسه.",
          "className styles the label wrapper; style and DOM attributes apply to the switch control.",
        ),
      ],
      [
        "children / asChild",
        "Managed by the wrapper",
        t(
          "المكوّن يملك بنية Thumb. لا تُمرّر children أو asChild.",
          "The wrapper owns its Thumb structure. children and asChild are excluded from its public API.",
        ),
      ],
      [
        "ref / ...native events",
        "Ref<HTMLButtonElement> / event handlers",
        t(
          "ref موروث ويصل إلى زر المفتاح. ليس قيمة قابلة للتحرير. باقي الأحداث دوال تطبيق.",
          "The inherited ref targets the switch button. It is not an editable value. Other native events are application functions.",
        ),
      ],
    ],
    dropdown: [
      [
        "trigger",
        "ReactElement",
        t(
          "المثال يركّب Button مع تسمية ونوع وحجم.",
          "The preset composes a Button label, variant and size.",
        ),
      ],
      [
        "items",
        "MenuItem[]",
        t(
          "id، label، icon: ReactNode، shortcut، disabled، destructive، separatorBefore، onSelect.",
          "id, label, icon: ReactNode, shortcut, disabled, destructive, separatorBefore, onSelect.",
        ),
      ],
      [
        "align / open / onOpenChange",
        "start | end / boolean / (boolean) => void",
        t(
          "open اختياري. في الحالة الداخلية يفتح زر التفعيل القائمة.",
          "open is optional; in internal mode the trigger opens the menu.",
        ),
      ],
      [
        "items[].onSelect",
        "() => void",
        t(
          "كل اختيار يسجّل معرّف العنصر. الدوال تُكتب في تطبيقك.",
          "Selections record item IDs. Callback functions belong to your application.",
        ),
      ],
      [
        "ref / children / className / side",
        "Not exposed as DropdownMenu props",
        t(
          "لا تضف هذه الخصائص. التحرير يتم عبر trigger وitems، والمحاذاة فقط.",
          "Do not add these props. Compose trigger/items and use alignment instead.",
        ),
      ],
    ],
    sheet: [
      [
        "trigger / children / footer",
        "ReactElement / ReactNode / ReactNode",
        t(
          "تركيب زر، نصوص ممثلة، وتذييل اختياري. زر التذييل يستخدم Radix Dialog.Close ليدعم الحالتين.",
          "Button composition, representative content and optional footer. The footer uses Radix Dialog.Close in both state modes.",
        ),
      ],
      [
        "title / description / closeLabel",
        "string",
        t(
          "مطلوبة لتسمية اللوحة ووصفها وزر إغلاقها.",
          "Required to name/describe the dialog and its close button.",
        ),
      ],
      [
        "open / onOpenChange",
        "boolean / (boolean) => void",
        t(
          "حالة متحكّم بها أو داخلية. الإغلاق يستعيد التركيز.",
          "Controlled or internal state. Dismissal restores focus.",
        ),
      ],
      [
        "side",
        "right | left (optional)",
        t(
          "إذا حُذفت: اليمين في RTL واليسار في LTR. العرض غير قابل للتعديل في API.",
          "When omitted: right in RTL, left in LTR. Width is not an API prop.",
        ),
      ],
      [
        "ref / className",
        "Not exposed",
        t(
          "لا توجد حقول تحرير لخصائص غير معروضة.",
          "No controls are fabricated for unexposed props.",
        ),
      ],
    ],
    toast: [
      [
        "ToastProvider.children / label / closeLabel",
        "ReactNode / string / string",
        t(
          "children محتوى التطبيق. label يسمي الإعلانات ومنطقة التنبيهات.",
          "children is application content. label names announcements and the toast viewport.",
        ),
      ],
      [
        "useToast().toast",
        "(ToastMessage) => void",
        t(
          "أرسل الرسالة من داخل ToastProvider. سجل الحدث يعرض tone وduration.",
          "Call inside ToastProvider. The event record shows tone and duration.",
        ),
      ],
      [
        "title / description / tone",
        "string / string? / success | error | info",
        t(
          "title مطلوب، والافتراضي info. description اختياري.",
          "title is required; tone defaults to info; description is optional.",
        ),
      ],
      [
        "duration",
        "number (milliseconds)",
        t(
          "5000 افتراضي. تحكم المدة هنا يعرض 1000–60000ms.",
          "Defaults to 5000. The inspector demonstrates 1000–60000ms.",
        ),
      ],
      [
        "open / ref / placement / className",
        "Not exposed",
        t(
          "الطابور والإغلاق داخليان. لا توجد خاصية لموضع التنبيه.",
          "Queue and dismissal are internal. Placement is not a configurable prop.",
        ),
      ],
    ],
  };
  return (
    <details className="api-reference">
      <summary>{label("api", language)}</summary>
      <p>
        {t("الواجهة الفعلية في", "Actual interface in")}{" "}
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
            {rows[component].map(([name, type, note]) => (
              <tr key={name}>
                <td>
                  <code dir="ltr">{name}</code>
                </td>
                <td>
                  <code dir="ltr">{type}</code>
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
