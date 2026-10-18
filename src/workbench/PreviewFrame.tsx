import type { ReactNode } from "react";
import { DemoFrame } from "../system/ai/examples/DemoFrame";
import type { ComponentId } from "./catalog";
import type { Language } from "./i18n";
export function PreviewFrame({
  component,
  language,
  code,
  onReplay,
  replayable,
  children,
}: {
  component: ComponentId;
  language: Language;
  code: string;
  onReplay: () => void;
  replayable: boolean;
  children: ReactNode;
}) {
  // StreamingDemo shares this frame but owns replay so its header never remounts.
  if (component === "streaming-text") return children;
  return (
    <DemoFrame
      language={language}
      code={code}
      onReplay={replayable ? onReplay : undefined}
    >
      {children}
    </DemoFrame>
  );
}
