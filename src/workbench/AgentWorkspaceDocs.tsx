import { SystemProvider } from "../system/Provider";
import type { SystemConfig } from "../system/config";
import { AgentWorkspaceExample } from "../system/ai/examples/AgentWorkspaceExample";
import { DemoFrame } from "../system/ai/examples/DemoFrame";
import { Khayt } from "../mascot/Khayt";
import { PromptPanel } from "./PromptPanel";
import { agentWorkspaceCode } from "./agent-workspace-code";
import "./agent-workspace-docs.css";

/** Documentation composition; does not extend TaskStarter's public API. */
export function AgentWorkspaceDocs({
  language,
  config,
}: {
  language: "ar" | "en";
  config: SystemConfig;
}) {
  const ar = language === "ar";
  return (
    <section
      className="agent-workspace-docs"
      id="agent-workspace"
      aria-labelledby="agent-workspace-heading"
    >
      <header className="component-heading">
        <h1 id="agent-workspace-heading">
          {ar ? "مساحة عمل سياقية" : "Contextual workspace"}
        </h1>
        <span className="agent-workspace-docs-label">
          {ar ? "تركيب من مكوّنات طراز" : "Composed with Tiraz"}
        </span>
      </header>
      <p className="agent-workspace-docs-intro">
        {ar
          ? "محادثة يظهر العمل بجانبها. يعمل ثلاثة وكلاء، لكلٍّ منهم مهمة واحدة، وتخرج بطاقاتهم وبطاقات القراءة والبحث والفحوص من جانبي المحرر على خيوط، وتبقى حتى تغلقها دون أن تتحرك المحادثة. الردود فوق المحرر، وبعرض بدء المهمة نفسه."
          : "A conversation with the work beside it. Three agents each do one thing; their cards, with reading, research and checks, grow out of the composer’s sides on threads and stay until you close them, so the conversation never moves. Replies sit above the composer, at the same width as TaskStarter."}
      </p>
      <div className="playground-section playground-region">
        <SystemProvider config={config} lang={language}>
          <DemoFrame
            language={language}
            label={ar ? "مثال مساحة العمل" : "Workspace example"}
            code={agentWorkspaceCode(language)}
            fileName="src/AgentWorkspace.tsx"
            openHref="/examples/contextual-workspace"
          >
            <AgentWorkspaceExample
              language={language}
              agentAvatar={<Khayt size={28} animated={false} />}
            />
          </DemoFrame>
        </SystemProvider>
      </div>
      <PromptPanel
        language={language}
        prompt={
          ar
            ? "استخدم ai/examples/AgentWorkspaceExample.tsx من مصدر طراز. حافظ على عرض المحرر 38rem والردود فوقه، والنموذج ومقياس التفكير في صفّه العلوي. اجعل لكل وكيل مهمة واحدة وبطاقة فيها صورة خيط وحالته ووقت عمله وخط تقدّم واحد، واحسب الأوقات من طوابع المضيف. علّق البطاقات على جانبي المحرر بخيوط وخارج المحادثة، وافتحها عند ورود نشاط فعلي، وأبقها حتى يغلقها المستخدم فتصير شارة تعيد فتحها. في الحاويات الضيقة تنتظر الشارات فوق المحرر. اربط الأحداث بكل رد، وأتح للرد السابق إعادة لوحاته. استبدل demo-host بناقل تطبيقك، واحترم اتجاه اللغة وتقليل الحركة."
            : "Use Tiraz’s ai/examples/AgentWorkspaceExample.tsx. Preserve the 38rem composer, replies above it, and the model and effort meter in its top row. Give each agent one task and a card with Khayt, its state, its work time and a single progress line; take times from host timestamps. Attach cards to the composer’s sides on threads, outside the conversation. Open them from actual activity; closing leaves a chip that reopens them. Narrow containers dock the chips above the composer. Bind events to each reply; an earlier reply can bring its panels back. Replace demo-host with the application’s transport. Preserve direction and reduced motion."
        }
      />
      <p className="agent-workspace-docs-note">
        {ar
          ? "مثال محلي بأحداث مُعدّة مسبقًا، دون اتصال بنموذج أو قراءة ملفات. أرسل الطلب لترى الوكلاء يخرجون من المحرر. إغلاق البطاقة يتركها شارة ولا يوقف العمل؛ للإيقاف زر مستقل."
          : "Local example with scripted events; no model connection or file access. Send the request to watch the agents grow out of the composer. Closing a card leaves a chip and the work running; Stop is a separate action."}
      </p>
      <dl className="agent-workspace-docs-parts">
        <div>
          <dt>{ar ? "موجود في طراز" : "Already in Tiraz"}</dt>
          <dd>
            {ar
              ? "محرر الرسائل، رسالة المحادثة، اختيار النموذج، الأزرار والصينية. صورة خيط يوفّرها التطبيق؛ الخط والأسطح والحركة من رموز طراز."
              : "ChatComposer, ChatThreadMessage, ModelSelector, Button and Tray. The host supplies Khayt. Typography, surfaces and motion use Tiraz tokens."}
          </dd>
        </div>
        <div>
          <dt>{ar ? "يملكه تطبيقك" : "Owned by your app"}</dt>
          <dd>
            {ar
              ? "الأحداث والمواد والنتائج وإعدادات النموذج. لوحات الرد الأخير متصلة بالمحرر، ولكل رد اختياراته، والبطاقة المغلقة لا تعود وحدها. وقت العمل يأتي من طوابع المضيف، ومستويات التفكير تطابق ما يدعمه النموذج."
              : "Events, evidence, results and model settings. The latest reply’s panels hang off the composer and each reply keeps its own choices; a closed card never reopens on its own. Work time comes from host timestamps. Map effort levels to supported model capabilities."}
          </dd>
        </div>
        <div>
          <dt>{ar ? "أجزاء تحتاج اعتمادًا" : "Parts to consider next"}</dt>
          <dd>
            {ar
              ? "مقياس التفكير وبطاقات الوكلاء واللوحات المتصلة بالمحرر أجزاء خاصة بالمثال، وليست واجهات عامة بعد. ألوان التفكير المحلية: المريمي والأزرق والمغرة والبرقوقي، وللمغرة قيمتان للفاتح والداكن. نحتاج إلى توثيق ألوان المستويات وعقد النشاط قبل اعتمادها في المكتبة. لا تدرّج زخرفيًا."
              : "The effort meter, agent cards and composer-attached activity panels are example parts, not public APIs. Local effort aliases use sage, blue, ochre and plum; ochre adds a light/dark pair. A shared tier-color and activity contract needs definition before promotion. No decorative gradient was added."}
          </dd>
        </div>
      </dl>
    </section>
  );
}
