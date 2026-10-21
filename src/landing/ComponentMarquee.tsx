/** Foundational families; the complete library is listed in system/ai/README.md. */
const families: readonly (readonly [string, string])[] = [
  ["زر", "Button"],
  ["تبويبات", "Tabs"],
  ["مفتاح تبديل", "Switch"],
  ["قائمة منسدلة", "DropdownMenu"],
  ["لوحة جانبية", "Sheet"],
  ["إشعار عائم", "Toast"],
  ["حقل", "Field"],
  ["حقل إدخال", "Input"],
  ["قائمة اختيار", "Select"],
  ["جدول", "Table"],
  ["جدول بيانات", "DataTable"],
  ["شارة", "Badge"],
  ["مربع اختيار", "Checkbox"],
  ["أزرار اختيار", "RadioGroup"],
  ["نص متعدد الأسطر", "Textarea"],
  ["صورة رمزية", "Avatar"],
  ["مجموعة صور", "AvatarGroup"],
  ["تلميح", "Tooltip"],
  ["نافذة حوار", "Modal"],
  ["حالة فارغة", "EmptyState"],
  ["تنبيه", "Alert"],
  ["هيكل تحميل", "Skeleton"],
  ["شريط تقدّم", "Progress"],
  ["مؤشر تحميل", "Spinner"],
  ["بطاقة", "Card"],
  ["أكورديون", "Accordion"],
  ["مسار التنقل", "Breadcrumbs"],
  ["ترقيم الصفحات", "Pagination"],
  ["رسم خطي", "LineChart"],
  ["رسم مساحي", "AreaChart"],
  ["رسم أعمدة", "BarChart"],
  ["رسم دائري", "DonutChart"],
  ["شريط جانبي", "Sidebar"],
  ["حقل الوسوم", "TagInput"],
  ["شريط التصفية", "FilterBar"],
  ["حقل النسخ", "InputCopy"],
  ["رفع الملفات", "FileDropzone"],
  ["منتقي الألوان", "ColorPicker"],
  ["منزلق", "Slider"],
  ["رمز التحقق", "OTPInput"],
  ["منتقي التاريخ", "DatePicker"],
];

/** Two drifting rows of component names; the accessible list is read once. */
export function ComponentMarquee({ ar }: { ar: boolean }) {
  const half = Math.ceil(families.length / 2);
  const rows = [families.slice(0, half), families.slice(half)];
  return (
    <section
      className="lp-marquee"
      aria-label={ar ? "مكوّنات طِراز" : "Tiraz components"}
    >
      <ul className="lp-visually-hidden">
        {families.map(([arabic, english]) => (
          <li key={english}>{ar ? arabic : english}</li>
        ))}
      </ul>
      {rows.map((row, index) => (
        <div
          className="lp-marquee-row"
          data-row={index}
          aria-hidden="true"
          key={index}
        >
          <div className="lp-marquee-track">
            {[...row, ...row].map(([arabic, english], item) => (
              <span className="lp-marquee-item" key={`${english}-${item}`}>
                <WarpMark />
                <span lang={ar ? "ar" : "en"}>{ar ? arabic : english}</span>
                <small lang={ar ? "en" : "ar"} dir={ar ? "ltr" : "rtl"}>
                  {ar ? english : arabic}
                </small>
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** The selected Warp symbol, drawn with the current text color. */
export function WarpMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      className="lp-warp-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 4h12v4H8v16h8v4H4V4Zm24 0v24H16v-4h8V8h-8V4h12Z" />
      <path d="M10 12h12v4H10zM10 20h12v-4h-4v4z" />
    </svg>
  );
}
