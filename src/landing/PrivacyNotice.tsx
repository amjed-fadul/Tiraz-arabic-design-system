import { Modal } from "../system/Modal";

export function PrivacyNotice({ ar }: { ar: boolean }) {
  return (
    <Modal
      trigger={
        <button className="lp-footer-link">
          {ar ? "الخصوصية" : "Privacy"}
        </button>
      }
      title={ar ? "الخصوصية في طِراز" : "Privacy at Tiraz"}
      description={
        ar
          ? "كيف يستخدم الموقع بيانات الزيارة والتفضيلات المحلية."
          : "How this site uses visit data and local preferences."
      }
      closeLabel={ar ? "إغلاق" : "Close"}
    >
      <div className="lp-privacy-content">
        <section>
          <h3>{ar ? "إحصاءات الزيارة" : "Visit analytics"}</h3>
          <p>
            {ar
              ? "نستخدم Vercel Web Analytics لفهم الصفحات الأكثر استخدامًا. تتضمّن الإحصاءات المجمّعة الصفحات التي تزورها، ومصدر الزيارة، ونوع الجهاز والمتصفح، والموقع الجغرافي التقريبي. لا تستخدم هذه الخدمة ملفات تعريف الارتباط لتتبّعك بين المواقع."
              : "We use Vercel Web Analytics to understand which pages are useful. Aggregated statistics include visited pages, referrers, device and browser information, and approximate location. This service does not use cookies to track you across websites."}
          </p>
          <a href="https://vercel.com/docs/analytics/privacy-policy">
            {ar
              ? "تفاصيل خصوصية Vercel Web Analytics"
              : "Vercel Web Analytics privacy details"}
          </a>
        </section>
        <section>
          <h3>{ar ? "تفضيلاتك في المتصفح" : "Preferences in your browser"}</h3>
          <p>
            {ar
              ? "نحفظ اللغة والمظهر وإعدادات التخصيص محليًا في متصفحك لتبقى عند عودتك. يمكنك إزالتها بمسح بيانات هذا الموقع من إعدادات المتصفح."
              : "Language, theme and customization preferences are saved locally in your browser for your next visit. You can remove them by clearing this site's data in your browser settings."}
          </p>
        </section>
        <section>
          <h3>
            {ar ? "الاستضافة والروابط الخارجية" : "Hosting and external links"}
          </h3>
          <p>
            {ar
              ? "الموقع مستضاف على Vercel. عند فتح GitHub أو إحدى وسائل التواصل، تنطبق سياسة خصوصية الخدمة التي تنتقل إليها."
              : "This site is hosted on Vercel. When you open GitHub or a contact service, that service's privacy policy applies."}
          </p>
          <a href="https://vercel.com/legal/privacy-notice">
            {ar ? "إشعار خصوصية Vercel" : "Vercel privacy notice"}
          </a>
        </section>
      </div>
    </Modal>
  );
}
