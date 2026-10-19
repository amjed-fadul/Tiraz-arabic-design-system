import type { ComponentProps, ReactNode } from "react";
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
  ...frame
}: {
  component: ComponentId;
  language: Language;
  code: string;
  onReplay: () => void;
  replayable: boolean;
  children: ReactNode;
} & Pick<
  ComponentProps<typeof DemoFrame>,
  | "name"
  | "states"
  | "state"
  | "onStateChange"
  | "notes"
  | "onViewChange"
  | "replaying"
>) {
  // StreamingDemo shares this frame but owns replay so its header never remounts.
  if (component === "streaming-text") return children;
  return (
    <DemoFrame
      language={language}
      code={code}
      onReplay={replayable ? onReplay : undefined}
      {...frame}
    >
      {children}
    </DemoFrame>
  );
}
