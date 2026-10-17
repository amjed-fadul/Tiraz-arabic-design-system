import type { ReactNode } from "react";
import { DemoFrame } from "../system/ai/examples/DemoFrame";
import type { ComponentId } from "./catalog";
import type { Language } from "./i18n";
export function PreviewFrame({
  component,
  language,
  title,
  prompt,
  copyLabel,
  onReplay,
  replayable,
  children,
}: {
  component: ComponentId;
  language: Language;
  title: string;
  prompt: string;
  copyLabel: string;
  onReplay: () => void;
  replayable: boolean;
  children: ReactNode;
}) {
  // StreamingDemo shares this frame but owns replay so its header never remounts.
  if (component === "streaming-text") return children;
  return (
    <DemoFrame
      title={title}
      language={language}
      prompt={prompt}
      copyLabel={copyLabel}
      onReplay={replayable ? onReplay : undefined}
    >
      {children}
    </DemoFrame>
  );
}
