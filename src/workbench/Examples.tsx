import { AIDecisionsExample } from "../system/ai/examples/AIDecisionsExamples";
import { AIContextExample } from "../system/ai/examples/AIContextExamples";
import { ImageResultGenerating } from "../system/ai/examples/AIResultsExamples";
import {
  ChatConversation,
  ChatEntryFailure,
} from "../system/ai/examples/ChatExamples";
import {
  ToolRenderedOutputExample,
  ToolActivityDemo,
} from "../system/ai/examples/ToolActivityExamples";
import { AIFeedbackDemo } from "../system/ai/examples/AIFeedbackExamples";
import {
  StepsFormExample,
  ActivatableStepsExample,
} from "../system/ai/examples/StepsExamples";
import { EntryCompositionExample } from "../system/ai/examples/InputCopyExamples";
import { lazy, Suspense } from "react";
import {
  AlertActionExample,
  SkeletonExamples,
} from "../system/ai/examples/FeedbackExamples";
import { GettingStartedExample } from "../system/ai/examples/EmptyStateExamples";
import { FeedbackForm } from "../system/ai/examples/FeedbackForm";
import { ToastProvider } from "../system";
import { CreateCustomer } from "../system/ai/examples/CreateCustomer";
import type { ComponentId } from "./catalog";
import { hasExamples } from "./demo-capabilities";
import type { Language } from "./i18n";
import { words } from "./i18n";
const AnalyticsExample = lazy(() =>
  import("../system/ai/examples/ChartExamples").then((module) => ({
    default: module.AnalyticsExample,
  })),
);
/**
 * Examples only show what the playground cannot: a flow over time, the
 * component working with others, or an Arabic-first edge case. Everything a
 * playground control can reach stays in the playground.
 */
export function Examples({
  component,
  language,
}: {
  component: ComponentId;
  language: Language;
}) {
  const t = words(language);
  if (!hasExamples(component)) return null;
  if (
    ["ask-user-questions", "approval-card", "approval-flow"].includes(component)
  )
    return <AIDecisionsExample language={language} />;
  if (component === "model-selector" || component === "context-meter")
    return <AIContextExample language={language} />;
  if (component === "image-result")
    return <ImageResultGenerating language={language} />;
  if (component === "chat-thread")
    return <ChatConversation language={language} />;
  if (component === "chat-composer" || component === "prompt-bar")
    return (
      <ChatEntryFailure
        language={language}
        compact={component === "prompt-bar"}
      />
    );
  if (component === "tool-call")
    return (
      <div style={{ display: "grid", gap: "var(--space-8)", minInlineSize: 0 }}>
        <ToolActivityDemo language={language} />
        <ToolRenderedOutputExample language={language} />
      </div>
    );
  if (component === "tool-chips")
    return <ToolActivityDemo language={language} />;
  if (component === "thinking-state")
    return <AIFeedbackDemo language={language} />;
  if (component === "steps")
    return (
      <div
        style={{
          display: "grid",
          gap: "var(--space-8)",
          inlineSize: "100%",
          minInlineSize: 0,
        }}
      >
        <StepsFormExample language={language} />
        <ActivatableStepsExample language={language} />
      </div>
    );
  if (component === "input-copy")
    return <EntryCompositionExample language={language} />;
  if (component === "line-chart" || component === "donut-chart")
    return (
      <Suspense
        fallback={
          <p role="status">{t("جارٍ تحميل الأمثلة…", "Loading examples…")}</p>
        }
      >
        <AnalyticsExample language={language} />
      </Suspense>
    );
  if (component === "alert") return <AlertActionExample language={language} />;
  if (component === "skeleton") return <SkeletonExamples language={language} />;
  if (component === "empty-state")
    return <GettingStartedExample language={language} />;
  if (component === "textarea") return <FeedbackForm language={language} />;
  if (component === "sheet")
    return (
      <ToastProvider
        label={t("تنبيهات العملاء", "Customer notifications")}
        closeLabel={t("إغلاق التنبيه", "Dismiss notification")}
      >
        <CreateCustomer language={language} />
      </ToastProvider>
    );
  return null;
}
