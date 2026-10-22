import { Accordion } from "../system/Accordion";

export function Faq({ ar }: { ar: boolean }) {
  return (
    <section className="lp-section lp-faq" id="faq" aria-labelledby="faq-title">
      <div className="lp-container lp-faq-layout">
        <div className="lp-faq-intro">
          <p className="lp-kicker">{ar ? "قبل أن تبدأ" : "Before you build"}</p>
          <h2 id="faq-title">
            {ar ? "الأسئلة الشائعة" : "Frequently asked questions"}
          </h2>
          <p>
            {ar
              ? "عن التثبيت والتخصيص واستخدام طِراز في مشروعك."
              : "About installing, customizing and using Tiraz in your project."}
          </p>
        </div>
        <Accordion
          collapsible
          className="lp-faq-list"
          items={[
            {
              value: "license",
              label: ar ? "هل طِراز مجاني؟" : "Is Tiraz free to use?",
              content: (
                <p>
                  {ar
                    ? "نعم. طِراز مفتوح المصدر بترخيص MIT، ويمكنك استخدامه وتعديله في مشاريعك الشخصية والتجارية. احتفظ بإشعار الترخيص وحقوق النشر مع الكود."
                    : "Yes. Tiraz is open source under the MIT license. You can use and modify it in personal and commercial projects. Keep the license and copyright notice with the code."}
                </p>
              ),
            },
            {
              value: "install",
              label: ar
                ? "كيف أضيفه إلى مشروعي؟"
                : "How do I add it to my project?",
              content: (
                <p>
                  {ar
                    ? "يمكنك تثبيت حزمة npm واستيراد المكوّنات منها، أو نسخ المصدر إلى مشروع Vite لتعديله مباشرة. دليل البدء يشرح الطريقتين."
                    : "Install the npm package and import its components, or copy the source into a Vite project to edit it directly. The setup guide covers both options."}{" "}
                  <a href="#start">
                    {ar ? "افتح دليل البدء" : "Open the setup guide"}
                  </a>
                </p>
              ),
            },
            {
              value: "languages",
              label: ar
                ? "هل يدعم العربية والإنجليزية؟"
                : "Does it support Arabic and English?",
              content: (
                <p>
                  {ar
                    ? "نعم. تراعي المكوّنات اتجاهَي القراءة من اليمين إلى اليسار والعكس، والخط العربي، وتنسيق الأرقام. جرّب تبديل اللغة في المكتبة لمعاينة الاتجاهين."
                    : "Yes. The components support right-to-left and left-to-right layouts, Arabic typography and localized numbers. Switch languages in the library to preview both directions."}
                </p>
              ),
            },
            {
              value: "customize",
              label: ar
                ? "هل يمكنني تغيير المظهر؟"
                : "Can I change the look and feel?",
              content: (
                <p>
                  {ar
                    ? "نعم. غيّر الألوان والمظهر الفاتح أو الداكن وكثافة الواجهة والخطوط من إعدادات النظام. ويمكنك تعديل المصدر عندما تحتاج إلى تغيير أعمق."
                    : "Yes. Adjust colors, light or dark appearance, density and typography through the system settings. Edit the source when you need a deeper change."}
                </p>
              ),
            },
            {
              value: "shadcn",
              label: ar ? "هل أحتاج إلى shadcn؟" : "Do I need shadcn?",
              content: (
                <p>
                  {ar
                    ? "لا. يمكنك استخدام حزمة npm أو أداة تثبيت طِراز مباشرة. مسار shadcn خيار إضافي لمن يستخدمه بالفعل لنسخ المكوّنات إلى مشروعه."
                    : "No. You can use the npm package or Tiraz installer directly. The shadcn registry is an additional option for people who already use it to copy components into their projects."}
                </p>
              ),
            },
            {
              value: "ai",
              label: ar
                ? "هل المساعد في الأمثلة متصل بخدمة ذكاء اصطناعي؟"
                : "Are the example assistants connected to an AI service?",
              content: (
                <p>
                  {ar
                    ? "الأمثلة محاكاة تفاعلية داخل المتصفح. طِراز يوفّر الواجهة وحالاتها؛ اربطها بخدمة الذكاء الاصطناعي وبيانات تطبيقك عند بناء منتجك."
                    : "The examples are interactive simulations in your browser. Tiraz provides the interface and its states; connect them to your AI service and application data when building your product."}
                </p>
              ),
            },
          ]}
        />
      </div>
    </section>
  );
}
